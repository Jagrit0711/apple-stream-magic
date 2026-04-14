import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, ExternalLink, RefreshCw, ShieldCheck, Users, Tv2, Clock3, Wifi, BarChart3, MessageCircle, Search, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getWhatsAppLink, SUPPORT_WHATSAPP_NUMBER } from "@/lib/access";
import { toast } from "sonner";

const Admin = () => {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const isZuupUser = (user as any)?.app_metadata?.provider === "zuup";
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("active");
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState("");
  const [isAdminFlag, setIsAdminFlag] = useState(false);
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ["admin-profiles", isZuupUser],
    queryFn: async () => {
      if (isZuupUser) {
        const res = await fetch("/api/zuup/profiles?limit=250");
        const text = await res.text();
        const parsed = text ? JSON.parse(text) : [];
        if (!res.ok) throw new Error(parsed?.error || "Failed to fetch profiles");
        return (Array.isArray(parsed) ? parsed : []) as any[];
      }

      const { data, error } = await supabase
        .from("apple_profiles" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: contentRows = [], isLoading: contentLoading, refetch: refetchContent } = useQuery({
    queryKey: ["admin-content", isZuupUser],
    queryFn: async () => {
      if (isZuupUser) {
        const res = await fetch("/api/zuup/user-content?all=1&limit=250");
        const text = await res.text();
        const parsed = text ? JSON.parse(text) : [];
        if (!res.ok) throw new Error(parsed?.error || "Failed to fetch content");
        return (Array.isArray(parsed) ? parsed : []) as any[];
      }

      const { data, error } = await supabase
        .from("apple_user_content" as any)
        .select("*")
        .order("last_watched_at", { ascending: false })
        .limit(250);

      if (!error) return (data || []) as any[];

      const missingRelation = /relation .* does not exist/i.test(error.message || "");
      if (!missingRelation) throw error;

      const { data: legacyData, error: legacyError } = await supabase
        .from("watch_history" as any)
        .select("*")
        .order("last_watched_at", { ascending: false })
        .limit(250);
      if (legacyError) throw legacyError;
      return (legacyData || []) as any[];
    },
  });

  const selectedProfile = profiles.find((item: any) => item.user_id === selectedUserId) || null;
  const profileNameByUserId = useMemo(
    () => new Map(profiles.map((item: any) => [item.user_id, item.display_name || item.user_id])),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((item: any) =>
      [item.display_name, item.email, item.user_id, item.subscription_status].some(value =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [profiles, search]);

  const metrics = useMemo(() => {
    const activeSubscribers = profiles.filter((item: any) => item.is_admin || item.subscription_status === "active" || item.subscription_status === "lifetime").length;
    const expiredSubscribers = profiles.filter((item: any) => item.subscription_status === "expired" || item.subscription_status === "inactive").length;
    const adminCount = profiles.filter((item: any) => item.is_admin).length;
    const watchlisted = contentRows.filter((item: any) => item.in_watchlist).length;
    const totalProgress = contentRows.reduce((sum: number, item: any) => sum + Number(item.progress || 0), 0);
    const avgProgress = contentRows.length ? Math.round(totalProgress / contentRows.length) : 0;
    const uniqueViewers = new Set(contentRows.map((item: any) => item.user_id)).size;

    return { activeSubscribers, expiredSubscribers, adminCount, watchlisted, avgProgress, uniqueViewers };
  }, [profiles, contentRows]);

  const topTitles = useMemo(() => {
    const counts = new Map<string, number>();
    contentRows.forEach((item: any) => {
      counts.set(item.title, (counts.get(item.title) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([title, count]) => ({ title, count }));
  }, [contentRows]);

  const upcomingRenewals = useMemo(() => {
    return profiles
      .filter((item: any) => item.subscription_expires_at)
      .sort((a: any, b: any) => new Date(a.subscription_expires_at).getTime() - new Date(b.subscription_expires_at).getTime())
      .slice(0, 6);
  }, [profiles]);

  const siteHealth = [
    { label: "Network", value: navigator.onLine ? "Online" : "Offline", icon: Wifi, tone: navigator.onLine ? "text-emerald-400" : "text-red-400" },
    { label: "Auth", value: profile ? "Connected" : "Disconnected", icon: ShieldCheck, tone: profile ? "text-emerald-400" : "text-amber-400" },
    { label: "Watch feeds", value: contentRows.length > 0 ? "Writing" : "Idle", icon: Activity, tone: contentRows.length > 0 ? "text-emerald-400" : "text-amber-400" },
    { label: "Uptime", value: `${Math.floor((performance.now() / 1000) / 60)}m`, icon: Clock3, tone: "text-sky-400" },
  ];

  const loadSelected = (item: any) => {
    setSelectedUserId(item.user_id);
    setSubscriptionStatus(item.subscription_status || "inactive");
    setSubscriptionExpiresAt(item.subscription_expires_at ? String(item.subscription_expires_at).slice(0, 16) : "");
    setIsAdminFlag(Boolean(item.is_admin));
  };

  const saveMember = async () => {
    if (!selectedProfile) {
      toast.error("Pick a member first");
      return;
    }

    if (isZuupUser) {
      const res = await fetch("/api/zuup/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedProfile.user_id,
          updates: {
            subscription_status: subscriptionStatus,
            subscription_expires_at: subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toISOString() : null,
            is_admin: isAdminFlag,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(text || "Failed to save member");
        return;
      }
    } else {
      const { error } = await supabase
        .from("apple_profiles" as any)
        .update({
          subscription_status: subscriptionStatus,
          subscription_expires_at: subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toISOString() : null,
          is_admin: isAdminFlag,
        })
        .eq("user_id", selectedProfile.user_id);

      if (error) {
        toast.error(error.message || "Failed to save member");
        return;
      }
    }

    toast.success("Member updated");
    await Promise.all([refetchProfiles(), refreshProfile(), queryClient.invalidateQueries({ queryKey: ["admin-profiles", isZuupUser] })]);
  };

  const renewLink = selectedProfile
    ? getWhatsAppLink(`Hi, I want to renew my Apple Stream Magic subscription for user ${selectedProfile.display_name || selectedProfile.user_id}. Plan is Rs. 50.`)
    : getWhatsAppLink("Hi, I want to renew my Apple Stream Magic subscription.");

  return (
    <div className="min-h-screen bg-background text-white pt-24 pb-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.24),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 pointer-events-none opacity-50 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                <Crown size={14} className="text-[#e11d48]" /> Admin Console
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Subscription control, watch intelligence, and operational health in one panel.
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-white/60 leading-relaxed">
                Use this dashboard to keep members active, renew plans over WhatsApp, inspect watch history, and monitor the site while the app runs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[340px]">
              <button
                onClick={() => { void Promise.all([refetchProfiles(), refetchContent()]); }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={16} className="mb-2 text-white/70" />
                <p className="text-sm font-semibold">Refresh data</p>
                <p className="text-[11px] text-white/50">Reload profiles and history</p>
              </button>
              <a
                href={renewLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-3 text-left hover:bg-[#25D366]/15 transition-colors"
              >
                <MessageCircle size={16} className="mb-2 text-[#25D366]" />
                <p className="text-sm font-semibold">WhatsApp renewals</p>
                <p className="text-[11px] text-white/50">{SUPPORT_WHATSAPP_NUMBER}</p>
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Members", value: profiles.length, icon: Users },
            { label: "Active plans", value: metrics.activeSubscribers, icon: ShieldCheck },
            { label: "Admin users", value: metrics.adminCount, icon: Crown },
            { label: "Watch rows", value: contentRows.length, icon: Tv2 },
            { label: "Watchlisted", value: metrics.watchlisted, icon: BarChart3 },
            { label: "Avg progress", value: `${metrics.avgProgress}%`, icon: Activity },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg">
              <card.icon size={18} className="text-[#e11d48]" />
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/45">{card.label}</p>
              <p className="mt-2 text-2xl font-black">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold">Member directory</h2>
                <p className="text-sm text-white/50">Search, inspect, and promote users from here.</p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search members"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#e11d48]"
                />
              </div>
            </div>
            <div className="grid gap-3 max-h-[480px] overflow-auto pr-1">
              {profilesLoading && <p className="text-sm text-white/50">Loading members...</p>}
              {filteredProfiles.map((item: any) => {
                const expiresAt = item.subscription_expires_at ? new Date(item.subscription_expires_at).toLocaleString() : "No expiry";
                return (
                  <button
                    key={item.id}
                    onClick={() => loadSelected(item)}
                    className={`text-left rounded-2xl border p-4 transition-all ${selectedUserId === item.user_id ? "border-[#e11d48] bg-[#e11d48]/10" : "border-white/10 bg-black/10 hover:bg-white/5"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.display_name || "Unnamed member"}</p>
                        {item.email && <p className="text-xs text-white/55 break-all">{item.email}</p>}
                        <p className="text-xs text-white/45 break-all">{item.user_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {item.is_admin && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">Admin</span>}
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/70">{item.subscription_status || "inactive"}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/55">
                      <span>Genres: {(item.favorite_genres || []).length}</span>
                      <span className="text-right">Expiry: {expiresAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h2 className="text-lg font-bold mb-1">Subscription controls</h2>
            <p className="text-sm text-white/50 mb-5">Update plan state and assign admin access.</p>
            {selectedProfile ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4 space-y-1">
                  <p className="text-sm font-semibold">{selectedProfile.display_name || "Unnamed member"}</p>
                  {selectedProfile.email && <p className="text-xs text-white/55 break-all">{selectedProfile.email}</p>}
                  <p className="text-xs text-white/45 break-all">{selectedProfile.user_id}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Plan status</span>
                    <select
                      value={subscriptionStatus}
                      onChange={e => setSubscriptionStatus(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-[#e11d48]"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="trial">trial</option>
                      <option value="expired">expired</option>
                      <option value="suspended">suspended</option>
                      <option value="lifetime">lifetime</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Expiry date</span>
                    <input
                      type="datetime-local"
                      value={subscriptionExpiresAt}
                      onChange={e => setSubscriptionExpiresAt(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-[#e11d48]"
                    />
                  </label>
                </div>
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">Grant admin access</p>
                    <p className="text-xs text-white/45">Use this sparingly. Admins can see all members and watch history.</p>
                  </div>
                  <input type="checkbox" checked={isAdminFlag} onChange={e => setIsAdminFlag(e.target.checked)} className="h-4 w-4 accent-[#e11d48]" />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => void saveMember()}
                    className="rounded-xl bg-[#e11d48] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e11d48]/90"
                  >
                    Save changes
                  </button>
                  <a
                    href={renewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/15"
                  >
                    Renew on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-white/45">
                Select a member to edit subscription state.
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold">Latest watch history</h2>
                <p className="text-sm text-white/50">See what people are watching right now.</p>
              </div>
              <button
                onClick={() => void refetchContent()}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/20 text-white/50">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Watched</th>
                  </tr>
                </thead>
                <tbody>
                  {contentLoading && (
                    <tr><td className="px-4 py-4 text-white/45" colSpan={5}>Loading watch history...</td></tr>
                  )}
                  {contentRows.slice(0, 16).map((item: any) => (
                    <tr key={item.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium">{item.title}</td>
                      <td className="px-4 py-3 text-white/55">
                        <div className="font-medium text-white/80">{profileNameByUserId.get(item.user_id) || item.user_id}</div>
                        <div className="text-[11px] text-white/40 break-all">{item.user_id}</div>
                      </td>
                      <td className="px-4 py-3 uppercase text-xs tracking-widest text-white/55">{item.media_type}</td>
                      <td className="px-4 py-3">{Number(item.progress || 0)}%</td>
                      <td className="px-4 py-3 text-white/55">{new Date(item.last_watched_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">Website health</h2>
              <p className="text-sm text-white/50">Operational snapshot for the current browser session.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {siteHealth.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <Icon size={16} className={tone} />
                  <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/45">{label}</p>
                  <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h3 className="font-semibold">Top titles by appearances</h3>
                <ExternalLink size={14} className="text-white/40" />
              </div>
              <div className="space-y-2">
                {topTitles.map(entry => (
                  <div key={entry.title} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-white/70">{entry.title}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <h3 className="font-semibold mb-3">Next renewal queue</h3>
              <div className="space-y-2 text-sm text-white/70">
                {upcomingRenewals.length === 0 && <p className="text-white/45">No expiring members yet.</p>}
                {upcomingRenewals.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{item.display_name || item.user_id}</span>
                    <span className="text-white/45">{item.subscription_expires_at ? new Date(item.subscription_expires_at).toLocaleDateString() : "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default Admin;
