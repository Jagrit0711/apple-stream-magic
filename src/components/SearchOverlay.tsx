import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, TrendingUp, Sparkles, Filter, ChevronRight, Hash,
  Zap, Compass, Palette, Laugh, ShieldAlert, Camera, Theater, Wand2, Ghost, Heart, Rocket, Siren,
  Baby, Users, Map, Radio, Clapperboard
} from "lucide-react";
import { 
  searchMulti, 
  fetchTrendingDay, 
  TMDBMovie, 
  img, 
  getTitle, 
  getYear, 
  getContentType,
  MOVIE_GENRES,
  fetchMoviesByGenre
} from "@/lib/tmdb";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: TMDBMovie) => void;
}

const genreStyles: Record<number, { icon: any; color: string; bg: string }> = {
  28: { icon: Zap, color: "text-orange-500", bg: "from-orange-500/20" }, // Action
  12: { icon: Compass, color: "text-emerald-500", bg: "from-emerald-500/20" }, // Adventure
  16: { icon: Palette, color: "text-pink-500", bg: "from-pink-500/20" }, // Animation
  35: { icon: Laugh, color: "text-yellow-500", bg: "from-yellow-500/20" }, // Comedy
  80: { icon: ShieldAlert, color: "text-red-500", bg: "from-red-500/20" }, // Crime
  99: { icon: Camera, color: "text-blue-500", bg: "from-blue-500/20" }, // Documentary
  18: { icon: Theater, color: "text-purple-500", bg: "from-purple-500/20" }, // Drama
  14: { icon: Wand2, color: "text-fuchsia-500", bg: "from-fuchsia-500/20" }, // Fantasy
  27: { icon: Ghost, color: "text-indigo-500", bg: "from-indigo-500/20" }, // Horror
  10749: { icon: Heart, color: "text-rose-500", bg: "from-rose-500/20" }, // Romance
  878: { icon: Rocket, color: "text-cyan-500", bg: "from-cyan-500/20" }, // Sci-Fi
  53: { icon: Siren, color: "text-amber-500", bg: "from-amber-500/20" }, // Thriller
  10759: { icon: Map, color: "text-lime-500", bg: "from-lime-500/20" }, // Action & Adventure TV
  10751: { icon: Users, color: "text-sky-500", bg: "from-sky-500/20" }, // Family
  10762: { icon: Baby, color: "text-violet-500", bg: "from-violet-500/20" }, // Kids
  9648: { icon: Search, color: "text-zinc-400", bg: "from-zinc-500/20" }, // Mystery
  10765: { icon: Clapperboard, color: "text-teal-500", bg: "from-teal-500/20" }, // Sci-Fi & Fantasy TV
  10764: { icon: Radio, color: "text-orange-400", bg: "from-orange-400/20" }, // Reality
};

