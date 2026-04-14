import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { motion } from "framer-motion";
import { 
  User as UserIcon, Settings, LogOut,
  Trash2, Calendar, Heart, ShieldCheck
} from "lucide-react";
import ContentCard from "@/components/ContentCard";
import { MOVIE_GENRES } from "@/lib/tmdb";
import { getWhatsAppLink, SUPPORT_WHATSAPP_NUMBER, SUBSCRIPTION_PRICE_RUPEES } from "@/lib/access";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, profile, signOut, updateProfile, session } = useAuth();
  const { watchlist, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [selectedGenres, setSelectedGenres] = useState<number[]>(profile?.favorite_genres || []);
  const [pairCodeInput, setPairCodeInput] = useState("");
  const [pairStatus, setPairStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const renewalMessage = getWhatsAppLink(`Hi, I want to renew my Apple Stream Magic subscription for Rs. ${SUBSCRIPTION_PRICE_RUPEES}.`);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const approvePairingCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setPairStatus("Approving sign-in...");

    const payload = (() => {
      if (session?.access_token && session?.refresh_token) {
        return {
          kind: "supabase",
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        };
      }

      try {
        const raw = localStorage.getItem("zuup_local_session");
        if (raw) {
          return {
            kind: "zuup",
            session: JSON.parse(raw),
          };
        }
      } catch {}

      return null;
    })();

    if (!payload) {
      setPairStatus("No valid session to transfer");
      return;
    }

    const ch = supabase.channel(`pair-auth-${code}`);
    await new Promise<void>((resolve) => {
      ch.subscribe((status: string) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          resolve();
        }
      });
    });

    await ch.send({ type: "broadcast", event: "session-transfer", payload });
    await supabase.removeChannel(ch);

    setPairStatus("Approved. TV/Laptop will sign in now.");
  };

  useEffect(() => {
    const pairCode = searchParams.get("pair");
    if (!pairCode) return;
    void approvePairingCode(pairCode);
    const next = new URLSearchParams(searchParams);
    next.delete("pair");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!isScanning) return;
    let rafId = 0;

    const runScanner = async () => {
      if (!("BarcodeDetector" in window)) {
        setPairStatus("Barcode scanner not supported on this device");
        setIsScanning(false);
        return;
      }

      detectorRef.current = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const scanLoop = async () => {
        if (!videoRef.current || !detectorRef.current) {
          rafId = requestAnimationFrame(() => { void scanLoop(); });
          return;
        }

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes?.length) {
            const raw = String(codes[0].rawValue || "");
            const parsed = (() => {
              try {
                const u = new URL(raw);
                return u.searchParams.get("pair") || raw;
              } catch {
                return raw;
              }
            })();

            setPairCodeInput(parsed);
            setIsScanning(false);
            void approvePairingCode(parsed);
            return;
          }
        } catch {}

        rafId = requestAnimationFrame(() => { void scanLoop(); });
      };

      await scanLoop();
    };

    void runScanner();

    return () => {
      cancelAnimationFrame(rafId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isScanning]);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ 
      display_name: displayName,
      favorite_genres: selectedGenres
    });
    setIsEditing(false);
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId) 
        : [...prev, genreId]
    );
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden">
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
        {/* Profile Hero */}
        <div className="glass-strong rounded-3xl p-6 sm:p-10 mb-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <UserIcon size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-accent to-orange-500 p-1 shadow-2xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-background" alt="" />
                ) : (
                  <div className="w-full h-full rounded-full bg-surface border-4 border-background flex items-center justify-center text-3xl font-bold font-black">
                    {profile?.display_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  {profile?.display_name || "Adventurer"}
                </h1>
                <div className="flex justify-center md:justify-start gap-2">
                  {profile?.onboarding_complete && (
                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1 uppercase tracking-widest leading-none">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-meta text-xs mb-6 font-bold uppercase tracking-wider">
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <Calendar size={14} className="text-accent" /> Joined {new Date(profile?.created_at || "").toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <Heart size={14} className="text-accent" /> {watchlist.length} items in watchlist
                </p>
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <ShieldCheck size={14} className="text-accent" /> {profile?.subscription_status || "inactive"}
                </p>
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <Heart size={14} className="text-accent" /> WhatsApp {SUPPORT_WHATSAPP_NUMBER}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {profile?.is_admin && (
                  <button 
                    onClick={() => navigate("/admin")}
                    className="px-6 py-2.5 rounded-xl bg-[#e11d48]/15 hover:bg-[#e11d48]/25 border border-[#e11d48]/25 text-[#e11d48] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <ShieldCheck size={14} /> Admin Dashboard
                  </button>
                )}
                <a 
                  href={renewalMessage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Heart size={14} /> Renew Plan
                </a>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Settings size={14} /> Edit Profile
                </button>
                <button 
                  onClick={signOut}
                  className="px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-10 pt-10 border-t border-white/5"
            >
              <form onSubmit={handleUpdateProfile} className="max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-meta/60 mb-3">Display Name</label>
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all font-bold"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-meta/60 mb-3">Favorite Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {MOVIE_GENRES.map(genre => (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => toggleGenre(genre.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            selectedGenres.includes(genre.id)
                              ? "bg-accent border-accent text-white"
                              : "bg-white/5 border-white/10 text-meta hover:border-white/30"
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest text-meta hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="bg-accent text-white px-8 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest shadow-lg shadow-accent/20 hover:scale-105 transition-transform active:scale-95">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        <section className="mb-12 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-meta/60 mb-2">Subscription</p>
            <h3 className="text-xl font-bold">{profile?.subscription_status || "inactive"}</h3>
            <p className="mt-2 text-sm text-meta/60">Plan price: Rs. {profile?.plan_price ?? SUBSCRIPTION_PRICE_RUPEES}</p>
            <p className="mt-1 text-sm text-meta/60">Expires: {profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleString() : "No expiry set"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-meta/60 mb-2">Access</p>
            <h3 className="text-xl font-bold">{profile?.is_admin ? "Admin access" : "Member access"}</h3>
            <p className="mt-2 text-sm text-meta/60">{profile?.is_admin ? "You can manage subscriptions and view full watch history." : "Renew via WhatsApp to keep streaming and browsing unlocked."}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-meta/60 mb-2">Support</p>
            <h3 className="text-xl font-bold">{SUPPORT_WHATSAPP_NUMBER}</h3>
            <p className="mt-2 text-sm text-meta/60">Use WhatsApp for renewal, activation, or subscription questions.</p>
          </div>
        </section>

        <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <h2 className="text-xl font-black uppercase tracking-widest">TV/Laptop Pair Sign-in</h2>
          <p className="mt-2 text-sm text-meta/70">On TV/laptop login screen, open QR sign-in. Then scan it here or enter the code.</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={pairCodeInput}
              onChange={(e) => setPairCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter pairing code"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => { void approvePairingCode(pairCodeInput); }}
              className="rounded-xl bg-accent px-5 py-3 text-xs font-black uppercase tracking-widest text-white"
            >
              Approve Sign-in
            </button>
            <button
              onClick={() => setIsScanning((v) => !v)}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-widest"
            >
              {isScanning ? "Stop Scanner" : "Open Scanner"}
            </button>
          </div>

          {isScanning && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video ref={videoRef} className="h-64 w-full object-cover" playsInline muted />
            </div>
          )}

          {pairStatus && <p className="mt-3 text-sm text-emerald-400">{pairStatus}</p>}
        </section>

        {/* Watchlist Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
               My Watchlist
            </h2>
          </div>

          {!watchlistLoading && watchlist.length === 0 ? (
            <div className="bg-white/[0.02] rounded-3xl p-16 text-center border-2 border-dashed border-white/5">
              <p className="text-meta/60 text-sm font-bold">Your watchlist is empty. Start adding some movies and shows!</p>
              <button onClick={() => navigate("/")} className="mt-4 text-accent text-xs font-black uppercase tracking-widest">Discover Content</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {watchlist.map(item => (
                <div key={item.id} className="relative group">
                  <div 
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
                  >
                    <ContentCard 
                      item={{
                        id: item.tmdb_id,
                        title: item.title,
                        poster_path: item.poster_path,
                        media_type: item.media_type,
                        vote_average: 0,
                        genre_ids: []
                      } as any} 
                      onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
                    />
                  </div>
                  <button 
                    onClick={() => removeFromWatchlist(item.tmdb_id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
