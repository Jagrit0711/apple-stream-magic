const OAUTH_TOKEN_ENDPOINT =
  process.env.ZUUP_TOKEN_URL ||
  process.env.ZUUP_OAUTH_TOKEN_URL ||
  "https://qnapwukqhybziduhzpow.supabase.co/auth/v1/oauth/token";

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return res.status(400).json({ error: "invalid_json" });
    }
  }
  const { code, code_verifier, redirect_uri } = body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  const clientId = process.env.ZUUP_CLIENT_ID;
  const clientSecret = process.env.ZUUP_CLIENT_SECRET;

  const missingEnvKeys = [];
  if (!clientId) missingEnvKeys.push("ZUUP_CLIENT_ID");
  if (!clientSecret) missingEnvKeys.push("ZUUP_CLIENT_SECRET");

  if (missingEnvKeys.length > 0) {
    console.error("[zuup-token-exchange] Missing server env keys", {
      missing: missingEnvKeys,
      hasTokenUrl: Boolean(process.env.ZUUP_TOKEN_URL || process.env.ZUUP_OAUTH_TOKEN_URL),
    });

    return res.status(500).json({
      error: "server_not_configured",
      missing: missingEnvKeys,
    });
  }

  const fallbackRedirectUri = `${req.headers.origin || "https://watch.zuup.dev"}/auth/zuup/callback`;
  const redirectUri = redirect_uri || process.env.ZUUP_REDIRECT_URI || fallbackRedirectUri;

  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    code_verifier,
  });

  try {
    const upstreamResponse = await fetch(OAUTH_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams,
    });

    const upstreamBody = await upstreamResponse.json().catch(() => ({}));

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: "token_exchange_failed",
        details: upstreamBody,
      });
    }

    return res.status(200).json(upstreamBody);
  } catch (error) {
    return res.status(502).json({
      error: "upstream_unreachable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
