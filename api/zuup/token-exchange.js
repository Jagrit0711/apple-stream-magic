const OAUTH_TOKEN_ENDPOINT =
  process.env.ZUUP_TOKEN_URL ||
  process.env.ZUUP_OAUTH_TOKEN_URL ||
  "https://auth.zuup.dev/api/oauth/token";

const OAUTH_USERINFO_ENDPOINT =
  process.env.ZUUP_USERINFO_URL ||
  "https://auth.zuup.dev/api/oauth/userinfo";

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
    if (req.method === "GET") {
      return res.status(405).json({
        error: "method_not_allowed",
        method: req.method,
        message: "Use POST from callback page. Do not navigate directly to /api/zuup/token-exchange.",
        expected: ["POST", "OPTIONS"],
      });
    }

    return res.status(405).json({
      error: "method_not_allowed",
      method: req.method,
      expected: ["POST", "OPTIONS"],
    });
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
    return res.status(400).json({
      error: "missing_required_fields",
      has_code: Boolean(code),
      has_code_verifier: Boolean(code_verifier),
      hint: "Frontend must POST JSON body with code and code_verifier.",
    });
  }

  const clientId = process.env.ZUUP_CLIENT_ID || "zuupwatch";
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
  const expectedRedirectUri = (process.env.ZUUP_REDIRECT_URI || fallbackRedirectUri).trim().replace(/\/+$/, "");
  const requestedRedirectUri = (redirect_uri || "").trim().replace(/\/+$/, "");
  const redirectUri = expectedRedirectUri;

  if (requestedRedirectUri && requestedRedirectUri !== expectedRedirectUri) {
    console.warn("[zuup-token-exchange] redirect_uri mismatch", {
      requestedRedirectUri,
      expectedRedirectUri,
    });
  }

  const tokenPayload = {
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier,
  };

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");

  try {
    console.info("[zuup-token-exchange] Exchanging authorization code", {
      endpoint: OAUTH_TOKEN_ENDPOINT,
      method: "POST",
      contentType: "application/json",
      hasAuthorizationHeader: Boolean(basicAuth),
      hasCode: Boolean(code),
      hasCodeVerifier: Boolean(code_verifier),
      redirectUri,
      clientId,
    });

    const upstreamResponse = await fetch(OAUTH_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(tokenPayload),
    });

    const upstreamText = await upstreamResponse.text();
    const upstreamContentType = upstreamResponse.headers.get("content-type") || "";
    let upstreamBody;
    try {
      upstreamBody = upstreamText ? JSON.parse(upstreamText) : {};
    } catch {
      upstreamBody = { raw: upstreamText };
    }

    if (!upstreamResponse.ok) {
      console.error("[zuup-token-exchange] Upstream token exchange failed", {
        status: upstreamResponse.status,
        contentType: upstreamContentType,
        body: upstreamBody,
      });

      // Return upstream payload directly when JSON so frontend gets exact provider error body.
      if (upstreamContentType.includes("application/json")) {
        return res.status(upstreamResponse.status).json(upstreamBody);
      }

      return res.status(upstreamResponse.status).json({
        error: "token_exchange_failed",
        status: upstreamResponse.status,
        upstream: upstreamBody,
      });
    }

    const accessToken = upstreamBody?.access_token;
    let userinfo = null;

    if (accessToken) {
      const userinfoResponse = await fetch(OAUTH_USERINFO_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userinfoText = await userinfoResponse.text();
      try {
        userinfo = userinfoText ? JSON.parse(userinfoText) : null;
      } catch {
        userinfo = { raw: userinfoText };
      }

      if (!userinfoResponse.ok) {
        console.warn("[zuup-token-exchange] userinfo fetch failed", {
          status: userinfoResponse.status,
          body: userinfo,
        });
      }
    }

    return res.status(200).json({
      ...upstreamBody,
      userinfo,
    });
  } catch (error) {
    return res.status(502).json({
      error: "upstream_unreachable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
