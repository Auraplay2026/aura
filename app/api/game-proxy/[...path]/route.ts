import { NextRequest, NextResponse } from "next/server";

// Domains we are allowed to proxy
const ALLOWED_HOSTS = [
  "html5.gamedistribution.com",
  "img.gamedistribution.com",
  "assets.gamedistribution.com",
  "cdn.gamedistribution.com",
  "sdk.gamedistribution.com",
  "html5.api.gamedistribution.com",
  "api.gamedistribution.com",
  "akamaized.net",
];

const PROXY_BASE = "/api/game-proxy";
const GD_ORIGIN  = "https://gamedistribution.com";
const GD_REFERER = "https://gamedistribution.com/";

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}

/**
 * Minimal, safe origin-spoof script injected at the top of every HTML page.
 * Only touches things that are reliably configurable in all browsers.
 */
const SPOOF_SCRIPT = `<script>
(function(){
  /* document.referrer IS configurable in all browsers */
  try {
    Object.defineProperty(document,'referrer',{
      get:function(){ return 'https://gamedistribution.com/'; },
      configurable:true
    });
  } catch(e){}

  /* Intercept XHR calls that go to GD API to spoof domain param */
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
    if (typeof url === 'string') {
      /* Proxy GD API verification calls through our server */
      url = url
        .replace(/https?:\/\/api\.gamedistribution\.com\//g,
                 '/api/game-proxy/api.gamedistribution.com/')
        .replace(/https?:\/\/html5\.api\.gamedistribution\.com\//g,
                 '/api/game-proxy/html5.api.gamedistribution.com/');
      /* Block redirect-to-block-page calls */
      if (url.indexOf('block-and-redirect') !== -1) {
        url = 'data:application/json,{}';
      }
    }
    return _xhrOpen.call(this, method, url, async !== false, user, pass);
  };

  /* Same for fetch */
  if (window.fetch) {
    var _origFetch = window.fetch;
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf('block-and-redirect') !== -1) {
        return Promise.resolve(new Response('{}', {status:200,headers:{'Content-Type':'application/json'}}));
      }
      if (typeof input === 'string') {
        input = input
          .replace(/https?:\/\/api\.gamedistribution\.com\//g,
                   '/api/game-proxy/api.gamedistribution.com/')
          .replace(/https?:\/\/html5\.api\.gamedistribution\.com\//g,
                   '/api/game-proxy/html5.api.gamedistribution.com/');
      }
      return _origFetch.call(window, input, init);
    };
  }

  /* Prevent games from opening new tabs */
  window.open = function(){ return null; };
})();
</script>`;

function rewriteUrls(text: string): string {
  return text
    .replace(
      /https?:\/\/(html5|img|assets|cdn|sdk|api|html5\.api)\.gamedistribution\.com\//g,
      (_, sub) => `${PROXY_BASE}/${sub}.gamedistribution.com/`
    )
    .replace(
      /(?<![a-zA-Z:])\/\/(html5|img|assets|cdn|sdk|api|html5\.api)\.gamedistribution\.com\//g,
      (_, sub) => `${PROXY_BASE}/${sub}.gamedistribution.com/`
    );
}

function injectSpoof(html: string): string {
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1${SPOOF_SCRIPT}`);
  }
  return SPOOF_SCRIPT + html;
}

function spoofApiDomainParam(url: string): string {
  try {
    const u = new URL(url);
    if (u.searchParams.has("domain")) u.searchParams.set("domain", "gamedistribution.com");
    if (u.searchParams.has("origin")) u.searchParams.set("origin", "https://gamedistribution.com");
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const [hostname, ...rest] = path;

  if (!isAllowedHost(hostname)) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  const upstreamPath = rest.join("/");
  const searchParams = new URLSearchParams(req.nextUrl.search);
  searchParams.set("gd_sdk_referrer_url", GD_REFERER);
  if (searchParams.has("domain")) searchParams.set("domain", "gamedistribution.com");

  let targetUrl = `https://${hostname}/${upstreamPath}?${searchParams.toString()}`;
  if (hostname.includes("api.gamedistribution.com")) {
    targetUrl = spoofApiDomainParam(targetUrl);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer:  GD_REFERER,
        Origin:   GD_ORIGIN,
        Accept:   req.headers.get("Accept") || "*/*",
        "Accept-Encoding": "identity",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
  } catch (err) {
    console.error("[game-proxy] fetch error:", err);
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  const contentType = upstreamResponse.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html");
  const isText =
    isHtml ||
    contentType.includes("javascript") ||
    contentType.includes("text/css") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain");

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", contentType || "application/octet-stream");
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  responseHeaders.delete("X-Frame-Options");
  responseHeaders.delete("Content-Security-Policy");
  responseHeaders.delete("Cross-Origin-Embedder-Policy");
  responseHeaders.delete("Cross-Origin-Opener-Policy");
  responseHeaders.set("Cache-Control", isHtml ? "no-cache" : "public, max-age=3600");

  if (!isText) {
    const body = await upstreamResponse.arrayBuffer();
    return new NextResponse(body, { status: upstreamResponse.status, headers: responseHeaders });
  }

  let text = await upstreamResponse.text();
  // Rewrite GD URLs in HTML and JS so assets load through proxy
  text = rewriteUrls(text);
  // Inject spoof script only in HTML (not in JS - to avoid breaking game scripts)
  if (isHtml) text = injectSpoof(text);

  return new NextResponse(text, { status: upstreamResponse.status, headers: responseHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
