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
          className="fixed inset-0 z-[70] bg-background/98"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Search bar */}
          <div className="max-w-3xl mx-auto px-6 pt-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-meta" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search for movies, TV shows, anime..."
                  className="w-full bg-surface border border-border rounded-2xl pl-12 pr-5 py-4 text-base text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-meta hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-5 py-4 text-sm text-meta hover:text-foreground transition-colors font-medium"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {trendingItems.slice(0, 8).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-surface hover:bg-surface-hover transition-all text-left group"
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {img(item.poster_path) && (
                          <img src={img(item.poster_path)!} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[70vh] overflow-y-auto pb-8">
                    {results.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="group text-left focus:outline-none"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2">
                          {img(item.poster_path) ? (
                            <img src={img(item.poster_path)!} alt={getTitle(item)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-meta text-sm">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <p className="text-[13px] text-foreground/70 group-hover:text-foreground transition-colors truncate font-medium">{getTitle(item)}</p>
                        <p className="text-[11px] text-meta">{getYear(item)} · ★ {item.vote_average?.toFixed(1)}</p>
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
