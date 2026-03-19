/**
 * Apple Stream Magic — TMDB Proxy Worker
 * Deploy this to Cloudflare Workers (free tier is plenty).
 *
 * Routes:
 *   /api/tmdb/*  → https://api.themoviedb.org/3/*
 *   /api/img/*   → https://image.tmdb.org/t/p/*
 *
 * CORS is fully open so the browser can call it directly.
 */

const TMDB_API  = "https://api.themoviedb.org/3";
const TMDB_IMG  = "https://image.tmdb.org/t/p";

// Your TMDB Bearer token — safe to keep here since it's read-only
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYWRhYzNmMzBhMmI3MDRiMDFmZDk3NzEwOWUxY2I5OSIsIm5iZiI6MTcyODQ2ODkwMC4zNDIwMDAyLCJzdWIiOiI2NzA2NTdhNGRjNTRmMjlkMGVhYjViYTciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.yIMztIJtw7BbDEw0UhbWzA4Hh7ovRhzTstcvVcMatyE";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export default {
  async fetch(request) {
    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const { pathname, search } = url;

    let upstreamUrl;

    if (pathname.startsWith("/api/tmdb/")) {
      // e.g. /api/tmdb/trending/all/week → https://api.themoviedb.org/3/trending/all/week
      const tmdbPath = pathname.replace("/api/tmdb", "");
      upstreamUrl = `${TMDB_API}${tmdbPath}${search}`;
    } else if (pathname.startsWith("/api/img/")) {
      // e.g. /api/img/w500/abc.jpg → https://image.tmdb.org/t/p/w500/abc.jpg
      const imgPath = pathname.replace("/api/img", "");
      upstreamUrl = `${TMDB_IMG}${imgPath}${search}`;
    } else {
      return new Response("Not found", { status: 404, headers: CORS_HEADERS });
    }

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        cf: { cacheTtl: 300, cacheEverything: true }, // Cache 5 min at edge
      });

      // Stream the response back, injecting CORS headers
      const responseHeaders = new Headers(upstreamRes.headers);
      Object.entries(CORS_HEADERS).forEach(([k, v]) => responseHeaders.set(k, v));

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upstream fetch failed", message: String(err) }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
