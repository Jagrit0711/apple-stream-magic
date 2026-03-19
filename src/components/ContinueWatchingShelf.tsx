import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { img } from "@/lib/tmdb";
import { WatchHistoryItem } from "@/hooks/useWatchHistory";
import { useTVNav } from "@/hooks/useTVNav";

interface ContinueWatchingShelfProps {
  items: WatchHistoryItem[];
  onPlay: (id: number, type: "movie" | "tv", season?: number, episode?: number) => void;
}

const CW_ROW = -1; // Between hero (-2) and content shelves (0+)

const ContinueWatchingShelf = ({ items, onPlay }: ContinueWatchingShelfProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isTV, zone, focusedRow, focusedCol, registerRow, unregisterRow, registerRowAction, unregisterRowAction } = useTVNav();

  const isFocusedRow = isTV && zone === "content" && focusedRow === CW_ROW;

  // Register row
  useEffect(() => {
    if (!isTV || !items.length) return;
    registerRow(CW_ROW, items.length);
    return () => unregisterRow(CW_ROW);
  }, [isTV, items.length, registerRow, unregisterRow]);

  // Register Enter action — play the focused item
  useEffect(() => {
    if (!isTV || !items.length) return;
    const captured = items;
    registerRowAction(CW_ROW, (col) => {
      const item = captured[col];
      if (item) onPlay(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined);
    });
    return () => unregisterRowAction(CW_ROW);
  }, [isTV, items, onPlay, registerRowAction, unregisterRowAction]);

  // Auto-scroll focused card into view
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
    <section className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-3 sm:mb-4">
        <h3 className={`font-semibold text-sm sm:text-base tracking-tight transition-colors duration-200 ${
          isFocusedRow ? "text-accent" : "text-foreground"
        }`}>
          {isFocusedRow && (
            <span className="inline-block w-1.5 h-4 bg-accent rounded-full mr-2 mb-[-1px] animate-pulse" />
          )}
          Continue Watching
        </h3>
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
        {items.map((item, i) => {
          const backdrop = img(item.backdrop_path || item.poster_path, "w780");
          const isFocusedCard = isFocusedRow && i === focusedCol;
          return (
            <button
              key={item.id}
              data-card
              onClick={() => onPlay(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined)}
              className={`
                flex-shrink-0 w-[220px] sm:w-[280px] group focus:outline-none snap-start
                active:scale-[0.98] touch-manipulation transition-all duration-200
                ${isFocusedCard ? "scale-105" : ""}
              `}
            >
              <div className={`relative aspect-video rounded-xl overflow-hidden bg-surface mb-2 transition-all duration-200 ${
                isFocusedCard
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-[0_0_25px_hsla(346,90%,56%,0.5)]"
                  : ""
              }`}>
                {backdrop ? (
                  <img src={backdrop} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-meta"><Play size={20} /></div>
                )}
                {/* Play overlay — always visible when TV focused, hover on mouse */}
                <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${
                  isFocusedCard ? "opacity-100 bg-background/40" : "opacity-0 bg-background/30 group-hover:opacity-100"
                }`}>
                  <div className={`rounded-full p-3 ${isFocusedCard ? "bg-accent accent-glow" : "glass"}`}>
                    <Play size={18} fill="currentColor" className="text-foreground" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[hsla(0,0%,100%,0.1)]">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
              <p className={`text-[12px] sm:text-[13px] text-left font-medium truncate transition-colors ${
                isFocusedCard ? "text-accent" : "text-foreground/70"
              }`}>{item.title}</p>
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
