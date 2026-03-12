import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Film, Tv, Sparkles, Search, User, LogOut,
  Play, Info, ChevronRight, ChevronLeft, TrendingUp, X,
  Download, Star, Clock, Zap
} from "lucide-react";

// ─── Types (mirroring tmdb.ts) ───────────────────────────────────────────────
interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: string;
}

interface TabletLayoutProps {
  // Navigation
  activeNav: string;
  onNavChange: (nav: string) => void;
  // Content
  trending: TMDBMovie[];
  shelves: { title: string; items: TMDBMovie[] }[];
  continueWatching?: any[];
  // Actions
  onSelect: (item: TMDBMovie) => void;
  onPlay: (item: TMDBMovie) => void;
  onSearchClick: () => void;
  onAuthClick: () => void;
  // Auth
  user?: any;
  profile?: { display_name: string | null } | null;
  onSignOut?: () => void;
  canInstall?: boolean;
  onInstall?: () => void;
}

const NAV_ITEMS = [
  { key: "Home",     path: "/",       icon: Home,     label: "Home" },
  { key: "Movies",   path: "/movies", icon: Film,     label: "Movies" },
  { key: "TV Shows", path: "/tv",     icon: Tv,       label: "TV Shows" },
  { key: "Anime",    path: "/anime",  icon: Sparkles, label: "Anime" },
];

