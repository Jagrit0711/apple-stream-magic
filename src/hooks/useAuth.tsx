import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { SUPPORT_WHATSAPP_NUMBER, SUBSCRIPTION_PRICE_RUPEES } from "@/lib/access";
import {
  setSubscriptionCookies,
  getSubscriptionFromCookies,
  clearSubscriptionCookies,
  updateSubscriptionCookie,
  updateAdminCookie,
} from "@/lib/cookieManager";

const ZUUP_LOCAL_SESSION_KEY = "zuup_local_session";

type ZuupLocalSession = {
  access_token?: string;
  refresh_token?: string;
  userinfo?: Record<string, any> | null;
  linked_profile?: Record<string, any> | null;
  updated_at?: number;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    onboarding_complete: boolean;
    favorite_genres: number[];
    is_admin: boolean;
    subscription_status: string;
    subscription_expires_at: string | null;
    renewal_whatsapp: string | null;
    plan_price: number | null;
    created_at: string;
    updated_at: string;
  } | null;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: (genres: number[]) => Promise<void>;
  updateProfile: (updates: Partial<AuthContextType["profile"]>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  const mapZuupUser = (zuup: ZuupLocalSession) => {
    const info = zuup.userinfo || {};
    const linked = zuup.linked_profile || {};
    const id = String(linked.user_id || info.user_id || info.supabase_user_id || info.app_user_id || info.watch_user_id || info.sub || info.id || info.email || "zuup-user");
    const email = typeof info.email === "string" ? info.email : null;
    const nowIso = new Date().toISOString();
    return {
      id,
      email,
      aud: "authenticated",
      role: "authenticated",
      created_at: nowIso,
      updated_at: nowIso,
      app_metadata: { provider: "zuup", providers: ["zuup"] },
      user_metadata: {
        display_name: info.name || info.preferred_username || email || "Zuup User",
        avatar_url: info.picture || null,
        zuup_userinfo: info,
        zuup_linked_profile: linked,
      },
    } as unknown as User;
  };

  const mapZuupProfile = (zuupUser: User) => {
    const info = (zuupUser.user_metadata as any)?.zuup_userinfo || {};
    const linked = (zuupUser.user_metadata as any)?.zuup_linked_profile || {};

    let profile: AuthContextType["profile"];
    if (linked && linked.user_id) {
      profile = {
        ...linked,
      } as AuthContextType["profile"];
    } else {
      const nowIso = new Date().toISOString();
      profile = {
        id: `zuup-${zuupUser.id}`,
        user_id: zuupUser.id,
        display_name: (zuupUser.user_metadata as any)?.display_name || null,
        avatar_url: (zuupUser.user_metadata as any)?.avatar_url || null,
        onboarding_complete: true,
        favorite_genres: [],
        is_admin: Boolean(info.is_admin),
        subscription_status: (typeof info.subscription_status === "string" ? info.subscription_status : "active"),
        subscription_expires_at: typeof info.subscription_expires_at === "string" ? info.subscription_expires_at : null,
        renewal_whatsapp: SUPPORT_WHATSAPP_NUMBER,
        plan_price: SUBSCRIPTION_PRICE_RUPEES,
        created_at: nowIso,
        updated_at: nowIso,
      } as AuthContextType["profile"];
    }
    
    // Store in cookies for dynamic checking on refresh
    setSubscriptionCookies(profile);
    return profile;
  };

  const tryApplyZuupSession = (sessionPayload?: ZuupLocalSession | null) => {
    const payload = sessionPayload || (() => {
      try {
        const raw = localStorage.getItem(ZUUP_LOCAL_SESSION_KEY);
        return raw ? (JSON.parse(raw) as ZuupLocalSession) : null;
      } catch {
        return null;
      }
    })();

    if (!payload?.access_token) return false;
    const zuupUser = mapZuupUser(payload);
    setSession(null);
    setUser(zuupUser);
    const zuupProfile = mapZuupProfile(zuupUser);
    setProfile(zuupProfile);
    setLoading(false);
    return true;
  };

  /**
   * Restore profile from cookies on page refresh
   * Allows instant profile display without waiting for DB query
   */
  const restoreProfileFromCookies = () => {
    const cachedProfile = getSubscriptionFromCookies();
    if (cachedProfile) {
      // Create a minimal profile object from cookies
      // This will be validated/updated by the database query
      const restoredProfile: AuthContextType["profile"] = {
        ...cachedProfile,
        user_id: "",
        display_name: null,
        avatar_url: null,
        onboarding_complete: true,
        favorite_genres: [],
        created_at: "",
        updated_at: "",
      };
      setProfile(restoredProfile);
      return true;
    }
    return false;
  };

  const isZuupUser = (candidate: User | null) =>
    (candidate as any)?.app_metadata?.provider === "zuup";

  const fetchProfile = async (currentUser: User) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase
        .from("apple_profiles" as any)
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const profileData = data as any as AuthContextType["profile"];
        setProfile(profileData);
        // Store subscription status in cookies for dynamic refresh checking
        setSubscriptionCookies(profileData);
        return;
      }

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    setProfile(null);
  };

  useEffect(() => {
    const onZuupAuthUpdated = (event: Event) => {
      const custom = event as CustomEvent<ZuupLocalSession>;
      tryApplyZuupSession(custom.detail || null);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === ZUUP_LOCAL_SESSION_KEY) {
        tryApplyZuupSession();
      }
    };

    window.addEventListener("zuup-auth-updated", onZuupAuthUpdated as EventListener);
    window.addEventListener("storage", onStorage);

    const isZuupCallbackRoute =
      window.location.pathname.startsWith("/auth/zuup/callback") ||
      window.location.pathname.startsWith("/callback");

    if (isZuupCallbackRoute) {
      setLoading(false);
      return () => {
        window.removeEventListener("zuup-auth-updated", onZuupAuthUpdated as EventListener);
        window.removeEventListener("storage", onStorage);
      };
    }

    if (tryApplyZuupSession()) {
      return () => {
        window.removeEventListener("zuup-auth-updated", onZuupAuthUpdated as EventListener);
        window.removeEventListener("storage", onStorage);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Try to restore from cookies first for instant profile availability
        restoreProfileFromCookies();
        // Then fetch fresh data from database
        setLoading(true);
        setTimeout(() => {
          fetchProfile(session.user).finally(() => setLoading(false));
        }, 0);
      } else {
        setProfile(null);
        clearSubscriptionCookies();
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Try to restore from cookies first for instant profile availability
        const restoredFromCache = restoreProfileFromCookies();
        // Then fetch fresh data from database
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        clearSubscriptionCookies();
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("zuup-auth-updated", onZuupAuthUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    const needsEmailConfirmation = !error && !data?.session && !!data?.user;

    if (!error && data?.session?.user) {
      await fetchProfile(data.session.user);
    }

    return { error: error as Error | null, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    clearSubscriptionCookies();
    
    if (isZuupUser(user)) {
      localStorage.removeItem(ZUUP_LOCAL_SESSION_KEY);
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }

    await supabase.auth.signOut();
    setProfile(null);
  };

  const completeOnboarding = async (genres: number[]) => {
    if (!user) return;

    if (isZuupUser(user)) {
      setProfile(p => p ? { ...p, onboarding_complete: true, favorite_genres: genres } : p);
      return;
    }

    const payload = { onboarding_complete: true, favorite_genres: genres };

    const { error, data } = await supabase
      .from("apple_profiles" as any)
      .update(payload)
      .eq("user_id", user.id)
      .select("user_id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    // If update matched no rows (race on fresh signup), create profile then continue.
    if (!data) {
      const { error: upsertError } = await supabase
        .from("apple_profiles" as any)
        .upsert(
          {
            user_id: user.id,
            display_name:
              (user.user_metadata as any)?.display_name ||
              user.email?.split("@")[0] ||
              "User",
            ...payload,
          },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        throw upsertError;
      }
    }

    setProfile(p => p ? { ...p, onboarding_complete: true, favorite_genres: genres } : p);
  };

  const updateProfile = async (updates: Partial<AuthContextType["profile"]>) => {
    if (!user) return { error: "No user logged in" };

    if (isZuupUser(user)) {
      setProfile(p => p ? { ...p, ...updates } : p);
      return { error: null };
    }

    // @ts-ignore
    const { error } = await supabase
      .from("apple_profiles" as any)
      .update(updates)
      .eq("user_id", user.id);
    
    if (!error) {
      setProfile(p => {
        if (!p) return p;
        const updated = { ...p, ...updates };
        // Update cookies with new subscription status
        if (updates.subscription_status || updates.subscription_expires_at || updates.is_admin) {
          setSubscriptionCookies(updated);
        }
        return updated;
      });
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (isZuupUser(user)) return;
    if (user) await fetchProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signUp, signIn, signOut, completeOnboarding, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
