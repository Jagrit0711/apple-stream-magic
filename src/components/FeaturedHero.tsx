import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { TMDBMovie, img, getTitle, getYear } from "@/lib/tmdb";

interface FeaturedHeroProps {
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
  onPlay: (item: TMDBMovie) => void;
}

const FeaturedHero = ({ items, onSelect, onPlay }: FeaturedHeroProps) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);

  const featured = items.slice(0, 8);
  const item = featured[index] || null;

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex(prev => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const goTo = useCallback((dir: -1 | 1) => {
    setDirection(dir);
    setIndex(prev => (prev + dir + featured.length) % featured.length);
  }, [featured.length]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? 1 : -1);
    }
  };

  if (!item) return null;

  const backdrop = img(item.backdrop_path, "original");

  return (
    <div
      className="relative w-full h-[70vh] sm:h-[80vh] md:h-[85vh] min-h-[400px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={item.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {backdrop && (
            <motion.img
              src={backdrop}
              alt={getTitle(item)}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "easeOut" }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Navigation arrows - hidden on mobile (use swipe) */}
      {featured.length > 1 && (
        <>
          <button
            onClick={() => goTo(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-background/40 text-foreground/60 hover:text-foreground hover:bg-background/60 transition-all hidden sm:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goTo(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-background/40 text-foreground/60 hover:text-foreground hover:bg-background/60 transition-all hidden sm:block"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="inline-block rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 bg-[hsla(0,0%,100%,0.06)] border border-[hsla(0,0%,100%,0.08)]">
              <p className="text-[10px] sm:text-[11px] text-meta tracking-widest uppercase font-medium">Featured</p>
            </div>
            <h2 className="font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-foreground mb-3 sm:mb-4 max-w-2xl leading-[1.05] tracking-tight">
              {getTitle(item)}
            </h2>
            <p className="text-meta text-xs sm:text-sm mb-2 font-medium">{getYear(item)} · ★ {item.vote_average?.toFixed(1)}</p>
            <p className="text-foreground/60 text-xs sm:text-sm max-w-lg mb-6 sm:mb-8 line-clamp-2 leading-relaxed">
              {item.overview}
            </p>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onPlay(item)}
                className="flex items-center gap-2 bg-accent text-accent-foreground px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm hover:bg-accent/90 transition-all duration-300 accent-glow active:scale-95 touch-manipulation"
              >
                <Play size={14} fill="currentColor" />
                Play Now
              </button>
              <button
                onClick={() => onSelect(item)}
                className="flex items-center gap-2 glass glass-hover px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm text-foreground active:scale-95 touch-manipulation"
              >
                <Info size={14} />
                More Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicator dots */}
        {featured.length > 1 && (
          <div className="flex items-center gap-1.5 mt-4 sm:mt-6">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`h-1 rounded-full transition-all duration-500 touch-manipulation ${
                  i === index ? "w-6 bg-accent" : "w-2 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedHero;
