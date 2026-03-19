import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { TMDBMovie, img, getTitle, getYear } from "@/lib/tmdb";
import { useTVNav } from "@/hooks/useTVNav";

const HERO_ROW = -2; // Below header, above all content rows

interface FeaturedHeroProps {
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
  onPlay: (item: TMDBMovie) => void;
}

const FeaturedHero = ({ items, onSelect, onPlay }: FeaturedHeroProps) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);
  const { isTV, zone, focusedRow, focusedCol, registerRow, unregisterRow, registerRowAction, unregisterRowAction } = useTVNav();

  const isHeroFocused = isTV && zone === "content" && focusedRow === HERO_ROW;
  const featured = items.slice(0, 8);
  const item = featured[index] || null;

  // Pause auto-rotate when TV cursor is on hero
  useEffect(() => {
    if (featured.length <= 1 || isHeroFocused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex(prev => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length, isHeroFocused]);

  const goTo = useCallback((dir: -1 | 1) => {
    setDirection(dir);
    setIndex(prev => (prev + dir + featured.length) % featured.length);
  }, [featured.length]);

  // Register hero row with TV nav (2 buttons: Play=0, More Info=1)
  useEffect(() => {
    if (!isTV) return;
    registerRow(HERO_ROW, 2);
    return () => unregisterRow(HERO_ROW);
  }, [isTV, registerRow, unregisterRow]);

  // Register custom Enter action for hero row
  useEffect(() => {
    if (!isTV || !item) return;
    const captured = item;
    registerRowAction(HERO_ROW, (col) => {
      if (col === 0) onPlay(captured);
      else onSelect(captured);
    });
    return () => unregisterRowAction(HERO_ROW);
  }, [isTV, item, onPlay, onSelect, registerRowAction, unregisterRowAction]);

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
          initial={{ opacity: 0, scale: 1.1, x: direction > 0 ? 100 : -100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: direction > 0 ? -100 : 100 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {backdrop && (
            <motion.img
              src={backdrop}
              alt={getTitle(item)}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 15, ease: "linear" }}
              style={{ willChange: "transform, opacity" }}
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
            className="absolute left-2 sm:left-4 top-[35%] -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-background/20 text-foreground/40 hover:text-foreground hover:bg-background/60 transition-all hidden sm:block backdrop-blur-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => goTo(1)}
            className="absolute right-2 sm:right-4 top-[35%] -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-background/20 text-foreground/40 hover:text-foreground hover:bg-background/60 transition-all hidden sm:block backdrop-blur-sm"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-8 pb-32 md:pb-40 lg:pb-48 max-w-[1600px] mx-auto pointer-events-none *:pointer-events-auto">
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPlay(item)}
                className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 active:scale-95 touch-manipulation outline-none ${
                  isHeroFocused && focusedCol === 0
                    ? "bg-accent text-accent-foreground scale-110 shadow-[0_0_30px_hsla(346,90%,56%,0.7)] ring-2 ring-white/40"
                    : "bg-accent text-accent-foreground hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(225,29,72,0.4)] accent-glow"
                }`}
              >
                <Play size={14} fill="currentColor" />
                Play Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSelect(item)}
                className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm text-foreground active:scale-95 touch-manipulation outline-none transition-all duration-300 ${
                  isHeroFocused && focusedCol === 1
                    ? "bg-white/30 border border-white/60 scale-110 ring-2 ring-white/40 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    : "glass glass-hover hover:translate-y-[-2px]"
                }`}
              >
                <Info size={14} />
                More Info
              </motion.button>
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
