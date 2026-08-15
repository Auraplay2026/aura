import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Universal Sports Video HLS / M3U8 Streaming Proxy
 * Proxies live HLS playlists and video chunks with guaranteed CORS headers (*),
 * auto-rewriting internal relative M3U8 chunk URLs to route through the proxy.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    const targetParsed = new URL(targetUrl);
    const origin = targetParsed.origin;
    const basePath = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": origin,
        "Accept": "*/*"
      },
      // Short timeout to prevent hanging
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/vnd.apple.mpegurl";
    const isM3U8 = targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("x-mpegurl");

    if (isM3U8) {
      const text = await response.text();
      // Rewrite internal relative URLs to route through this proxy
      const rewritten = text
        .split("\n")
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            // Check for URI="..." inside tags like #EXT-X-KEY or #EXT-X-MAP
            if (trimmed.includes('URI="')) {
              return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
                const absolute = uri.startsWith("http") ? uri : new URL(uri, basePath).href;
                return `URI="/api/sports/video-proxy?url=${encodeURIComponent(absolute)}"`;
              });
            }
            return line;
          }
          // It's a chunk URL
          const absolute = trimmed.startsWith("http") ? trimmed : new URL(trimmed, basePath).href;
          return `/api/sports/video-proxy?url=${encodeURIComponent(absolute)}`;
        })
        .join("\n");

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }

    // Video Chunks (TS / M4S / AAC / MP4)
    const blob = await response.arrayBuffer();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Proxy failure: ${err.message}` }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}
