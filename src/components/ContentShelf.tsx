import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TMDBMovie } from "@/lib/tmdb";
import ContentCard from "./ContentCard";

interface ContentShelfProps {
  title: string;
  items: TMDBMovie[];
  onSelect: (item: TMDBMovie) => void;
}

const ContentShelf = ({ title, items, onSelect }: ContentShelfProps) => {
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
        <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">{title}</h3>
        <div className="hidden sm:flex gap-1">
          <button onClick={() => scroll("left")} className="p-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll("right")} className="p-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="shelf-scroll flex gap-2.5 sm:gap-3 overflow-x-auto px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto snap-x snap-mandatory"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <ContentCard item={item} onClick={onSelect} />
          </div>
        ))}
        <div className="flex-shrink-0 w-4 sm:w-8" />
      </div>
    </section>
  );
};

export default ContentShelf;
