import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TMDBMovie, img, getTitle, getYear, getContentType, fetchTrailers } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface ContentCardProps {
  item: TMDBMovie;
  onClick: (item: TMDBMovie) => void;
}

const ContentCard = ({ item, onClick }: ContentCardProps) => {
  const poster = img(item.poster_path, "w500");
  const navigate = useNavigate();
  const type = getContentType(item);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: trailers } = useQuery({
    queryKey: ["trailers", item.id, type],
    queryFn: () => fetchTrailers(item.id, type),
    enabled: isHovered, // Only fetch when hovered
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Toggle Youtube audio seamlessly via postMessage
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (iframeRef.current?.contentWindow) {
      const func = isMuted ? "unMute" : "mute";
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: [] }),
        "*"
      );
      setIsMuted(!isMuted);
    }
  };

  const handleClick = () => {
    onClick(item); // opens DetailView overlay
  };

  const handleMouseEnter = () => {
    // Delay trailer playback to avoid spamming network while scrolling fast
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 600);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setIsHovered(false);
    setIsMuted(true); // reset audio state
  };

  const trailer = trailers?.[0];

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      className="content-card flex-shrink-0 w-[130px] sm:w-[160px] md:w-[200px] group focus:outline-none relative active:scale-[0.97] touch-manipulation"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2 sm:mb-3">
        {/* Main Poster Image */}
        {poster ? (
          <img
            src={poster}
            alt={getTitle(item)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 
              ${isHovered ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center text-meta text-sm bg-surface">
            No Image
          </div>
        )}

        <AnimatePresence>
          {isHovered && trailer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-black z-10 scale-110"
            >
              <iframe
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailer.key}&playsinline=1&enablejsapi=1`}
                className="w-full h-full object-cover scale-150 pointer-events-none"
                allow="autoplay; encrypted-media"
              />
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none" />
              
              {/* Mute toggle button - placed securely so it doesn't interrupt card clicks */}
              <button
                onClick={toggleMute}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white border border-white/10 hover:bg-black/60 transition-all z-30 pointer-events-auto"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info overlay inside card bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-3 px-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-20">
          <p className="text-[12px] sm:text-sm text-white font-bold truncate leading-tight drop-shadow-md">
            {getTitle(item)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] sm:text-xs text-white/80 font-medium bg-white/20 px-1.5 rounded">{getYear(item)}</span>
            <span className="text-[10px] sm:text-xs text-green-400 font-bold drop-shadow-md">★ {item.vote_average?.toFixed(1)}</span>
          </div>
        </div>

        {/* Glow effect */}
        <div className="card-glow absolute -inset-1 rounded-xl bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      </div>

      {/* Text below card (hidden on hover for cleaner look) */}
      <p className="text-[12px] sm:text-[13px] text-foreground/70 group-hover:text-transparent transition-colors truncate text-left font-medium pb-1">
        {getTitle(item)}
      </p>
    </button>
  );
};

export default ContentCard;
