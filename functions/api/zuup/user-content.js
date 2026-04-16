const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  Vary: "Origin",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

const jsonResponse = (payload, status, origin) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });

const textResponse = (payload, status, origin) =>
  new Response(payload, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });

const safeJsonParse = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return null;
  }
};

const serviceHeaders = (serviceRole) => ({
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  "Content-Type": "application/json",
});

const isMissingRelationResponse = (status, text) =>
  status === 404 || /relation .* does not exist/i.test(String(text || ""));

export const onRequestOptions = async ({ request }) =>
  new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin") || "*"),
  });

export const onRequestGet = async ({ request, env }) => {
  const origin = request.headers.get("Origin") || "*";
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRole) {
    return jsonResponse(
      {
        error: "server_not_configured",
        missing: [
          !supabaseUrl ? "SUPABASE_URL" : null,
          !serviceRole ? "SUPABASE_SERVICE_ROLE_KEY" : null,
        ].filter(Boolean),
      },
      500,
      origin,
    );
  }

  try {
    const reqUrl = new URL(request.url);
    const userId = reqUrl.searchParams.get("user_id") || "";
    const watchlist = reqUrl.searchParams.get("watchlist") || "";
    const limit = reqUrl.searchParams.get("limit") || "20";
    const all = reqUrl.searchParams.get("all") || "";

    const base = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
    const buildUrl = (table) => {
      const url = new URL(`${base}/${table}`);
      url.searchParams.set("select", "*");
      if (userId) {
        url.searchParams.set("user_id", `eq.${userId}`);
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
      return jsonResponse({ error: "missing_user_id" }, 400, origin);
    }

    let upstream = await fetch(url.toString(), {
      method: "GET",
      headers: serviceHeaders(serviceRole),
    });
    let body = await upstream.text();

    if (isMissingRelationResponse(upstream.status, body)) {
      const fallbackUrl = buildUrl("watch_history");
      if (fallbackUrl) {
        upstream = await fetch(fallbackUrl.toString(), {
          method: "GET",
          headers: serviceHeaders(serviceRole),
        });
        body = await upstream.text();
      }
    }

    return textResponse(body || "[]", upstream.status, origin);
  } catch (error) {
    return jsonResponse(
      {
        error: "upstream_unreachable",
        message: error instanceof Error ? error.message : String(error),
      },
      502,
      origin,
    );
  }
};

export const onRequestPost = async ({ request, env }) => {
  const origin = request.headers.get("Origin") || "*";
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRole) {
    return jsonResponse(
      {
        error: "server_not_configured",
        missing: [
          !supabaseUrl ? "SUPABASE_URL" : null,
          !serviceRole ? "SUPABASE_SERVICE_ROLE_KEY" : null,
        ].filter(Boolean),
      },
      500,
      origin,
    );
  }

  const payload = safeJsonParse(await request.text());
  if (payload === null) {
    return jsonResponse({ error: "invalid_json" }, 400, origin);
  }

  if (!payload.user_id || !payload.tmdb_id || !payload.media_type) {
    return jsonResponse({ error: "missing_required_fields" }, 400, origin);
  }

  try {
    const base = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
    const buildUrl = (table) => {
      const url = new URL(`${base}/${table}`);
      url.searchParams.set("on_conflict", "user_id,tmdb_id,media_type");
      return url;
    };

    let upstream = await fetch(buildUrl("apple_user_content").toString(), {
      method: "POST",
      headers: {
        ...serviceHeaders(serviceRole),
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
          ...serviceHeaders(serviceRole),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(fallbackPayload),
      });
      body = await upstream.text();
    }

    return textResponse(body || "[]", upstream.status, origin);
  } catch (error) {
    return jsonResponse(
      {
        error: "upstream_unreachable",
        message: error instanceof Error ? error.message : String(error),
      },
      502,
      origin,
    );
  }
};

export const onRequestPatch = async ({ request, env }) => {
  const origin = request.headers.get("Origin") || "*";
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRole) {
    return jsonResponse(
      {
        error: "server_not_configured",
        missing: [
          !supabaseUrl ? "SUPABASE_URL" : null,
          !serviceRole ? "SUPABASE_SERVICE_ROLE_KEY" : null,
        ].filter(Boolean),
      },
      500,
      origin,
    );
  }

  const payload = safeJsonParse(await request.text());
  if (payload === null) {
    return jsonResponse({ error: "invalid_json" }, 400, origin);
  }

  const { user_id: userId, tmdb_id: tmdbId, updates } = payload;
  if (!userId || !tmdbId || !updates || typeof updates !== "object") {
    return jsonResponse({ error: "missing_required_fields" }, 400, origin);
  }

  try {
    const base = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
    const buildUrl = (table) => {
      const url = new URL(`${base}/${table}`);
      url.searchParams.set("user_id", `eq.${userId}`);
      url.searchParams.set("tmdb_id", `eq.${tmdbId}`);
      return url;
    };

    let upstream = await fetch(buildUrl("apple_user_content").toString(), {
      method: "PATCH",
      headers: {
        ...serviceHeaders(serviceRole),
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
          ...serviceHeaders(serviceRole),
          Prefer: "return=representation",
        },
        body: JSON.stringify(fallbackUpdates),
      });
      body = await upstream.text();
    }

    return textResponse(body || "[]", upstream.status, origin);
  } catch (error) {
    return jsonResponse(
      {
        error: "upstream_unreachable",
        message: error instanceof Error ? error.message : String(error),
      },
      502,
      origin,
    );
  }
};

export const onRequest = async (context) => {
  const { request } = context;

  if (request.method === "OPTIONS") return onRequestOptions(context);
  if (request.method === "GET") return onRequestGet(context);
  if (request.method === "POST") return onRequestPost(context);
  if (request.method === "PATCH") return onRequestPatch(context);

  return jsonResponse(
    {
      error: "method_not_allowed",
      method: request.method,
      expected: ["GET", "POST", "PATCH", "OPTIONS"],
    },
    405,
    request.headers.get("Origin") || "*",
  );
};
