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
    <div className="px-6 md:px-8 max-w-[1600px] mx-auto pt-28 pb-12">
      <h2 className="font-semibold text-xl text-foreground mb-2 tracking-tight">
        Results for "{query}"
      </h2>
      <p className="text-meta text-sm mb-8">{results?.length || 0} titles found</p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-surface shimmer" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="group text-left focus:outline-none"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2">
                {img(item.poster_path) ? (
                  <img
                    src={img(item.poster_path)!}
                    alt={getTitle(item)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-meta text-sm">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="glass rounded-lg px-3 py-2">
                    <span className="text-[10px] text-accent font-medium">★ {item.vote_average?.toFixed(1)}</span>
                    <span className="text-[10px] text-meta ml-2">{getYear(item)}</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-foreground/70 group-hover:text-foreground transition-colors truncate font-medium">
                {getTitle(item)}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-meta text-lg">No results found</p>
          <p className="text-meta/60 text-sm mt-2">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
