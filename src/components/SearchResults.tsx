import { useQuery } from "@tanstack/react-query";
import { searchMulti, TMDBMovie, img, getTitle, getYear } from "@/lib/tmdb";

interface SearchResultsProps {
  query: string;
  onSelect: (item: TMDBMovie) => void;
}

const SearchResults = ({ query, onSelect }: SearchResultsProps) => {
  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMulti(query),
    enabled: query.length > 2,
  });

  if (!query || query.length < 3) return null;

  return (
    <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto pt-24 sm:pt-28 pb-12">
      <h2 className="font-semibold text-xl text-foreground mb-2 tracking-tight">
        Results for "{query}"
      </h2>
      <p className="text-meta text-sm mb-8">{results?.length || 0} titles found</p>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-surface shimmer" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="group text-left focus:outline-none active:scale-[0.97] transition-transform touch-manipulation"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2">
                {img(item.poster_path) ? (
                  <img
                    src={img(item.poster_path)!}
                    alt={getTitle(item)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-meta text-sm">No Image</div>
                )}
                {/* Always-visible text with gradient background */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-8 pb-2 px-2">
                  <p className="text-[11px] sm:text-[13px] text-foreground font-medium truncate">{getTitle(item)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-accent font-medium">★ {item.vote_average?.toFixed(1)}</span>
                    <span className="text-[10px] text-meta">{getYear(item)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-meta text-lg">No results found</p>
          <p className="text-muted-foreground text-sm mt-2">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
