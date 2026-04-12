import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { SUPPORT_WHATSAPP_NUMBER, SUBSCRIPTION_PRICE_RUPEES } from "@/lib/access";

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
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
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

  const fetchProfile = async (currentUser: User) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase
        .from("apple_profiles" as any)
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data as any as AuthContextType["profile"]);
        return;
      }

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    setProfile(null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        setTimeout(() => {
          fetchProfile(session.user).finally(() => setLoading(false));
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (!error && data?.session?.user) {
      await fetchProfile(data.session.user);
    }
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const completeOnboarding = async (genres: number[]) => {
    if (!user) return;
    await supabase
      .from("apple_profiles" as any)
      .update({ onboarding_complete: true, favorite_genres: genres })
      .eq("user_id", user.id);
    setProfile(p => p ? { ...p, onboarding_complete: true, favorite_genres: genres } : p);
  };

  const updateProfile = async (updates: Partial<AuthContextType["profile"]>) => {
    if (!user) return { error: "No user logged in" };
    // @ts-ignore
    const { error } = await supabase
      .from("apple_profiles" as any)
      .update(updates)
      .eq("user_id", user.id);
    
    if (!error) {
      setProfile(p => p ? { ...p, ...updates } : p);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signUp, signIn, signOut, completeOnboarding, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
