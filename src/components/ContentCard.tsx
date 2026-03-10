import { TMDBMovie, img, getTitle } from "@/lib/tmdb";

interface ContentCardProps {
  item: TMDBMovie;
  onClick: (item: TMDBMovie) => void;
}

const ContentCard = ({ item, onClick }: ContentCardProps) => {
  const poster = img(item.poster_path, "w500");

  return (
    <button
      onClick={() => onClick(item)}
      className="content-card flex-shrink-0 w-[180px] md:w-[220px] group focus:outline-none"
    >
      <div className="aspect-[2/3] rounded-md overflow-hidden bg-surface mb-3">
        {poster ? (
          <img
            src={poster}
            alt={getTitle(item)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-meta font-body text-sm">
            No Image
          </div>
        )}
      </div>
      <p className="font-body text-sm text-foreground/80 group-hover:text-foreground transition-colors truncate text-left">
        {getTitle(item)}
      </p>
    </button>
  );
};

export default ContentCard;