const SearchOverlay = ({ open, onClose, onSelect }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  const { data: genreResults, isLoading: genreLoading } = useQuery({
    queryKey: ["genre-search", selectedGenre],
    queryFn: () => selectedGenre ? fetchMoviesByGenre(selectedGenre) : Promise.resolve([]),
    enabled: !!selectedGenre,
  });

  const { data: trendingItems = [] } = useQuery({
    queryKey: ["trending-search"],
    queryFn: fetchTrendingDay,
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedGenre(null);
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSelect = (item: TMDBMovie) => {
    onSelect(item);
    onClose();
  };

  const isSearching = debouncedQuery.length > 2;
  const isFiltering = !!selectedGenre && !isSearching;
  const showSuggestions = !isSearching && !isFiltering;

  const currentResults = isSearching ? results : (isFiltering ? genreResults : []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md overscroll-contain flex flex-col pt-[max(10px,env(safe-area-inset-top))] will-change-transform"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Top Bar Container */}
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative group">
                <Search size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${query ? 'text-accent' : 'text-meta'}`} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    if (selectedGenre) setSelectedGenre(null);
                  }}
                  autoFocus
                  placeholder="Movies, TV or Anime..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-10 py-3.5 sm:py-5 text-[15px] sm:text-xl text-foreground placeholder:text-meta/60 focus:outline-none focus:bg-white/10 transition-all font-medium"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 text-meta hover:text-foreground transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[13px] font-black uppercase tracking-widest text-accent px-2"
              >
                Cancel
              </button>
            </div>

            {/* Genre Chips */}
            <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
              <Filter size={14} className="text-meta mr-2 flex-shrink-0" />
              {MOVIE_GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenre(selectedGenre === genre.id ? null : genre.id);
                    setQuery("");
                  }}
                  className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${
                    selectedGenre === genre.id
                      ? "bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-105"
                      : "bg-white/5 border-white/10 text-meta hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 scroll-smooth no-scrollbar">
            <div className="max-w-[1600px] mx-auto w-full">
              
              {/* discovery state */}
              {showSuggestions && (
                <div className="space-y-16 py-8">
                  {/* Top Searches Section */}
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <TrendingUp size={22} className="text-accent" />
                        <h2 className="text-2xl font-black tracking-tight uppercase">Trending Searches</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {trendingItems.slice(0, 12).map((item, idx) => (
                        <motion.button
                          key={item.id}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          onClick={() => handleSelect(item)}
                          className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all text-left group border border-white/5 hover:border-white/10 shadow-lg"
                        >
                          <span className="text-3xl font-black text-white/5 group-hover:text-accent/30 transition-colors w-10 text-center italic">
                            {idx + 1}
                          </span>
                          <div className="w-16 h-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-2xl">
                            {img(item.poster_path) && (
                              <img src={img(item.poster_path)!} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-black text-foreground group-hover:text-accent truncate mb-1">{getTitle(item)}</p>
                            <p className="text-[12px] text-meta flex items-center gap-1.5 uppercase font-black tracking-[0.2em]">
                            {getYear(item)} <span className="w-1.5 h-1.5 rounded-full bg-accent/40" /> {getContentType(item)}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>

                  {/* Hot Tags Section */}
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <Hash size={22} className="text-accent" />
                      <h2 className="text-2xl font-black tracking-tight uppercase">Popular Genres</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                      {MOVIE_GENRES.map(g => {
                        const style = genreStyles[g.id] || { icon: Filter, color: "text-meta", bg: "from-white/5" };
                        const Icon = style.icon;
                        return (
                          <motion.button 
                            key={g.id}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            onClick={() => setSelectedGenre(g.id)}
                            className={`aspect-[4/5] sm:aspect-square rounded-3xl bg-gradient-to-br ${style.bg} to-transparent border border-white/5 p-6 flex flex-col justify-between group hover:border-white/20 transition-all overflow-hidden relative shadow-2xl`}
                          >
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 bg-current transition-transform -z-10 blur-3xl group-hover:scale-150 ${style.color}`} />
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all shadow-inner">
                              <Icon size={24} className={`${style.color} transition-colors`} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest text-meta group-hover:text-foreground relative z-10 transition-colors">{g.name}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {/* results state */}
              {(isSearching || isFiltering) && (
                <div className="py-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} className="text-accent" />
                      <h2 className="text-xl font-bold tracking-tight">
                        {isSearching ? `Search results for "${debouncedQuery}"` : `Best of ${MOVIE_GENRES.find(g => g.id === selectedGenre)?.name}`}
                      </h2>
                    </div>
                    <p className="text-xs text-meta font-black uppercase tracking-widest">
                      {currentResults?.length || 0} items
                    </p>
                  </div>

                  {(isLoading || genreLoading) ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] rounded-2xl bg-surface shimmer" />
                      ))}
                    </div>
                  ) : currentResults && currentResults.length > 0 ? (
                    <motion.div 
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 overflow-visible"
                    >
                      {currentResults.map((item, idx) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 30,
                            delay: Math.min(idx * 0.05, 0.5) 
                          }}
                          whileHover={{ scale: 1.05, y: -8 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelect(item)}
                          className="group relative flex flex-col focus:outline-none z-10 hover:z-20"
                        >
                          <div className="relative aspect-[2/3] rounded-3xl overflow-hidden bg-surface mb-4 shadow-2xl transition-all duration-500 group-hover:shadow-accent/20">
                            {img(item.poster_path) ? (
                              <img src={img(item.poster_path, "w500")!} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-meta text-sm bg-surface">No Poster</div>
                            )}
                            
                            {/* Vote badge */}
                            <div className="absolute top-3 right-3 glass-strong text-[11px] font-black px-2 py-1.5 rounded-xl text-white shadow-xl">
                              <span className="text-accent mr-1">★</span>{item.vote_average?.toFixed(1)}
                            </div>
                            
                            {/* Hover info overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-2">{getContentType(item)}</p>
                              <p className="text-lg font-black text-white leading-[1.1] drop-shadow-2xl">{getTitle(item)}</p>
                            </div>
                          </div>
                          <div className="px-2">
                            <p className="text-[14px] font-black text-foreground truncate group-hover:text-accent transition-colors mb-0.5">
                              {getTitle(item)}
                            </p>
                            <p className="text-[11px] text-meta font-black uppercase tracking-[0.2em]">{getYear(item)}</p>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5"
                      >
                         <Filter size={32} className="text-meta" />
                      </motion.div>
                      <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-foreground">No matches found</h3>
                      <p className="text-meta max-w-sm mx-auto font-medium">We couldn't find exactly what you're looking for. Try a broader search or another category.</p>
                      <button 
                        onClick={() => { setQuery(""); setSelectedGenre(null); }}
                        className="mt-10 px-8 py-3 bg-white/5 hover:bg-accent hover:text-white rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all border border-white/10 hover:border-accent active:scale-95 shadow-xl"
                      >
                        Reset Discovery
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
