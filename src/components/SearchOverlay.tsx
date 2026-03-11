import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Sparkles } from "lucide-react";
import { searchMulti, fetchTrendingDay, TMDBMovie, img, getTitle, getYear, getContentType } from "@/lib/tmdb";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: TMDBMovie) => void;
}

const SearchOverlay = ({ open, onClose, onSelect }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMulti(query),
    enabled: query.length > 2,
  });

  const { data: trendingItems = [] } = useQuery({
    queryKey: ["trending-search"],
    queryFn: fetchTrendingDay,
  });

  useEffect(() => {
    if (open) {
      setQuery("");
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

  const showResults = query.length > 2;
  const showTrending = !showResults && trendingItems.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-background/98 overflow-y-auto overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
              onClose();
            }
          }}
        >
          <div ref={contentRef} className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8">
            {/* Search bar */}
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-meta" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search movies, TV shows, anime..."
                  className="w-full bg-surface border border-border rounded-2xl pl-11 sm:pl-12 pr-10 py-3.5 sm:py-4 text-sm sm:text-base text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-meta hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-3 sm:px-5 py-3.5 sm:py-4 text-sm text-meta hover:text-foreground transition-colors font-medium flex-shrink-0"
              >
                Cancel
              </button>
            </div>

            {/* Trending suggestions */}
            {showTrending && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-accent" />
                  <p className="text-xs text-meta uppercase tracking-wider font-medium">Trending Now</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {trendingItems.slice(0, 8).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-surface hover:bg-surface-hover transition-all text-left group active:scale-[0.98]"
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {img(item.poster_path) && (
                          <img src={img(item.poster_path)!} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground/80 group-hover:text-foreground truncate font-medium">{getTitle(item)}</p>
                        <p className="text-[11px] text-meta">{getYear(item)} · {getContentType(item) === "tv" ? "TV" : "Movie"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && showResults && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-surface shimmer" />
                ))}
              </div>
            )}

            {/* Results */}
            {!isLoading && showResults && results && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-accent" />
                  <p className="text-xs text-meta uppercase tracking-wider font-medium">{results.length} results</p>
                </div>
                {results.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 pb-8">
                    {results.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="group text-left focus:outline-none active:scale-[0.97] transition-transform"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2">
                          {img(item.poster_path) ? (
                            <img src={img(item.poster_path)!} alt={getTitle(item)} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-meta text-sm">No Image</div>
                          )}
                          {/* Always-visible bottom info bar */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-8 pb-2 px-2">
                            <p className="text-[11px] text-foreground font-medium truncate">{getTitle(item)}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-accent">★ {item.vote_average?.toFixed(1)}</span>
                              <span className="text-[10px] text-meta">{getYear(item)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-meta">No results for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
