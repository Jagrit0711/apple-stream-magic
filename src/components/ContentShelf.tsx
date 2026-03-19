import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TMDBMovie } from "@/lib/tmdb";
import { motion } from "framer-motion";
import ContentCard from "./ContentCard";
import { useTVNav } from "@/hooks/useTVNav";
import { useLayout } from "./MainLayout";

interface ContentShelfProps {
  title: string;
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
  rowIndex?: number;
}

const ContentShelf = ({ title, items, onSelect, rowIndex = -1 }: ContentShelfProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { focusedRow, focusedCol, isTV, zone, registerRow, unregisterRow } = useTVNav();
  const { registerTVContent } = useLayout();

  const isFocusedRow = isTV && zone === "content" && rowIndex !== -1 && focusedRow === rowIndex;

  // Register row for TV spatial nav (item count for boundary checks)
  useEffect(() => {
    if (rowIndex === -1 || !isTV) return;
    registerRow(rowIndex, items.length);
    return () => unregisterRow(rowIndex);
  }, [rowIndex, items.length, isTV, registerRow, unregisterRow]);

  // Register items so Enter key can open the right card
  useEffect(() => {
    if (rowIndex === -1 || !isTV) return;
    registerTVContent(rowIndex, items);
  }, [rowIndex, items, isTV, registerTVContent]);

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
    <section className="mb-1 sm:mb-8">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-1">
        <h3 className={`font-bold text-lg sm:text-2xl tracking-tight leading-tight transition-colors duration-200 ${
          isFocusedRow ? "text-accent" : "text-foreground"
        }`}>
          {isFocusedRow && (
            <span className="inline-block w-1.5 h-5 bg-accent rounded-full mr-2.5 mb-[-2px] animate-pulse" />
          )}
          {title}
        </h3>

        <div className="hidden sm:flex items-center gap-2">
          {isFocusedRow && (
            <span className="text-meta text-[11px] font-medium mr-2 flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">←→</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-accent/80 text-[10px] font-mono text-white">OK</kbd>
            </span>
          )}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("left")}
            className="p-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all outline-none">
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("right")}
            className="p-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all outline-none">
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="shelf-scroll flex gap-2.5 sm:gap-3 overflow-x-auto overflow-y-visible px-6 sm:px-8 md:px-12 max-w-[1700px] mx-auto snap-x snap-mandatory pt-4 pb-6 sm:pt-10 sm:pb-16 -mt-6 sm:-mt-10"
      >
        {items.map((item, i) => (
          <div key={item.id} className="snap-start" data-card>
            <ContentCard
              item={item}
              onClick={onSelect}
              isTVFocused={isFocusedRow && i === focusedCol}
            />
          </div>
        ))}
        <div className="flex-shrink-0 w-4 sm:w-8" />
      </div>
    </section>
  );
};

export default ContentShelf;
