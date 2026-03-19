import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TMDBMovie, img, getTitle, getYear, getContentType, fetchTrailers } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Check, Volume2, VolumeX, Info } from "lucide-react";
import { usePersistentMute } from "@/hooks/usePersistentMute";
import { useWatchlist } from "@/hooks/useWatchlist";

interface ContentCardProps {
  item: TMDBMovie;
  onClick: (item: TMDBMovie) => void;
  priority?: boolean;
  isTVFocused?: boolean;
}

const ContentCard = ({ item, onClick, priority = false, isTVFocused = false }: ContentCardProps) => {
  const poster = img(item.poster_path, "w500");
  const backdrop = img(item.backdrop_path, "w780");
  const navigate = useNavigate();
  const type = getContentType(item);
  // On TV: treat isTVFocused as hover (shows expanded card + trailer)
  const [isHovered, setIsHovered] = useState(false);
  const effectiveHover = isHovered || isTVFocused;
  const { isMuted, toggleMute } = usePersistentMute();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: trailers } = useQuery({
    queryKey: ["trailers", item.id, type],
    queryFn: () => fetchTrailers(item.id, type),
    enabled: effectiveHover,
    staleTime: 1000 * 60 * 60,
  });

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMute();
  };

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const func = isMuted ? "mute" : "unMute";
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: [] }),
        "*"
      );
    }
  }, [isMuted, isHovered]);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setIsHovered(false);
  };

  const trailer = trailers?.[0];

  return (
    <div
      className={`relative flex-shrink-0 w-[130px] sm:w-[160px] md:w-[200px] transition-transform duration-200 ${
        isTVFocused ? "scale-105 z-10" : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base Poster with TV focus ring */}
      <div
        className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-surface cursor-pointer shadow-lg shadow-black/40 group border transition-all duration-200 ${
          isTVFocused
            ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background shadow-[0_0_30px_hsla(346,90%,56%,0.6)]"
            : "border-white/5"
        }`}
        onClick={() => onClick(item)}
      >
        {poster ? (
          <img src={poster} alt={getTitle(item)} className="w-full h-full object-cover" loading={priority ? "eager" : "lazy"} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-meta text-xs">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* TV focus overlay — play icon in centre */}
        {isTVFocused && (
          <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-2xl accent-glow">
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Expanded Hover/Focus State (Landscape) */}
      <AnimatePresence>
        {effectiveHover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute z-[200] top-0 left-[-30%] bg-[#181818] rounded-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,1)] border border-white/10"
            style={{ width: "160%", pointerEvents: "auto", transformOrigin: "center center" }}
          >
            {/* Video / Backdrop Area */}
            <div className="relative aspect-video w-full bg-black">
              {trailer ? (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${trailer.key}&playsinline=1&enablejsapi=1`}
                  className="w-full h-full object-cover scale-[1.1] pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <img src={backdrop || poster || ""} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              
              <button
                onClick={handleToggleMute}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 pt-2">
              <div className="flex items-center gap-2 mb-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(`/${type}/${item.id}?autoplay=1`)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg"
                >
                  <Play size={20} fill="currentColor" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isInWatchlist(item.id)) removeFromWatchlist(item.id);
                    else addToWatchlist({ tmdb_id: item.id, media_type: type, title: getTitle(item), poster_path: item.poster_path, backdrop_path: item.backdrop_path });
                  }}
                  className={`w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white transition-colors hover:border-white ${isInWatchlist(item.id) ? "bg-green-500/20 border-green-500" : "bg-white/10"}`}
                >
                  {isInWatchlist(item.id) ? <Check size={18} className="text-green-400" /> : <Plus size={18} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onClick(item)}
                  className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white transition-colors bg-white/10 ml-auto"
                >
                  <Info size={18} />
                </motion.button>
              </div>

              <div className="flex items-center gap-2 text-[12px] font-bold text-meta uppercase tracking-wider mb-2">
                <span className="text-green-400 font-black">★ {item.vote_average?.toFixed(1)}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{getYear(item)}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="border border-white/20 px-1 rounded-sm text-[10px]">{type}</span>
              </div>
              
              <h4 className="text-sm font-black text-white truncate leading-tight">{getTitle(item)}</h4>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentCard;
