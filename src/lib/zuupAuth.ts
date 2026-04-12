export const ZUUP_AUTH_STATE_KEY = "zuup_auth_state";
export const ZUUP_AUTH_VERIFIER_KEY = "zuup_auth_verifier";

export const getZuupConfig = () => {
  const authBase =
    (import.meta.env.VITE_ZUUP_AUTH_URL as string | undefined) ||
    "https://qnapwukqhybziduhzpow.supabase.co/auth/v1/oauth";
  const authorizeUrl =
    (import.meta.env.VITE_ZUUP_AUTHORIZE_URL as string | undefined) ||
    `${authBase.replace(/\/$/, "")}/authorize`;
  const tokenUrl =
    (import.meta.env.VITE_ZUUP_TOKEN_URL as string | undefined) ||
    `${authBase.replace(/\/$/, "")}/token`;
  const clientId = ((import.meta.env.VITE_ZUUP_CLIENT_ID as string | undefined) || "").trim();
  const tokenExchangeUrl =
    (import.meta.env.VITE_ZUUP_TOKEN_EXCHANGE_URL as string | undefined) ||
    "/api/zuup/token-exchange";
  const scope =
    (import.meta.env.VITE_ZUUP_SCOPE as string | undefined) || "openid profile email offline_access";
  const redirectUri =
    (import.meta.env.VITE_ZUUP_REDIRECT_URI as string | undefined) ||
    `${window.location.origin}/auth/zuup/callback`;

  const normalizedRedirectUri = redirectUri.trim().replace(/\/+$/, "");

  return {
    authBase,
    authorizeUrl,
    tokenUrl,
    clientId,
    tokenExchangeUrl,
    scope,
    redirectUri: normalizedRedirectUri,
  };
};

const generateState = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const randomBytes = (size: number) => {
  const buf = new Uint8Array(size);
  crypto.getRandomValues(buf);
  return buf;
};

const generateCodeVerifier = () => toBase64Url(randomBytes(32));

const generateCodeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
};

type ZuupTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export const loginWithZuup = async () => {
  const { authorizeUrl, clientId, redirectUri, scope } = getZuupConfig();
  if (!clientId) {
    throw new Error("VITE_ZUUP_CLIENT_ID is missing.");
  }
  if (!redirectUri) {
    throw new Error("VITE_ZUUP_REDIRECT_URI is missing.");
  }

  if (/\/api\//i.test(redirectUri)) {
    throw new Error("Invalid VITE_ZUUP_REDIRECT_URI. OAuth redirect_uri must point to callback page, not /api/ endpoint.");
  }

  const state = generateState();
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  sessionStorage.setItem(ZUUP_AUTH_STATE_KEY, state);
  sessionStorage.setItem(ZUUP_AUTH_VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${authorizeUrl}?${params.toString()}`;
};

export const exchangeZuupCode = async (code: string) => {
  const { clientId, redirectUri, tokenExchangeUrl } = getZuupConfig();
  const verifier = sessionStorage.getItem(ZUUP_AUTH_VERIFIER_KEY);
  if (!verifier) {
    throw new Error("Missing PKCE verifier. Please start login again.");
  }

  const res = await fetch(tokenExchangeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      client_id: clientId,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as ZuupTokenResponse;
  if (!res.ok || body.error) {
    throw new Error(body.error_description || body.error || "Zuup token exchange failed.");
  }

  return body;
};
