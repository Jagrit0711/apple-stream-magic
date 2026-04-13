const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const serviceHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
});

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: "server_not_configured",
      missing: [
        !SUPABASE_URL ? "SUPABASE_URL" : null,
        !SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean),
    });
  }

  try {
    if (req.method === "GET") {
      const { user_id, watchlist, limit, all } = req.query || {};

      const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/apple_user_content`);
      url.searchParams.set("select", "*");
      if (user_id) {
        url.searchParams.set("user_id", `eq.${user_id}`);
      } else if (all !== "1") {
        return res.status(400).json({ error: "missing_user_id" });
      }
      if (watchlist === "1") {
        url.searchParams.set("in_watchlist", "eq.true");
      }
      url.searchParams.set("order", "last_watched_at.desc");
      url.searchParams.set("limit", String(Number(limit) || 20));

      const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: serviceHeaders(),
      });

      const body = await upstream.text();
      return res.status(upstream.status).send(body || "[]");
    }

    if (req.method === "POST") {
      const payload = req.body || {};
      if (!payload.user_id || !payload.tmdb_id || !payload.media_type) {
        return res.status(400).json({ error: "missing_required_fields" });
      }

      const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/apple_user_content`);
      url.searchParams.set("on_conflict", "user_id,tmdb_id,media_type");

      const upstream = await fetch(url.toString(), {
        method: "POST",
        headers: {
          ...serviceHeaders(),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });

      const body = await upstream.text();
      return res.status(upstream.status).send(body || "[]");
    }

    if (req.method === "PATCH") {
      const payload = req.body || {};
      const { user_id, tmdb_id, updates } = payload;
      if (!user_id || !tmdb_id || !updates || typeof updates !== "object") {
        return res.status(400).json({ error: "missing_required_fields" });
      }

      const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/apple_user_content`);
      url.searchParams.set("user_id", `eq.${user_id}`);
      url.searchParams.set("tmdb_id", `eq.${tmdb_id}`);

      const upstream = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          ...serviceHeaders(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      });

      const body = await upstream.text();
      return res.status(upstream.status).send(body || "[]");
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    return res.status(502).json({
      error: "upstream_unreachable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
