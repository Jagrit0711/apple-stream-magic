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

const isMissingRelationResponse = (status, text) =>
  status === 404 || /relation .* does not exist/i.test(String(text || ""));

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

      const base = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
      const buildUrl = (table) => {
        const url = new URL(`${base}/${table}`);
        url.searchParams.set("select", "*");
        if (user_id) {
          url.searchParams.set("user_id", `eq.${user_id}`);
        } else if (all !== "1") {
          return null;
        }
        if (watchlist === "1") {
          url.searchParams.set("in_watchlist", "eq.true");
        }
        url.searchParams.set("order", "last_watched_at.desc");
        url.searchParams.set("limit", String(Number(limit) || 20));
        return url;
      };

      const url = buildUrl("apple_user_content");
      if (!url) {
        return res.status(400).json({ error: "missing_user_id" });
      }

      let upstream = await fetch(url.toString(), {
        method: "GET",
        headers: serviceHeaders(),
      });
      let body = await upstream.text();

      if (isMissingRelationResponse(upstream.status, body)) {
        const fallbackUrl = buildUrl("watch_history");
        if (fallbackUrl) {
          upstream = await fetch(fallbackUrl.toString(), {
            method: "GET",
            headers: serviceHeaders(),
          });
          body = await upstream.text();
        }
      }

      return res.status(upstream.status).send(body || "[]");
    }

    if (req.method === "POST") {
      const payload = req.body || {};
      if (!payload.user_id || !payload.tmdb_id || !payload.media_type) {
        return res.status(400).json({ error: "missing_required_fields" });
      }

      const base = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
      const buildUrl = (table) => {
        const url = new URL(`${base}/${table}`);
        url.searchParams.set("on_conflict", "user_id,tmdb_id,media_type");
        return url;
      };

      const url = buildUrl("apple_user_content");

      let upstream = await fetch(url.toString(), {
        method: "POST",
        headers: {
          ...serviceHeaders(),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });
      let body = await upstream.text();

      if (isMissingRelationResponse(upstream.status, body)) {
        const fallbackPayload = {
          user_id: payload.user_id,
          tmdb_id: payload.tmdb_id,
          media_type: payload.media_type,
          title: payload.title || `Content ${payload.tmdb_id}`,
          poster_path: payload.poster_path || null,
          backdrop_path: payload.backdrop_path || null,
          progress: Number(payload.progress || 0),
          duration: payload.duration ?? null,
          season: payload.season ?? null,
          episode: payload.episode ?? null,
          last_watched_at: payload.last_watched_at || new Date().toISOString(),
        };

        upstream = await fetch(buildUrl("watch_history").toString(), {
          method: "POST",
          headers: {
            ...serviceHeaders(),
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify(fallbackPayload),
        });
        body = await upstream.text();
      }

      return res.status(upstream.status).send(body || "[]");
    }

    if (req.method === "PATCH") {
      const payload = req.body || {};
      const { user_id, tmdb_id, updates } = payload;
      if (!user_id || !tmdb_id || !updates || typeof updates !== "object") {
        return res.status(400).json({ error: "missing_required_fields" });
      }

      const base = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
      const buildUrl = (table) => {
        const url = new URL(`${base}/${table}`);
        url.searchParams.set("user_id", `eq.${user_id}`);
        url.searchParams.set("tmdb_id", `eq.${tmdb_id}`);
        return url;
      };

      const url = buildUrl("apple_user_content");

      let upstream = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          ...serviceHeaders(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      });
      let body = await upstream.text();

      if (isMissingRelationResponse(upstream.status, body)) {
        const fallbackUpdates = {
          progress: updates.progress,
          duration: updates.duration,
          season: updates.season,
          episode: updates.episode,
          last_watched_at: updates.last_watched_at || new Date().toISOString(),
        };

        upstream = await fetch(buildUrl("watch_history").toString(), {
          method: "PATCH",
          headers: {
            ...serviceHeaders(),
            Prefer: "return=representation",
          },
          body: JSON.stringify(fallbackUpdates),
        });
        body = await upstream.text();
      }

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
