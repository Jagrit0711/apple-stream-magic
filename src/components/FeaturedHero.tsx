import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";
import { TMDBMovie, img, getTitle, getYear } from "@/lib/tmdb";

interface FeaturedHeroProps {
  item: TMDBMovie;
  onSelect: (item: TMDBMovie) => void;
  onPlay: (item: TMDBMovie) => void;
}

const FeaturedHero = ({ item, onSelect, onPlay }: FeaturedHeroProps) => {
  const backdrop = img(item.backdrop_path, "original");

  return (
    <div className="relative w-full h-[85vh] min-h-[500px] overflow-hidden">
      {backdrop && (
        <motion.img
          src={backdrop}
          alt={getTitle(item)}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 pb-20 max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="glass inline-block rounded-full px-4 py-1.5 mb-4">
            <p className="text-[11px] text-meta tracking-widest uppercase font-medium">Featured</p>
          </div>
          <h2 className="font-bold text-4xl md:text-6xl lg:text-7xl text-foreground mb-4 max-w-2xl leading-[1.05] tracking-tight">
            {getTitle(item)}
          </h2>
          <p className="text-meta text-sm mb-2 font-medium">{getYear(item)} · ★ {item.vote_average?.toFixed(1)}</p>
          <p className="text-foreground/60 text-sm max-w-lg mb-8 line-clamp-2 leading-relaxed">
            {item.overview}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3 rounded-full font-semibold text-sm hover:bg-accent/90 transition-all duration-300 accent-glow"
            >
              <Play size={16} fill="currentColor" />
              Play Now
            </button>
            <button
              onClick={() => onSelect(item)}
              className="flex items-center gap-2 glass glass-hover px-7 py-3 rounded-full font-semibold text-sm text-foreground"
            >
              <Info size={16} />
              More Info
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturedHero;
