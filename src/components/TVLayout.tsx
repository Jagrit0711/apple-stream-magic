import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Film, Tv2, Search, User, Play, Info,
  Star, Clock, Flame, ChevronRight, X, ArrowRight
} from "lucide-react";
import { TMDBMovie, img, getTitle, getYear, getContentType, searchMulti } from "@/lib/tmdb";

interface TVLayoutProps {
  trending: TMDBMovie[];
  shelves: { title: string; items: TMDBMovie[] }[];
  continueWatching?: any[];
  onPlay: (item: TMDBMovie) => void;
  onSelect: (item: TMDBMovie) => void;
}

const NAV_ITEMS = [
  { id: "home",    label: "Home",     icon: Home   },
  { id: "movies",  label: "Movies",   icon: Film   },
  { id: "tv",      label: "TV Shows", icon: Tv2    },
  { id: "search",  label: "Search",   icon: Search },
  { id: "profile", label: "Profile",  icon: User   },
];

// ── TV Search ──────────────────────────────────────────────────────────────
function TVSearch({ onSelect, onClose }: { onSelect: (item: TMDBMovie) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setFocusIdx(-1); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const r = await searchMulti(query);
      setResults(r.slice(0, 12));
      setFocusIdx(-1);
    }, 400);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, -1)); if (focusIdx <= 0) inputRef.current?.focus(); }
      if (e.key === "Enter" && focusIdx >= 0 && results[focusIdx]) { onSelect(results[focusIdx]); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [query, results, focusIdx, onClose, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-3xl flex flex-col items-center pt-16 px-10"
    >
      <button onClick={onClose} className="absolute top-6 right-8 text-foreground/30 hover:text-foreground transition-colors p-2">
        <X size={26} />
      </button>

      {/* Big search input */}
      <div className="w-full max-w-3xl relative mb-10">
        <Search size={26} className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/30" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & TV shows..."
          className="w-full glass border-2 border-white/10 focus:border-accent rounded-2xl pl-16 pr-6 py-5 text-foreground text-2xl font-medium placeholder:text-foreground/20 outline-none transition-all focus:shadow-[0_0_40px_hsla(346,90%,56%,0.3)] bg-transparent"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="w-full max-w-5xl grid grid-cols-4 md:grid-cols-6 gap-4 overflow-y-auto max-h-[65vh] scrollbar-none">
          {results.map((item, i) => {
            const focused = i === focusIdx;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelect(item)}
                className={`
                  flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-200 outline-none
                  ${focused ? "ring-2 ring-accent scale-105 shadow-[0_0_30px_hsla(346,90%,56%,0.4)] opacity-100" : "opacity-60 hover:opacity-100 hover:scale-102"}
                `}
              >
                <div className="aspect-[2/3] bg-surface relative overflow-hidden">
                  {item.poster_path
                    ? <img src={img(item.poster_path, "w500")!} alt={getTitle(item)} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-foreground/10"><Film size={28}/></div>
                  }
                  {focused && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <Play size={28} fill="white" className="text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <div className="p-2 bg-surface">
                  <p className="text-foreground text-[11px] font-semibold truncate">{getTitle(item)}</p>
                  <p className="text-meta text-[10px] capitalize mt-0.5">{item.media_type}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : query ? (
        <p className="text-foreground/30 text-xl mt-12">No results for "{query}"</p>
      ) : (
        <div className="text-center mt-12">
          <Search size={56} className="mx-auto mb-5 text-foreground/10" />
          <p className="text-foreground/30 text-xl font-medium">Search for anything</p>
          <p className="text-meta text-sm mt-2">↑↓ Navigate · Enter to open · Esc to close</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Auto-rotating TV Hero (same feel as FeaturedHero) ─────────────────────
function TVHero({ items, onPlay, onSelect }: { items: TMDBMovie[]; onPlay: (i: TMDBMovie) => void; onSelect: (i: TMDBMovie) => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const featured = items.slice(0, 8);
  const item = featured[index];

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => {
      setDirection(1);
      setIndex(p => (p + 1) % featured.length);
    }, 9000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (!item) return null;

  return (
    <div className="relative w-full h-[62vh] min-h-[400px] overflow-hidden rounded-3xl mb-2">
      {/* Backdrop with pan animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={item.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.08, x: direction > 0 ? 60 : -60 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96, x: direction > 0 ? -60 : 60 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {item.backdrop_path && (
            <motion.img
              src={img(item.backdrop_path, "original")!}
              alt={getTitle(item)}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 14, ease: "linear" }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients — same as FeaturedHero */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-10 pb-12 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 border border-white/10">
              <Flame size={12} className="text-accent" />
              <span className="text-[11px] text-meta tracking-widest uppercase font-medium">Trending Now</span>
            </div>

            <h1 className="font-bold text-5xl md:text-6xl text-foreground mb-3 leading-tight tracking-tight drop-shadow-2xl">
              {getTitle(item)}
            </h1>
            <p className="text-meta text-sm mb-2 font-medium">{getYear(item)} · ★ {item.vote_average?.toFixed(1)}</p>
            <p className="text-foreground/60 text-sm max-w-xl mb-7 line-clamp-2 leading-relaxed">
              {item.overview}
            </p>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlay(item)}
                id="tv-hero-play"
                className="flex items-center gap-2.5 bg-accent text-accent-foreground px-8 py-3.5 rounded-full font-semibold text-sm hover:shadow-[0_8px_30px_hsla(346,90%,56%,0.4)] transition-all duration-300 accent-glow outline-none focus:shadow-[0_0_0_3px_hsla(346,90%,56%,0.5)] focus:scale-105"
              >
                <Play size={16} fill="currentColor" /> Play Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(item)}
                className="flex items-center gap-2.5 glass glass-hover px-8 py-3.5 rounded-full font-semibold text-sm text-foreground outline-none focus:border-accent focus:scale-105 transition-all"
              >
                <Info size={16} /> More Info
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        {featured.length > 1 && (
          <div className="flex items-center gap-1.5 mt-5">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-6 bg-accent" : "w-2 bg-foreground/20 hover:bg-foreground/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── D-Pad Navigable Shelf Row ──────────────────────────────────────────────
function TVShelfRow({
  title, items, isFocusedRow, onRequestFocus, onSelect,
}: {
  title: string;
  items: TMDBMovie[];
  isFocusedRow: boolean;
  onRequestFocus: () => void;
  onSelect: (item: TMDBMovie) => void;
}) {
  const [focusIdx, setFocusIdx] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isFocusedRow) {
      btnRefs.current[focusIdx]?.focus();
      btnRefs.current[focusIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [isFocusedRow, focusIdx]);

  useEffect(() => {
    if (!isFocusedRow) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, items.length - 1)); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && items[focusIdx]) onSelect(items[focusIdx]);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isFocusedRow, focusIdx, items, onSelect]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className={`text-sm font-semibold tracking-tight transition-colors duration-200 ${isFocusedRow ? "text-foreground" : "text-foreground/50"}`}>
          {title}
        </h2>
        {isFocusedRow && (
          <span className="text-meta text-[10px] flex items-center gap-1">
            ←→ navigate · Enter open
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-3 snap-x snap-mandatory px-1">
        {items.slice(0, 20).map((item, i) => {
          const focused = isFocusedRow && i === focusIdx;
          return (
            <motion.button
              key={item.id}
              ref={el => { btnRefs.current[i] = el; }}
              onClick={() => { onRequestFocus(); onSelect(item); }}
              onFocus={() => { onRequestFocus(); setFocusIdx(i); }}
              whileHover={{ scale: 1.06, translateY: -4 }}
              whileTap={{ scale: 0.96 }}
              className={`
                snap-start shrink-0 w-36 md:w-44 flex flex-col rounded-2xl overflow-hidden text-left
                transition-all duration-300 outline-none content-card
                ${focused
                  ? "scale-110 ring-2 ring-accent shadow-[0_0_30px_hsla(346,90%,56%,0.5)] opacity-100 z-10"
                  : "opacity-55 hover:opacity-90"}
              `}
            >
              {/* Poster */}
              <div className="aspect-[2/3] bg-surface relative overflow-hidden">
                {item.poster_path
                  ? <img src={img(item.poster_path, "w500")!} alt={getTitle(item)} className="w-full h-full object-cover" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-foreground/10"><Film size={28}/></div>
                }
                {/* Focused play overlay */}
                <AnimatePresence>
                  {focused && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-accent/20 flex items-center justify-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-xl accent-glow">
                        <Play size={18} fill="white" className="ml-0.5" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Rating */}
                <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                {item.vote_average > 0 && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                    <Star size={9} fill="currentColor" /> {item.vote_average.toFixed(1)}
                  </div>
                )}
              </div>
              {/* Label */}
              <div className={`px-2.5 py-2 transition-colors ${focused ? "bg-accent/10" : "bg-surface"}`}>
                <p className="text-foreground text-[11px] font-semibold leading-tight truncate">{getTitle(item)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}

// ── Main TV Home Layout ────────────────────────────────────────────────────
const TVLayout = ({ trending, shelves, continueWatching = [], onPlay, onSelect }: TVLayoutProps) => {
  const [navOpen, setNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [navIdx, setNavIdx] = useState(0);
  const [focusedRow, setFocusedRow] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const allRows = shelves.filter(s => s.items.length > 0);

  // Global keyboard navigation
  useEffect(() => {
    if (searchOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      // Open sidebar with left arrow from content
      if (e.key === "ArrowLeft" && !navOpen) {
        setNavOpen(true); return;
      }
      // Close sidebar with right arrow
      if (e.key === "ArrowRight" && navOpen) {
        setNavOpen(false); return;
      }
      // Sidebar navigation
      if (navOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); setNavIdx(i => Math.min(i + 1, NAV_ITEMS.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setNavIdx(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter") {
          const nav = NAV_ITEMS[navIdx];
          setActiveNav(nav.id);
          setNavOpen(false);
          if (nav.id === "search") setSearchOpen(true);
        }
        if (e.key === "Escape") setNavOpen(false);
        return;
      }
      // Content row navigation
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusedRow(r => Math.min(r + 1, allRows.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setFocusedRow(r => Math.max(r - 1, 0)); }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navOpen, navIdx, focusedRow, allRows.length, searchOpen]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: navOpen ? 216 : 68 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="shrink-0 h-full border-r border-border flex flex-col py-8 overflow-hidden z-20 bg-background"
      >
        {/* Logo mark */}
        <div className="px-4 mb-10">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center font-black text-accent-foreground text-base shrink-0 accent-glow">
            W
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5 px-2 flex-1">
          {NAV_ITEMS.map((nav, i) => {
            const Icon = nav.icon;
            const isFocused = navOpen && i === navIdx;
            const isActive = activeNav === nav.id && !navOpen;
            return (
              <button
                key={nav.id}
                onClick={() => { setNavIdx(i); setActiveNav(nav.id); setNavOpen(false); if (nav.id === "search") setSearchOpen(true); }}
                className={`
                  flex items-center gap-3.5 px-3 py-3 rounded-xl font-semibold transition-all duration-200 outline-none text-left whitespace-nowrap w-full
                  ${isFocused ? "bg-accent text-accent-foreground accent-glow scale-[1.02]" : ""}
                  ${isActive && !isFocused ? "bg-surface text-foreground" : ""}
                  ${!isFocused && !isActive ? "text-meta hover:text-foreground hover:bg-surface" : ""}
                `}
              >
                <Icon size={20} className="shrink-0" />
                <motion.span
                  animate={{ opacity: navOpen ? 1 : 0, x: navOpen ? 0 : -6 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm overflow-hidden"
                >
                  {nav.label}
                </motion.span>
              </button>
            );
          })}
        </nav>

        {/* Remote hint */}
        <AnimatePresence>
          {navOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-2 text-meta text-[10px] space-y-0.5"
            >
              <p>↑↓ Navigate</p>
              <p>→  To content</p>
              <p>Enter Select</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-12">
        <div className="px-8 pt-8 space-y-2">

          {/* Hero */}
          {trending.length > 0 && (
            <TVHero
              items={trending}
              onPlay={onPlay}
              onSelect={onSelect}
            />
          )}

          {/* Continue Watching */}
          {continueWatching.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 mt-6"
            >
              <h2 className="text-sm font-semibold text-foreground/50 mb-3 px-1 flex items-center gap-2">
                <Clock size={14} className="text-accent" /> Continue Watching
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 px-1">
                {continueWatching.map((item: any) => (
                  <button key={item.id} className="shrink-0 w-52 rounded-2xl overflow-hidden bg-surface text-left outline-none hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-accent transition-all duration-200">
                    <div className="aspect-video relative">
                      {item.backdrop_path && <img src={img(item.backdrop_path, "w500")!} alt={item.title} className="w-full h-full object-cover"/>}
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-foreground/10">
                        <div className="h-full bg-accent" style={{ width: `${(item.progress || 0) * 100}%` }}/>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-foreground text-xs font-semibold truncate">{item.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Content Shelves */}
          <div className="mt-4">
            {allRows.map((shelf, i) => (
              <TVShelfRow
                key={shelf.title}
                title={shelf.title}
                items={shelf.items}
                isFocusedRow={!navOpen && focusedRow === i}
                onRequestFocus={() => setFocusedRow(i)}
                onSelect={onSelect}
              />
            ))}
          </div>

          {/* Remote hints footer */}
          <div className="flex items-center justify-center gap-8 py-8 text-meta text-[11px] border-t border-border mt-4">
            <span className="flex items-center gap-1.5">← Sidebar</span>
            <span className="flex items-center gap-1.5">↑↓ Rows</span>
            <span className="flex items-center gap-1.5">←→ Cards</span>
            <span className="flex items-center gap-1.5">Enter Open</span>
            <span className="flex items-center gap-1.5">Esc Back</span>
          </div>
        </div>
      </main>

      {/* ── SEARCH ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <TVSearch
            onSelect={(item) => { setSearchOpen(false); onSelect(item); }}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TVLayout;
