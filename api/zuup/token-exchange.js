const OAUTH_TOKEN_ENDPOINT =
  process.env.ZUUP_TOKEN_URL ||
  process.env.ZUUP_OAUTH_TOKEN_URL ||
  "https://auth.zuup.dev/api/oauth/token";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const DEFAULT_CLIENT_ID = "44d62b038a1e5ae27fd071955bd2cad0";
const DEFAULT_REDIRECT_URI = "https://watch.zuup.dev/auth/zuup/callback";

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

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
    const raw = Buffer.from(padded, "base64").toString("utf8");
    return safeJsonParse(raw);
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method_not_allowed",
      method: req.method,
      expected: ["POST", "OPTIONS"],
    });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    body = safeJsonParse(body);
    if (body === null) {
      return res.status(400).json({ error: "invalid_json" });
    }
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const codeVerifier = typeof body.code_verifier === "string" ? body.code_verifier.trim() : "";
  const clientId = process.env.ZUUP_CLIENT_ID || DEFAULT_CLIENT_ID;
  const redirectUri =
    (typeof body.redirect_uri === "string" && body.redirect_uri.trim()) ||
    process.env.ZUUP_REDIRECT_URI ||
    DEFAULT_REDIRECT_URI;

  if (!code || !codeVerifier) {
    return res.status(400).json({
      error: "missing_required_fields",
      has_code: Boolean(code),
      has_code_verifier: Boolean(codeVerifier),
    });
  }

  const tokenPayload = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  };

  const clientSecret = process.env.ZUUP_CLIENT_SECRET || "";
  const headers = {
    "Content-Type": "application/json",
  };

  if (clientSecret) {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${basicAuth}`;
  }

  try {
    const upstreamResponse = await fetch(OAUTH_TOKEN_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(tokenPayload),
    });

    const text = await upstreamResponse.text();
    const parsed = safeJsonParse(text);
    const bodyOut = parsed === null ? { raw: text } : parsed;

    // Resolve existing Supabase profile by email so Zuup login reuses the same user_id/data policy.
    if (upstreamResponse.ok && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const idClaims = decodeJwtPayload(bodyOut?.id_token);
      const accessClaims = decodeJwtPayload(bodyOut?.access_token);
      const emailRaw =
        bodyOut?.userinfo?.email ||
        idClaims?.email ||
        accessClaims?.email ||
        null;
      const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

      if (email) {
        try {
          const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/apple_profiles`);
          url.searchParams.set("select", "*");
          url.searchParams.set("email", `eq.${email}`);
          url.searchParams.set("limit", "1");

          const profileRes = await fetch(url.toString(), {
            method: "GET",
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          });

          const profileText = await profileRes.text();
          const parsedProfile = safeJsonParse(profileText);
          if (Array.isArray(parsedProfile) && parsedProfile[0]) {
            bodyOut.linked_profile = parsedProfile[0];
          }
        } catch {
          // Keep token exchange successful even if optional profile linking fails.
        }
      }
    }

    return res.status(upstreamResponse.status).json(bodyOut);
  } catch (error) {
    return res.status(502).json({
      error: "upstream_unreachable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