const img = (path: string | null, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

const getTitle = (item: TMDBMovie) => item.title || item.name || "Untitled";
const getYear  = (item: TMDBMovie) => (item.release_date || item.first_air_date || "").slice(0, 4);

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({
  activeNav, onNavChange, onSearchClick, onAuthClick,
  user, profile, onSignOut, canInstall, onInstall
}: Omit<TabletLayoutProps, "trending" | "shelves" | "continueWatching" | "onSelect" | "onPlay">) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
    <aside className="tablet-sidebar flex flex-col h-full py-6 px-3 select-none">
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Watch
          </span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "hsl(346 90% 56%)" }}>
            by zuup
          </span>
        </div>
      </div>

      {/* Search */}
      <button
        onClick={onSearchClick}
        className="tablet-search-btn flex items-center gap-3 mx-1 mb-6 px-4 py-3 rounded-2xl text-left w-[calc(100%-8px)] group"
      >
        <Search size={16} className="text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
        <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">Search anything…</span>
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/20 px-4 mb-2">Browse</p>
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onNavChange(key)}
            className={`tablet-nav-item flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              activeNav === key
                ? "tablet-nav-active text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            <Icon size={18} className="flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-2 mt-4">
        {canInstall && (
          <button
            onClick={onInstall}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <Download size={16} />
            Install App
          </button>
        )}

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => user ? setProfileOpen(!profileOpen) : onAuthClick()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User size={14} />
            </div>
            <span className="truncate">{user ? (profile?.display_name || "Account") : "Sign In"}</span>
          </button>
          <AnimatePresence>
            {user && profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 15%)" }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm text-white/80 font-medium truncate">{profile?.display_name || "User"}</p>
                </div>
                <button
                  onClick={() => { onSignOut?.(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};

// ─── Hero Banner (tablet-optimized, horizontal card style) ───────────────────
const TabletHero = ({ items, onSelect, onPlay }: {
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
  onPlay: (item: TMDBMovie) => void;
}) => {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(0);
  const featured = items.slice(0, 6);
  const item = featured[index];

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % featured.length), 9000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (!item) return null;
  const backdrop = img(item.backdrop_path, "w1280");

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{ height: "340px" }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) setIndex(i => (i + (diff > 0 ? 1 : -1) + featured.length) % featured.length);
      }}
    >
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {backdrop && (
            <img src={backdrop} alt="" className="w-full h-full object-cover" />
          )}
          {/* Overlays */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.1) 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)"
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex">
        {/* Left: info */}
        <div className="flex flex-col justify-center px-8 py-6 max-w-[55%]">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                  style={{ background: "hsl(346 90% 56% / 0.2)", color: "hsl(346 90% 70%)", border: "1px solid hsl(346 90% 56% / 0.3)" }}>
                  Featured
                </span>
                <span className="text-xs text-white/40">{getYear(item)}</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(346 90% 70%)" }}>
                  <Star size={10} fill="currentColor" /> {item.vote_average?.toFixed(1)}
                </span>
              </div>

              <h2 className="font-bold text-white leading-tight mb-3"
                style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontFamily: "'Outfit', sans-serif" }}>
                {getTitle(item)}
              </h2>

              <p className="text-white/50 text-sm leading-relaxed mb-5 line-clamp-2">
                {item.overview}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onPlay(item)}
                  className="tablet-play-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                >
                  <Play size={14} fill="currentColor" /> Play Now
                </button>
                <button
                  onClick={() => onSelect(item)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Info size={14} /> More
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: poster stack */}
        <div className="flex-1 flex items-center justify-end pr-8 gap-3">
          {featured.slice(index, index + 3).map((f, i) => (
            <motion.button
              key={f.id}
              onClick={() => i === 0 ? onPlay(f) : setIndex((index + i) % featured.length)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex-shrink-0 rounded-2xl overflow-hidden group relative"
              style={{
                width: i === 0 ? "110px" : i === 1 ? "90px" : "72px",
                height: i === 0 ? "165px" : i === 1 ? "135px" : "108px",
                opacity: i === 0 ? 1 : i === 1 ? 0.7 : 0.4,
                boxShadow: i === 0 ? "0 8px 32px rgba(0,0,0,0.6)" : "none",
                border: i === 0 ? "2px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              {img(f.poster_path) && (
                <img src={img(f.poster_path)!} alt={getTitle(f)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-8 flex gap-1.5">
        {featured.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}
            className="rounded-full transition-all duration-400"
            style={{
              width: i === index ? "20px" : "6px",
              height: "6px",
              background: i === index ? "hsl(346 90% 56%)" : "rgba(255,255,255,0.2)"
            }} />
        ))}
      </div>
    </div>
  );
};

// ─── Content Row (horizontal shelf) ──────────────────────────────────────────
const TabletShelf = ({ title, items, onSelect }: {
  title: string;
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });
  };
  if (!items.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80 tracking-tight">{title}</h3>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {items.map(item => (
          <button key={item.id} onClick={() => onSelect(item)}
            className="flex-shrink-0 group focus:outline-none"
            style={{ width: "130px" }}
          >
            <div className="relative rounded-xl overflow-hidden mb-2 bg-white/[0.04]"
              style={{ aspectRatio: "2/3" }}>
              {img(item.poster_path) ? (
                <img src={img(item.poster_path)!} alt={getTitle(item)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No Image</div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(346 90% 56%)", boxShadow: "0 0 20px hsl(346 90% 56% / 0.5)" }}>
                  <Play size={16} fill="white" className="text-white ml-0.5" />
                </div>
              </div>
              {/* Rating chip */}
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                ★ {item.vote_average?.toFixed(1)}
              </div>
            </div>
            <p className="text-xs text-white/60 group-hover:text-white/90 truncate transition-colors text-left font-medium">
              {getTitle(item)}
            </p>
            <p className="text-[10px] text-white/30 text-left mt-0.5">{getYear(item)}</p>
          </button>
        ))}
        <div className="flex-shrink-0 w-2" />
      </div>
    </section>
  );
};

// ─── Continue Watching (tablet style - landscape cards) ───────────────────────
const TabletContinueWatching = ({ items, onPlay }: {
  items: any[];
  onPlay: (id: number, type: "movie" | "tv", season?: number, episode?: number) => void;
}) => {
  if (!items.length) return null;
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} style={{ color: "hsl(346 90% 56%)" }} />
        <h3 className="text-sm font-semibold text-white/80">Continue Watching</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {items.map(item => {
          const backdrop = img(item.backdrop_path || item.poster_path, "w780");
          return (
            <button key={item.id}
              onClick={() => onPlay(item.tmdb_id, item.media_type, item.season, item.episode)}
              className="flex-shrink-0 group focus:outline-none"
              style={{ width: "220px" }}
            >
              <div className="relative rounded-xl overflow-hidden mb-2 bg-white/[0.04]"
                style={{ aspectRatio: "16/9" }}>
                {backdrop && (
                  <img src={backdrop} alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy" />
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.4)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(346 90% 56%)" }}>
                    <Play size={16} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: "hsl(346 90% 56%)" }} />
                </div>
              </div>
              <p className="text-xs text-white/60 group-hover:text-white/90 truncate transition-colors text-left font-medium">
                {item.title}
              </p>
              {item.season && item.episode && (
                <p className="text-[10px] text-white/30 text-left mt-0.5">S{item.season} · E{item.episode}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

// ─── Quick Stats Bar ──────────────────────────────────────────────────────────
const QuickStats = ({ shelves }: { shelves: { title: string; items: TMDBMovie[] }[] }) => {
  const totalTitles = shelves.reduce((acc, s) => acc + s.items.length, 0);
  return (
    <div className="flex items-center gap-4 mb-6 px-1">
      {[
        { icon: Zap, label: "Live Now", value: shelves[0]?.items.length || 0 },
        { icon: TrendingUp, label: "Trending", value: shelves[1]?.items.length || 0 },
        { icon: Film, label: "Total Titles", value: totalTitles },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Icon size={14} style={{ color: "hsl(346 90% 56%)" }} />
          <div>
            <p className="text-xs font-bold text-white">{value}</p>
            <p className="text-[10px] text-white/30">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Tablet Layout ───────────────────────────────────────────────────────
const TabletLayout = ({
  activeNav, onNavChange, trending, shelves, continueWatching = [],
  onSelect, onPlay, onSearchClick, onAuthClick,
  user, profile, onSignOut, canInstall, onInstall,
}: TabletLayoutProps) => {
  return (
    <>
      <style>{`
        /* Only apply on tablet range */
        @media (min-width: 768px) and (max-width: 1199px) {
          .tablet-layout-wrapper {
            display: flex !important;
          }
          .mobile-layout-wrapper {
            display: none !important;
          }
        }
        @media (max-width: 767px), (min-width: 1200px) {
          .tablet-layout-wrapper {
            display: none !important;
          }
          .mobile-layout-wrapper {
            display: block !important;
          }
        }

        .tablet-sidebar {
          width: 200px;
          min-width: 200px;
          background: rgba(0,0,0,0.6);
          border-right: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
        }

        .tablet-nav-active {
          background: rgba(255,255,255,0.07);
          position: relative;
        }
        .tablet-nav-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: hsl(346 90% 56%);
          border-radius: 0 3px 3px 0;
        }

        .tablet-search-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.2s;
        }
        .tablet-search-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
        }

        .tablet-play-btn {
          background: hsl(346 90% 56%);
          box-shadow: 0 4px 20px hsl(346 90% 56% / 0.35);
          transition: all 0.2s;
        }
        .tablet-play-btn:hover {
          background: hsl(346 90% 62%);
          box-shadow: 0 6px 28px hsl(346 90% 56% / 0.5);
        }

        .tablet-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px 40px 24px;
          scrollbar-width: none;
        }
        .tablet-content::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="tablet-layout-wrapper fixed inset-0 bg-black">
        {/* Sidebar */}
        <Sidebar
          activeNav={activeNav}
          onNavChange={onNavChange}
          onSearchClick={onSearchClick}
          onAuthClick={onAuthClick}
          user={user}
          profile={profile}
          onSignOut={onSignOut}
          canInstall={canInstall}
          onInstall={onInstall}
        />

        {/* Main content area */}
        <main className="tablet-content">
          {/* Hero - only on Home */}
          {activeNav === "Home" && trending.length > 0 && (
            <div className="mb-6">
              <TabletHero items={trending} onSelect={onSelect} onPlay={onPlay} />
            </div>
          )}

          {/* Section header for non-Home */}
          {activeNav !== "Home" && (
            <div className="mb-6 pt-2">
              <h1 className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}>
                {activeNav}
              </h1>
            </div>
          )}

          {/* Quick stats on Home */}
          {activeNav === "Home" && shelves.length > 0 && (
            <QuickStats shelves={shelves} />
          )}

          {/* Continue Watching */}
          {continueWatching.length > 0 && activeNav === "Home" && (
            <TabletContinueWatching items={continueWatching} onPlay={() => {}} />
          )}

          {/* Content Shelves */}
          {shelves.map(({ title, items }) => (
            <TabletShelf key={title} title={title} items={items} onSelect={onSelect} />
          ))}
        </main>
      </div>
    </>
  );
};

export default TabletLayout;
