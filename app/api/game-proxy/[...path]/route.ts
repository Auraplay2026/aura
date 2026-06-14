import { NextRequest, NextResponse } from "next/server";

// Domains we are allowed to proxy
const ALLOWED_HOSTS = [
  "html5.gamedistribution.com",
  "img.gamedistribution.com",
  "assets.gamedistribution.com",
  "cdn.gamedistribution.com",
  "sdk.gamedistribution.com",
  "html5.api.gamedistribution.com",
  "akamaized.net",
];

const PROXY_BASE = "/api/game-proxy";
const GD_ORIGIN = "https://gamedistribution.com";
const GD_REFERER = "https://gamedistribution.com/";
const FAKE_HOST = "html5.gamedistribution.com";

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}

/**
 * Script injected as the FIRST thing inside <head> in every proxied HTML page.
 * It overrides the browser APIs that the GD SDK uses to detect the embedding domain,
 * making the game believe it is running on gamedistribution.com itself.
 */
const ORIGIN_SPOOF_SCRIPT = `<script>
(function(){
  var _fakeHost = "${FAKE_HOST}";
  var _fakeOrigin = "https://${FAKE_HOST}";
  var _fakeHref = "https://${FAKE_HOST}/";

  // 1. Override document.referrer so the SDK sees gamedistribution.com as the referrer
  try {
    Object.defineProperty(document, 'referrer', {
      get: function() { return "https://gamedistribution.com/"; },
      configurable: true
    });
  } catch(e) {}

  // 2. Patch window.location to return fake host/origin
  try {
    var _realLocation = window.location;
    var _fakeLocation = new Proxy(_realLocation, {
      get: function(target, prop) {
        if (prop === 'hostname') return _fakeHost;
        if (prop === 'host') return _fakeHost;
        if (prop === 'origin') return _fakeOrigin;
        if (prop === 'href') return _fakeHref;
        if (prop === 'protocol') return 'https:';
        if (prop === 'pathname') return '/';
        if (prop === 'search') return '';
        if (prop === 'assign' || prop === 'replace' || prop === 'reload') {
          return function(){};  // block any location.replace() hijacks
        }
        var val = target[prop];
        if (typeof val === 'function') return val.bind(target);
        return val;
      }
    });
    try {
      Object.defineProperty(window, 'location', {
        get: function() { return _fakeLocation; },
        configurable: true
      });
    } catch(e) {}
  } catch(e) {}

  // 3. Block window.top.location / window.parent.location access from leaking real host
  //    The SDK sometimes checks window.top.location.hostname
  try {
    ['top','parent'].forEach(function(key){
      try {
        Object.defineProperty(window, key, {
          get: function() {
            return new Proxy(window, {
              get: function(t, p) {
                if (p === 'location') return { hostname: _fakeHost, host: _fakeHost, origin: _fakeOrigin, href: _fakeHref, pathname:'/', protocol:'https:', search:'' };
                if (p === 'document') return document;
                var v = t[p];
                if (typeof v === 'function') return v.bind(t);
                return v;
              }
            });
          },
          configurable: true
        });
      } catch(e2) {}
    });
  } catch(e) {}

  // 4. Block XMLHttpRequest / fetch redirects to block-and-redirect
  var _origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && url.indexOf('block-and-redirect') !== -1) return;
    return _origOpen.apply(this, arguments);
  };

  var _origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf('block-and-redirect') !== -1) return Promise.resolve(new Response('{}'));
    return _origFetch.apply(this, arguments);
  };
})();
</script>`;

/**
 * Rewrite absolute URLs in text content (HTML/JS/CSS) so they route
 * through this proxy instead of going directly to the origin.
 */
function rewriteUrls(text: string, proxyBase: string): string {
  return text
    // Rewrite https://... GD URLs to proxy paths
    .replace(
      /https?:\/\/(html5|img|assets|cdn|sdk|html5\.api)\.gamedistribution\.com\//g,
      (_, sub) => `${proxyBase}/${sub}.gamedistribution.com/`
    )
    // Rewrite protocol-relative //host/... to proxy paths
    .replace(
      /(?<![a-zA-Z:])\/\/(html5|img|assets|cdn|sdk)\.gamedistribution\.com\//g,
      (_, sub) => `${proxyBase}/${sub}.gamedistribution.com/`
    )
    // Strip any block-and-redirect utm params injected by the SDK
    .replace(/[?&]utm_source=[^"&\s]*/g, "")
    .replace(/[?&]utm_medium=[^"&\s]*/g, "")
    .replace(/[?&]utm_campaign=[^"&\s]*/g, "");
}

/**
 * Inject the origin-spoof script as the very first child of <head>.
 * If there's no <head>, inject before the first <script> or at the top.
 */
function injectSpoofScript(html: string): string {
  // Try to inject right after <head> opening tag
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1${ORIGIN_SPOOF_SCRIPT}`);
  }
  // Fallback: inject at the very top
  return ORIGIN_SPOOF_SCRIPT + html;
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

  // Reconstruct the real upstream URL, stripping any gd_sdk_referrer_url we may have set
  const upstreamPath = rest.join("/");
  const searchParams = new URLSearchParams(req.nextUrl.search);
  // Always tell the GD SDK that the referrer is gamedistribution.com
  searchParams.set("gd_sdk_referrer_url", "https://gamedistribution.com/");
  const targetUrl = `https://${hostname}/${upstreamPath}?${searchParams.toString()}`;

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: GD_REFERER,
        Origin: GD_ORIGIN,
        Accept: req.headers.get("Accept") || "*/*",
        "Accept-Encoding": "identity", // avoid compressed responses we can't rewrite
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
  const isTextContent =
    isHtml ||
    contentType.includes("javascript") ||
    contentType.includes("text/css") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain");

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", contentType || "application/octet-stream");
  // Allow cross-origin embedding
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  // Remove any upstream frame-busting headers
  responseHeaders.delete("X-Frame-Options");
  responseHeaders.delete("Content-Security-Policy");
  responseHeaders.set("Cache-Control", isHtml ? "no-cache" : "public, max-age=3600");

  if (!isTextContent) {
    // Binary response (images, audio, wasm, etc.) — stream straight through
    const body = await upstreamResponse.arrayBuffer();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  // Text response — rewrite internal URLs and inject anti-detection script
  let text = await upstreamResponse.text();
  text = rewriteUrls(text, PROXY_BASE);

  // For HTML pages: inject the origin spoof script at the very top of <head>
  if (isHtml) {
    text = injectSpoofScript(text);
  }

  return new NextResponse(text, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
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
