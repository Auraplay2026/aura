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
const GD_ORIGIN = "https://gamedistribution.com";
const GD_REFERER = "https://gamedistribution.com/";
const FAKE_HOST = "html5.gamedistribution.com";
const FAKE_REFERRER = "https://gamedistribution.com/";

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}

/**
 * Script injected as the VERY FIRST thing in every proxied HTML page.
 * Overrides everything the GD SDK could use to detect an unauthorized origin.
 */
const ORIGIN_SPOOF_SCRIPT = `<script>
(function(){
  'use strict';
  var _fakeHost = "${FAKE_HOST}";
  var _fakeOrigin = "https://${FAKE_HOST}";
  var _fakeRef = "${FAKE_REFERRER}";

  /* ── 1. document.referrer ── */
  try {
    Object.defineProperty(document, 'referrer', { get: function(){ return _fakeRef; }, configurable: true });
  } catch(e){}

  /* ── 2. document.domain ── */
  try { document.domain = _fakeHost; } catch(e){}

  /* ── 3. Override window.location via Proxy ──
     Chrome: location is non-configurable on window, but we can shadow it on the
     window's prototype or intercept via a getter on the global object itself.    */
  (function patchLocation(){
    var real = Object.getOwnPropertyDescriptor(window, 'location');
    if (real && real.configurable) {
      Object.defineProperty(window, 'location', {
        get: function(){
          return new Proxy(real.get.call(window), {
            get: function(t, p) {
              if (p === 'hostname') return _fakeHost;
              if (p === 'host')     return _fakeHost;
              if (p === 'origin')   return _fakeOrigin;
              if (p === 'protocol') return 'https:';
              if (p === 'pathname') return '/';
              if (p === 'href')     return _fakeOrigin + '/';
              if (p === 'search')   return '?gd_sdk_referrer_url=' + encodeURIComponent(_fakeRef);
              if (p === 'replace' || p === 'assign') return function(u){
                // Only allow same-proxy-origin navigations
                if (typeof u === 'string' && u.indexOf('gamedistribution.com') !== -1 && u.indexOf('block') === -1) {
                  t.replace.call(t, u.replace(/https?:\\/\\/html5\\.gamedistribution\\.com\\//g, '/api/game-proxy/html5.gamedistribution.com/'));
                }
                // block everything else (redirect hijacks)
              };
              var v = t[p];
              return typeof v === 'function' ? v.bind(t) : v;
            }
          });
        },
        configurable: true
      });
    }
  })();

  /* ── 4. window.top / window.parent ── */
  (function patchAncestors(){
    ['top','parent'].forEach(function(key){
      try {
        Object.defineProperty(window, key, {
          get: function(){
            return new Proxy(window, {
              get: function(t, p){
                if (p === 'location') return { hostname:_fakeHost, host:_fakeHost, origin:_fakeOrigin, href:_fakeOrigin+'/', pathname:'/', protocol:'https:', search:'', replace:function(){}, assign:function(){} };
                var v = t[p];
                return typeof v === 'function' ? v.bind(t) : v;
              }
            });
          },
          configurable: true
        });
      } catch(e){}
    });
  })();

  /* ── 5. XMLHttpRequest intercept ── */
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    if (typeof url === 'string') {
      // Rewrite GD API domain to go through our proxy so we can spoof the domain param
      url = url.replace(/https?:\\/\\/api\\.gamedistribution\\.com\\//g, '/api/game-proxy/api.gamedistribution.com/');
      url = url.replace(/https?:\\/\\/html5\\.api\\.gamedistribution\\.com\\//g, '/api/game-proxy/html5.api.gamedistribution.com/');
      // Block block-and-redirect calls entirely
      if (url.indexOf('block-and-redirect') !== -1 || url.indexOf('block_and_redirect') !== -1) {
        url = 'about:blank';
      }
    }
    return _xhrOpen.apply(this, arguments);
  };

  /* ── 6. fetch intercept ── */
  if (window.fetch) {
    var _origFetch = window.fetch.bind(window);
    window.fetch = function(input, init){
      var url = (typeof input === 'string') ? input : (input && input.url) || '';
      if (url.indexOf('block-and-redirect') !== -1 || url.indexOf('block_and_redirect') !== -1) {
        return Promise.resolve(new Response('{}', {status:200}));
      }
      // Rewrite GD API calls through proxy
      if (typeof input === 'string') {
        input = input.replace(/https?:\\/\\/api\\.gamedistribution\\.com\\//g, '/api/game-proxy/api.gamedistribution.com/');
        input = input.replace(/https?:\\/\\/html5\\.api\\.gamedistribution\\.com\\//g, '/api/game-proxy/html5.api.gamedistribution.com/');
      }
      return _origFetch(input, init);
    };
  }

  /* ── 7. window.open hijack prevention ── */
  window.open = function(){ return null; };

})();
</script>`;

