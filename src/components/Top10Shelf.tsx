import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, Volume2, VolumeX } from "lucide-react";
import { TMDBMovie, img, getTitle, getYear, getContentType, fetchTrailers } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePersistentMute } from "@/hooks/usePersistentMute";
import { useWatchlist } from "@/hooks/useWatchlist";

interface Top10ShelfProps {
  title: string;
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
}

const Top10Card = ({ item, index, onSelect }: { item: TMDBMovie, index: number, onSelect: (item: TMDBMovie) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const type = getContentType(item);
  const { isMuted, toggleMute } = usePersistentMute();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: trailers } = useQuery({
    queryKey: ["trailers", item.id, type],
    queryFn: () => fetchTrailers(item.id, type),
    enabled: isHovered,
  });

  const trailer = trailers?.[0];

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const func = isMuted ? "mute" : "unMute";
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: [] }),
        "*"
      );
    }
  }, [isMuted, isHovered]);

  return (
    <div 
      className="relative flex-shrink-0 snap-start"
      onMouseEnter={() => { hoverTimer.current = setTimeout(() => setIsHovered(true), 500); }}
      onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setIsHovered(false); }}
    >
      {/* Background Number */}
      <div className="absolute -left-8 sm:-left-12 bottom-0 top-0 flex items-center justify-center select-none pointer-events-none z-0">
        <motion.span 
          initial={{ opacity: 0, x: -40, scale: 0.8 }}
          whileInView={{ opacity: 0.6, x: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.1 }}
          className="text-[140px] sm:text-[220px] font-black leading-none text-transparent transition-all duration-500 group-hover:opacity-100"
          style={{ 
            WebkitTextStroke: index === 0 ? '5px rgba(255,255,255,0.5)' : '4px rgba(255,255,255,0.3)',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))'
          }}
        >
          {index + 1}
        </motion.span>
      </div>
      
      {/* Poster */}
      <motion.div 
        className="relative z-10 w-[110px] sm:w-[150px] md:w-[180px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl cursor-pointer border border-white/5"
        onClick={() => onSelect(item)}
      >
        {item.poster_path ? (
          <img src={img(item.poster_path, "w500")!} alt={getTitle(item)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center text-meta text-xs">No Image</div>
        )}
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="absolute z-[200] left-[-40%] top-0 bg-[#181818] rounded-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,1)] border border-white/10"
            style={{ width: "180%", pointerEvents: "auto", transformOrigin: "center center" }}
          >
             <div className="relative aspect-video w-full bg-black">
              {trailer ? (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${trailer.key}&playsinline=1&enablejsapi=1`}
                  className="w-full h-full object-cover scale-[1.1] pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <img src={img(item.backdrop_path || item.poster_path, "w780")!} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black transition-colors"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(`/${type}/${item.id}?autoplay=1`)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-lg"><Play size={16} fill="currentColor" /></motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => isInWatchlist(item.id) ? removeFromWatchlist(item.id) : addToWatchlist({ tmdb_id: item.id, media_type: type, title: getTitle(item), poster_path: item.poster_path, backdrop_path: item.backdrop_path })}
                  className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white bg-white/10"
                >
                  {isInWatchlist(item.id) ? <Check size={16} className="text-green-400" /> : <Plus size={16} />}
                </motion.button>
                <motion.button whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }} whileTap={{ scale: 0.9 }} onClick={() => onSelect(item)} className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white ml-auto bg-white/10"><Info size={16} /></motion.button>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-meta uppercase mb-1">
                <span className="text-green-400">★ {item.vote_average?.toFixed(1)}</span>
                <span>{getYear(item)}</span>
                <span className="border border-white/20 px-1 rounded-sm">{type}</span>
              </div>
              <h4 className="text-sm font-black text-white truncate">{getTitle(item)}</h4>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Top10Shelf = ({ title, items, onSelect }: Top10ShelfProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="mb-1 sm:mb-8">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-1">
        <h3 className="font-bold text-lg sm:text-2xl text-white tracking-tight leading-tight flex items-center gap-2">
           {title}
        </h3>
        <div className="hidden sm:flex gap-1">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("left")} className="p-2 rounded-full text-meta hover:text-foreground hover:bg-white/5 transition-all outline-none">
            <ChevronLeft size={24} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("right")} className="p-2 rounded-full text-meta hover:text-foreground hover:bg-white/5 transition-all outline-none">
            <ChevronRight size={24} />
          </motion.button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="shelf-scroll flex gap-10 sm:gap-14 overflow-x-auto overflow-y-visible px-10 sm:px-16 md:px-20 max-w-full snap-x snap-mandatory pt-4 sm:pt-6 pb-6 sm:pb-10 no-scrollbar -mt-4 sm:-mt-6"
      >
        {items.map((item, index) => (
          <Top10Card key={item.id} item={item} index={index} onSelect={onSelect} />
        ))}
        <div className="flex-shrink-0 w-8 sm:w-16" />
      </div>
    </section>
  );
};

export default Top10Shelf;
