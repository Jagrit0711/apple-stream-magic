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
    <section className="mb-12">
      <div className="flex items-center justify-between px-8 max-w-[1600px] mx-auto mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">Continue Watching</h3>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="text-meta hover:text-foreground transition-colors p-1">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll("right")} className="text-meta hover:text-foreground transition-colors p-1">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="shelf-scroll flex gap-4 overflow-x-auto px-8 max-w-[1600px] mx-auto">
        {items.map(item => {
          const backdrop = img(item.backdrop_path || item.poster_path, "w780");
          return (
            <button
              key={item.id}
              onClick={() => onPlay(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined)}
              className="flex-shrink-0 w-[300px] group focus:outline-none"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-surface mb-2">
                {backdrop ? (
                  <img src={backdrop} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-meta">
                    <Play size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-foreground/90 rounded-full p-3">
                    <Play size={20} fill="hsl(var(--primary-foreground))" className="text-primary-foreground" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
              <p className="font-body text-sm text-foreground/80 truncate text-left">{item.title}</p>
              {item.season && item.episode && (
                <p className="font-body text-xs text-meta text-left">S{item.season} E{item.episode}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatchingShelf;