/**
 * Patch GD SDK JavaScript to disable origin checking code.
 * Applied to all proxied JavaScript files.
 */
function patchGdSdkJs(js: string): string {
  return js
    // Neutralize "Not found at origin" message display
    .replace(/"Not found at origin[^"]*"/g, '"Game is loading..."')
    .replace(/'Not found at origin[^']*'/g, "'Game is loading...'")
    // Rewrite any hard-coded GD domains in JS to go through proxy
    .replace(
      /https?:\/\/(html5|img|assets|cdn|sdk|api|html5\.api)\.gamedistribution\.com\//g,
      (_, sub) => `/api/game-proxy/${sub}.gamedistribution.com/`
    )
    // Block block-and-redirect patterns in string constants
    .replace(/utm_campaign=block-and-redirect/g, "utm_campaign=playing");
}

/**
 * Rewrite absolute URLs in text content (HTML/JS/CSS) so they route
 * through this proxy instead of going directly to the origin.
 */
function rewriteUrls(text: string, proxyBase: string): string {
  return text
    // Rewrite https://... GD URLs to proxy paths
    .replace(
      /https?:\/\/(html5|img|assets|cdn|sdk|api|html5\.api)\.gamedistribution\.com\//g,
      (_, sub) => `${proxyBase}/${sub}.gamedistribution.com/`
    )
    // Rewrite protocol-relative //host/... to proxy paths
    .replace(
      /(?<![a-zA-Z:])\/\/(html5|img|assets|cdn|sdk|api|html5\.api)\.gamedistribution\.com\//g,
      (_, sub) => `${proxyBase}/${sub}.gamedistribution.com/`
    );
}

/**
 * Inject the origin-spoof script as the very first child of <head>.
 */
function injectSpoofScript(html: string): string {
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1${ORIGIN_SPOOF_SCRIPT}`);
  }
  return ORIGIN_SPOOF_SCRIPT + html;
}

/**
 * Spoof the domain parameter in GD API verification requests.
 * GD API calls look like: /v5/?key=...&domain=aura-k061.onrender.com
 * We rewrite the domain param to gamedistribution.com.
 */
function spoofApiParams(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("domain")) {
      parsed.searchParams.set("domain", "gamedistribution.com");
    }
    if (parsed.searchParams.has("origin")) {
      parsed.searchParams.set("origin", "https://gamedistribution.com");
    }
    return parsed.toString();
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

  // Reconstruct the real upstream URL
  const upstreamPath = rest.join("/");
  const searchParams = new URLSearchParams(req.nextUrl.search);

  // Always set gd_sdk_referrer_url to gamedistribution.com
  searchParams.set("gd_sdk_referrer_url", GD_REFERER);
  // Spoof domain-related params for API verification calls
  if (searchParams.has("domain")) {
    searchParams.set("domain", "gamedistribution.com");
  }

  let targetUrl = `https://${hostname}/${upstreamPath}?${searchParams.toString()}`;

  // For API routes, also spoof any domain params in the path
  if (hostname.includes("api.gamedistribution.com")) {
    targetUrl = spoofApiParams(targetUrl);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: GD_REFERER,
        Origin: GD_ORIGIN,
        Host: hostname,
        Accept: req.headers.get("Accept") || "*/*",
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
  const isJs =
    contentType.includes("javascript") || contentType.includes("ecmascript");
  const isTextContent =
    isHtml ||
    isJs ||
    contentType.includes("text/css") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain");

  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    contentType || "application/octet-stream"
  );
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  // Strip all frame-busting headers from upstream
  responseHeaders.delete("X-Frame-Options");
  responseHeaders.delete("Content-Security-Policy");
  responseHeaders.delete("Cross-Origin-Embedder-Policy");
  responseHeaders.delete("Cross-Origin-Opener-Policy");
  responseHeaders.set("Cache-Control", isHtml ? "no-cache" : "public, max-age=3600");

  if (!isTextContent) {
    const body = await upstreamResponse.arrayBuffer();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  let text = await upstreamResponse.text();

  // Rewrite all GD domain URLs to go through proxy
  text = rewriteUrls(text, PROXY_BASE);

  if (isHtml) {
    // Inject origin-spoof script at the very top of <head>
    text = injectSpoofScript(text);
  }

  if (isJs) {
    // Patch GD SDK JavaScript to disable origin checking
    text = patchGdSdkJs(text);
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
