const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  Vary: "Origin",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
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
    const email = reqUrl.searchParams.get("email") || "";
    const limit = reqUrl.searchParams.get("limit") || "250";

    const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/apple_profiles`);
    url.searchParams.set("select", "*");
    if (userId) url.searchParams.set("user_id", `eq.${userId}`);
    if (email) url.searchParams.set("email", `eq.${String(email).toLowerCase()}`);
    url.searchParams.set("order", "updated_at.desc");
    url.searchParams.set("limit", String(Number(limit) || 250));

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: serviceHeaders(serviceRole),
    });

    const body = await upstream.text();
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

  const { user_id: userId, updates } = payload;
  if (!userId || !updates || typeof updates !== "object") {
    return jsonResponse({ error: "missing_required_fields" }, 400, origin);
  }

  try {
    const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/apple_profiles`);
    url.searchParams.set("user_id", `eq.${userId}`);

    const upstream = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        ...serviceHeaders(serviceRole),
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    });

    const body = await upstream.text();
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
  if (request.method === "PATCH") return onRequestPatch(context);

  return jsonResponse(
    {
      error: "method_not_allowed",
      method: request.method,
      expected: ["GET", "PATCH", "OPTIONS"],
    },
    405,
    request.headers.get("Origin") || "*",
  );
};
