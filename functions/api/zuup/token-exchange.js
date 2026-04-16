const OAUTH_TOKEN_ENDPOINT =
  (typeof process !== "undefined" &&
    process?.env?.ZUUP_TOKEN_URL) ||
  (typeof process !== "undefined" &&
    process?.env?.ZUUP_OAUTH_TOKEN_URL) ||
  "https://auth.zuup.dev/api/oauth/token";

const DEFAULT_CLIENT_ID = "44d62b038a1e5ae27fd071955bd2cad0";
const DEFAULT_REDIRECT_URI = "https://watch.zuup.dev/auth/zuup/callback";

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  Vary: "Origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

const safeJsonParse = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const raw = atob(padded);
    return safeJsonParse(raw);
  } catch {
    return null;
  }
};

const jsonResponse = (payload, status, origin) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });

export const onRequestOptions = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin") || "*"),
  });
};

export const onRequestPost = async ({ request, env }) => {
  const origin = request.headers.get("Origin") || "*";

  const parsedBody = safeJsonParse(await request.text());
  if (parsedBody === null) {
    return jsonResponse({ error: "invalid_json" }, 400, origin);
  }

  const code = typeof parsedBody.code === "string" ? parsedBody.code.trim() : "";
  const codeVerifier =
    typeof parsedBody.code_verifier === "string" ? parsedBody.code_verifier.trim() : "";
  const clientId = env.ZUUP_CLIENT_ID || DEFAULT_CLIENT_ID;
  const redirectUri =
    (typeof parsedBody.redirect_uri === "string" && parsedBody.redirect_uri.trim()) ||
    env.ZUUP_REDIRECT_URI ||
    DEFAULT_REDIRECT_URI;

  if (!code || !codeVerifier) {
    return jsonResponse(
      {
        error: "missing_required_fields",
        has_code: Boolean(code),
        has_code_verifier: Boolean(codeVerifier),
      },
      400,
      origin,
    );
  }

  const tokenPayload = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  const clientSecret = env.ZUUP_CLIENT_SECRET || "";
  if (clientSecret) {
    headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  }

  try {
    const upstream = await fetch(env.ZUUP_TOKEN_URL || OAUTH_TOKEN_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(tokenPayload),
    });

    const raw = await upstream.text();
    const parsed = safeJsonParse(raw);
    const body = parsed === null ? { raw } : parsed;

    // Resolve existing Supabase profile by email so Zuup login reuses the same user_id/data policy.
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
    const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (upstream.ok && supabaseUrl && serviceRole) {
      const idClaims = decodeJwtPayload(body?.id_token);
      const accessClaims = decodeJwtPayload(body?.access_token);
      const emailRaw = body?.userinfo?.email || idClaims?.email || accessClaims?.email || null;
      const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

      if (email) {
        try {
          const profileUrl = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/apple_profiles`);
          profileUrl.searchParams.set("select", "*");
          profileUrl.searchParams.set("email", `eq.${email}`);
          profileUrl.searchParams.set("limit", "1");

          const profileRes = await fetch(profileUrl.toString(), {
            method: "GET",
            headers: {
              apikey: serviceRole,
              Authorization: `Bearer ${serviceRole}`,
            },
          });

          const profileRaw = await profileRes.text();
          const profileParsed = safeJsonParse(profileRaw);
          if (Array.isArray(profileParsed) && profileParsed[0]) {
            body.linked_profile = profileParsed[0];
          }
        } catch {
          // Keep token exchange successful even if optional profile linking fails.
        }
      }
    }

    return jsonResponse(body, upstream.status, origin);
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
  if (request.method === "OPTIONS") {
    return onRequestOptions(context);
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "method_not_allowed",
        method: request.method,
        expected: ["POST", "OPTIONS"],
      },
      405,
      request.headers.get("Origin") || "*",
    );
  }

  return onRequestPost(context);
};
