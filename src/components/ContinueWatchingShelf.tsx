import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { img } from "@/lib/tmdb";
import { WatchHistoryItem } from "@/hooks/useWatchHistory";

interface ContinueWatchingShelfProps {
  items: WatchHistoryItem[];
  onPlay: (id: number, type: "movie" | "tv", season?: number, episode?: number) => void;
}

const ContinueWatchingShelf = ({ items, onPlay }: ContinueWatchingShelfProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">Continue Watching</h3>
        <div className="hidden sm:flex gap-1">
          <button onClick={() => scroll("left")} className="p-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll("right")} className="p-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="shelf-scroll flex gap-3 overflow-x-auto px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto snap-x snap-mandatory">
        {items.map(item => {
          const backdrop = img(item.backdrop_path || item.poster_path, "w780");
          return (
            <button
              key={item.id}
              onClick={() => onPlay(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined)}
              className="flex-shrink-0 w-[220px] sm:w-[280px] group focus:outline-none snap-start active:scale-[0.98] touch-manipulation"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-surface mb-2">
                {backdrop ? (
                  <img src={backdrop} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-meta"><Play size={20} /></div>
                )}
                <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="glass rounded-full p-3">
                    <Play size={18} fill="currentColor" className="text-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[hsla(0,0%,100%,0.1)]">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
              <p className="text-[12px] sm:text-[13px] text-foreground/70 truncate text-left font-medium">{item.title}</p>
              {item.season && item.episode && (
                <p className="text-[10px] sm:text-[11px] text-meta text-left">S{item.season} E{item.episode}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatchingShelf;
