import { TMDBMovie, img, getTitle, getYear } from "@/lib/tmdb";

interface ContentCardProps {
  item: TMDBMovie;
  onClick: (item: TMDBMovie) => void;
}

const ContentCard = ({ item, onClick }: ContentCardProps) => {
  const poster = img(item.poster_path, "w500");

  return (
    <button
      onClick={() => onClick(item)}
      className="content-card flex-shrink-0 w-[130px] sm:w-[160px] md:w-[200px] group focus:outline-none relative active:scale-[0.97] touch-manipulation"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2 sm:mb-3">
        {poster ? (
          <img
            src={poster}
            alt={getTitle(item)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-meta text-sm">
            No Image
          </div>
        )}
        {/* Always-visible bottom info on mobile, hover on desktop */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/70 to-transparent pt-8 pb-2 px-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500">
          <p className="text-[11px] text-foreground/90 font-medium truncate">{getTitle(item)}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-meta">{getYear(item)}</span>
            <span className="text-[10px] text-accent">★ {item.vote_average?.toFixed(1)}</span>
          </div>
        </div>
        {/* Glow effect */}
        <div className="card-glow absolute -inset-1 rounded-xl bg-accent/10 blur-xl -z-10" />
      </div>
      <p className="text-[12px] sm:text-[13px] text-foreground/70 group-hover:text-foreground transition-colors truncate text-left font-medium">
        {getTitle(item)}
      </p>
    </button>
  );
};

export default ContentCard;
