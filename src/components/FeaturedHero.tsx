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
    <div className="relative w-full h-[80vh] min-h-[500px] overflow-hidden">
      {backdrop && (
        <motion.img
          src={backdrop}
          alt={getTitle(item)}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-16 max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="font-body text-sm text-meta mb-3 tracking-widest uppercase">Featured</p>
          <h2 className="font-display font-bold text-5xl md:text-7xl text-foreground mb-4 max-w-2xl leading-tight">
            {getTitle(item)}
          </h2>
          <p className="font-body text-meta text-base mb-2">{getYear(item)}</p>
          <p className="font-body text-foreground/80 text-base max-w-xl mb-8 line-clamp-3 leading-relaxed">
            {item.overview}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2 bg-foreground text-primary-foreground px-8 py-3 rounded-md font-display font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              <Play size={18} fill="currentColor" />
              Play
            </button>
            <button
              onClick={() => onSelect(item)}
              className="flex items-center gap-2 bg-surface/80 text-foreground px-8 py-3 rounded-md font-display font-semibold text-sm hover:bg-surface transition-colors backdrop-blur-sm"
            >
              <Info size={18} />
              More Info
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturedHero;
