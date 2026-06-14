import { NextRequest, NextResponse } from "next/server";

// Domains we are allowed to proxy
const ALLOWED_HOSTS = [
  "html5.gamedistribution.com",
  "img.gamedistribution.com",
  "assets.gamedistribution.com",
  "cdn.gamedistribution.com",
  "sdk.gamedistribution.com",
  "akamaized.net",
];

const PROXY_BASE = "/api/game-proxy";
const GD_ORIGIN = "https://gamedistribution.com";
const GD_REFERER = "https://gamedistribution.com/";

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}

/**
 * Rewrite absolute URLs in text content (HTML/JS/CSS) so they route
 * through this proxy instead of going directly to the origin.
 */
function rewriteUrls(text: string, proxyBase: string): string {
  // Rewrite https://... GD URLs to proxy paths
  return text
    .replace(
      /https?:\/\/(html5|img|assets|cdn|sdk)\.gamedistribution\.com\//g,
      (_, sub) => `${proxyBase}/${sub}.gamedistribution.com/`
    )
    // Rewrite protocol-relative //host/... to proxy paths
    .replace(
      /(?<![a-zA-Z])(\/\/)(html5|img|assets|cdn|sdk)\.gamedistribution\.com\//g,
      (_, _slashes, sub) => `${proxyBase}/${sub}.gamedistribution.com/`
    )
    // Strip any block-and-redirect utm campaigns injected by the SDK
    .replace(/utm_campaign=block-and-redirect[^"&]*/g, "utm_campaign=play");
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
  const search = req.nextUrl.search;
  const targetUrl = `https://${hostname}/${upstreamPath}${search}`;

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
  const isTextContent =
    contentType.includes("text/html") ||
    contentType.includes("javascript") ||
    contentType.includes("text/css") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain");

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", contentType || "application/octet-stream");
  // Crucially: allow this content to be framed and accessed cross-origin
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  // Remove any upstream frame-busting headers
  responseHeaders.delete("X-Frame-Options");
  responseHeaders.delete("Content-Security-Policy");
  // Cache static assets aggressively, HTML less so
  if (isTextContent && contentType.includes("text/html")) {
    responseHeaders.set("Cache-Control", "no-cache");
  } else {
    responseHeaders.set("Cache-Control", "public, max-age=3600");
  }

  if (!isTextContent) {
    // Binary response (images, audio, wasm, etc.) — stream straight through
    const body = await upstreamResponse.arrayBuffer();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  // Text response — rewrite internal URLs before sending
  const text = await upstreamResponse.text();
  const rewritten = rewriteUrls(text, PROXY_BASE);

  return new NextResponse(rewritten, {
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
