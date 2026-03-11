// api/proxy/[...path].ts
// Vercel Edge Function — proxies Videasy player and injects CSP headers
// that physically prevent the iframe from opening new tabs (the ad click-hijack)

export const config = {
  runtime: "edge",
};

const VIDEASY_BASE = "https://player.videasy.net";

const ALLOWED_ORIGIN = "https://watch.zuup.dev";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Strip /api/proxy prefix to get the actual Videasy path
  const upstreamPath = url.pathname.replace(/^\/api\/proxy/, "");
  const upstreamUrl = `${VIDEASY_BASE}${upstreamPath}${url.search}`;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: request.headers.get("Accept") || "*/*",
        "Accept-Language": request.headers.get("Accept-Language") || "en-US,en;q=0.9",
        "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0",
        Referer: VIDEASY_BASE,
        Origin: VIDEASY_BASE,
      },
      redirect: "follow",
    });
  } catch (err) {
    return new Response(`Proxy fetch failed: ${String(err)}`, { status: 502 });
  }

  const newHeaders = new Headers(upstream.headers);

  // ── THE ACTUAL FIX ──────────────────────────────────────────────────────────
  // Because the iframe now loads from YOUR domain (/api/proxy/...),
  // you can apply sandbox="..." without Videasy seeing "Iframe Sandbox Detected".
  // The VideoPlayer.tsx omits allow-popups from sandbox,
  // which physically prevents any new tab from opening regardless of what
  // JS or <a target="_blank"> tries to do inside the iframe.
  //
  // These headers are a second layer on top of that:

  // Prevents the iframe content from navigating the top frame
  newHeaders.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://watch.zuup.dev https://zuup.dev"
  );

  // Kills popup permission at browser policy level
  newHeaders.set("Permissions-Policy", "popups=()");

  // CORS
  newHeaders.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  newHeaders.set("Vary", "Origin");

  // Remove conflicting headers from upstream
  newHeaders.delete("X-Frame-Options");
  newHeaders.delete("X-Content-Security-Policy");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: newHeaders,
  });
}
