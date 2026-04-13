import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { exchangeZuupCode, ZUUP_AUTH_STATE_KEY, ZUUP_AUTH_VERIFIER_KEY } from "@/lib/zuupAuth";

const getExchangeLockKey = (code: string) => `zuup_exchange_lock:${code}`;
const ZUUP_LOCAL_SESSION_KEY = "zuup_local_session";

const ZuupCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);

  const params = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hash = new URLSearchParams(hashRaw);

    const getParam = (key: string) => query.get(key) || hash.get(key) || "";

    return {
      code: getParam("code"),
      oauthError: getParam("error"),
      oauthErrorDescription: getParam("error_description"),
      accessToken: getParam("access_token"),
      refreshToken: getParam("refresh_token"),
      state: getParam("state"),
    };
  }, []);

  useEffect(() => {
    const finish = async () => {
      const expectedState = sessionStorage.getItem(ZUUP_AUTH_STATE_KEY);

      if (!params.state || !expectedState || params.state !== expectedState) {
        sessionStorage.removeItem(ZUUP_AUTH_STATE_KEY);
        sessionStorage.removeItem(ZUUP_AUTH_VERIFIER_KEY);
        setError("Invalid login state. Please try again.");
        return;
      }

      if (params.oauthError) {
        sessionStorage.removeItem(ZUUP_AUTH_STATE_KEY);
        sessionStorage.removeItem(ZUUP_AUTH_VERIFIER_KEY);
        setError(params.oauthErrorDescription || params.oauthError || "Zuup login was denied.");
        return;
      }

      let accessToken = params.accessToken;
      let refreshToken = params.refreshToken;
      let userinfo: any = null;
      let linkedProfile: any = null;

      if (params.code) {
        const lockKey = getExchangeLockKey(params.code);
        if (sessionStorage.getItem(lockKey) === "1") {
          setError("Login code is already being processed. Please wait or retry sign-in.");
          return;
        }

        sessionStorage.setItem(lockKey, "1");
        try {
          const tokenResponse = await exchangeZuupCode(params.code);
          accessToken = tokenResponse.access_token || "";
          refreshToken = tokenResponse.refresh_token || "";
          userinfo = (tokenResponse as any).userinfo || null;
          linkedProfile = (tokenResponse as any).linked_profile || null;
        } catch (exchangeError: any) {
          sessionStorage.removeItem(lockKey);
          sessionStorage.removeItem(ZUUP_AUTH_STATE_KEY);
          sessionStorage.removeItem(ZUUP_AUTH_VERIFIER_KEY);
          setError(exchangeError?.message || "Could not exchange Zuup code.");
          return;
        }

        sessionStorage.removeItem(lockKey);
      }

      if (!accessToken || !refreshToken) {
        sessionStorage.removeItem(ZUUP_AUTH_STATE_KEY);
        sessionStorage.removeItem(ZUUP_AUTH_VERIFIER_KEY);
        setError("Zuup did not return a valid app session. Check requested scopes and token exchange setup.");
        return;
      }

      const now = Date.now();
      const persisted = {
        access_token: accessToken,
        refresh_token: refreshToken,
        userinfo,
        linked_profile: linkedProfile,
        updated_at: now,
      };
      localStorage.setItem(ZUUP_LOCAL_SESSION_KEY, JSON.stringify(persisted));
      window.dispatchEvent(new CustomEvent("zuup-auth-updated", { detail: persisted }));

      sessionStorage.removeItem(ZUUP_AUTH_STATE_KEY);
      sessionStorage.removeItem(ZUUP_AUTH_VERIFIER_KEY);

      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 600);
    };

    void finish();
  }, [navigate, params]);

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center">
        {!error && !done && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-accent" size={26} />
            <h1 className="text-xl font-bold">Finishing Zuup login...</h1>
            <p className="mt-2 text-sm text-white/60">Please wait while we complete authentication.</p>
          </>
        )}

        {done && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={26} />
            <h1 className="text-xl font-bold">Login successful</h1>
            <p className="mt-2 text-sm text-white/60">Redirecting you now...</p>
          </>
        )}

        {error && (
          <>
            <AlertTriangle className="mx-auto mb-4 text-destructive" size={26} />
            <h1 className="text-xl font-bold">Zuup login failed</h1>
            <p className="mt-2 text-sm text-white/70">{error}</p>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="mt-5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ZuupCallback;
