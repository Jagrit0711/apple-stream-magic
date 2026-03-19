import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, Volume2, VolumeX } from "lucide-react";
import { TMDBMovie, img, getTitle, getYear, getContentType, fetchTrailers } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePersistentMute } from "@/hooks/usePersistentMute";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTVNav } from "@/hooks/useTVNav";
import { useLayout } from "./MainLayout";

interface Top10ShelfProps {
  title: string;
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
  rowIndex?: number;
}

const Top10Card = ({ item, index, onSelect, isTVFocused = false }: { item: TMDBMovie; index: number; onSelect: (item: TMDBMovie) => void; isTVFocused?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const effectiveHover = isHovered || isTVFocused;
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const type = getContentType(item);
  const { isMuted, toggleMute } = usePersistentMute();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: trailers } = useQuery({
    queryKey: ["trailers", item.id, type],
    queryFn: () => fetchTrailers(item.id, type),
    enabled: effectiveHover,
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          className="text-[140px] sm:text-[220px] font-black leading-none text-transparent transition-all duration-500 group-hover:opacity-100"
          style={{ 
            WebkitTextStroke: index === 0 ? '5px rgba(255,255,255,0.5)' : '4px rgba(255,255,255,0.3)',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))'
          }}
        >
          {index + 1}
        </motion.span>
      </div>
      
      {/* Poster with TV focus ring */}
      <div 
        className={`relative z-10 w-[110px] sm:w-[150px] md:w-[180px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl cursor-pointer border transition-all duration-200 ${
          isTVFocused
            ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background shadow-[0_0_30px_hsla(346,90%,56%,0.6)] scale-105"
            : "border-white/5"
        }`}
        onClick={() => onSelect(item)}
      >
        {item.poster_path ? (
          <img src={img(item.poster_path, "w500")!} alt={getTitle(item)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center text-meta text-xs">No Image</div>
        )}
        {isTVFocused && (
          <div className="absolute inset-0 bg-accent/15 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-2xl accent-glow">
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {effectiveHover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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

const Top10Shelf = ({ title, items, onSelect, rowIndex = -1 }: Top10ShelfProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { focusedRow, focusedCol, isTV, zone, registerRow, unregisterRow } = useTVNav();
  const { registerTVContent } = useLayout();

  const isFocusedRow = isTV && zone === "content" && rowIndex !== -1 && focusedRow === rowIndex;

  useEffect(() => {
    if (rowIndex === -1 || !isTV) return;
    registerRow(rowIndex, items.length);
    return () => unregisterRow(rowIndex);
  }, [rowIndex, items.length, isTV, registerRow, unregisterRow]);

  useEffect(() => {
    if (rowIndex === -1 || !isTV) return;
    registerTVContent(rowIndex, items);
  }, [rowIndex, items, isTV, registerTVContent]);

  // Auto-scroll focused card
  useEffect(() => {
    if (!isFocusedRow || !scrollRef.current) return;
    const cards = scrollRef.current.querySelectorAll("[data-card]");
    const card = cards[focusedCol] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [isFocusedRow, focusedCol]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="mb-1 sm:mb-8">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-1">
        <h3 className={`font-bold text-lg sm:text-2xl tracking-tight leading-tight flex items-center gap-2 transition-colors duration-200 ${
          isFocusedRow ? "text-accent" : "text-foreground"
        }`}>
          {isFocusedRow && <span className="inline-block w-1.5 h-5 bg-accent rounded-full animate-pulse" />}
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
          <div key={item.id} data-card>
            <Top10Card
              item={item}
              index={index}
              onSelect={onSelect}
              isTVFocused={isFocusedRow && index === focusedCol}
            />
          </div>
        ))}
        <div className="flex-shrink-0 w-8 sm:w-16" />
      </div>
    </section>
  );
};

export default Top10Shelf;
