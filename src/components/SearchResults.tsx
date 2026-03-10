import { useQuery } from "@tanstack/react-query";
import { searchMulti, TMDBMovie } from "@/lib/tmdb";
import ContentCard from "./ContentCard";

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
    <div className="px-8 max-w-[1600px] mx-auto pt-28 pb-12">
      <h2 className="font-display font-semibold text-xl text-foreground mb-6">
        Results for "{query}"
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((item) => (
            <ContentCard key={item.id} item={item} onClick={onSelect} />
          ))}
        </div>
      ) : (
        <p className="font-body text-meta">No results found.</p>
      )}
    </div>
  );
};

export default SearchResults;
