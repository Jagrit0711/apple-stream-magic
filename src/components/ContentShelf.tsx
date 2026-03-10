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
    <section className="mb-12">
      <div className="flex items-center justify-between px-8 max-w-[1600px] mx-auto mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">{title}</h3>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="text-meta hover:text-foreground transition-colors p-1">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll("right")} className="text-meta hover:text-foreground transition-colors p-1">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="shelf-scroll flex gap-4 overflow-x-auto px-8 max-w-[1600px] mx-auto snap-x snap-mandatory"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <ContentCard item={item} onClick={onSelect} />
          </div>
        ))}
        {/* End spacer */}
        <div className="flex-shrink-0 w-8" />
      </div>
    </section>
  );
};

export default ContentShelf;
