import { useQuery } from "@tanstack/react-query";
import { fetchTopRatedTV, fetchAiringTodayTV, fetchPopularTV, fetchOnTheAirTV, TV_GENRES, fetchTVByGenre } from "@/lib/tmdb";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import MobileCategories from "@/components/MobileCategories";
import ContinueWatchingShelf from "@/components/ContinueWatchingShelf";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useState } from "react";
import { Filter } from "lucide-react";
import { useLayout } from "@/components/MainLayout";

const TVShows = () => {
  const { setSelectedItem, setPlayer } = useLayout();
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  const { data: tvData } = useQuery({ queryKey: ["top-tv"], queryFn: () => fetchTopRatedTV() });
  const { data: airingToday = [] } = useQuery({ queryKey: ["airing-today"], queryFn: fetchAiringTodayTV });
  const { data: popularTV = [] } = useQuery({ queryKey: ["popular-tv"], queryFn: fetchPopularTV });
  const { data: onTheAir = [] } = useQuery({ queryKey: ["on-the-air"], queryFn: fetchOnTheAirTV });
  const { continueWatching } = useWatchHistory();
  const tvContinue = continueWatching.filter(i => i.media_type === "tv");
  
  const { data: genreTV = [] } = useQuery({ 
    queryKey: ["genre-tv", selectedGenre],
    queryFn: () => fetchTVByGenre(selectedGenre!),
    enabled: !!selectedGenre
  });

  const tvShows = tvData?.results || [];

  const handleSelect = (item: any) => setSelectedItem(item);
  const handlePlayDirect = (id: number, type: "movie" | "tv", s?: number, e?: number) => setPlayer({ id, type, season: s, episode: e });

  const shelves = selectedGenre 
    ? [{ title: `${TV_GENRES.find(g => g.id === selectedGenre)?.name} TV Shows`, items: genreTV }]
    : [
        { title: "Airing Today", items: airingToday },
        { title: "Popular TV", items: popularTV },
        { title: "Top Rated TV", items: tvShows },
        { title: "On The Air", items: onTheAir },
      ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="md:hidden relative">
        <MobileCategories />
      </div>

      {!selectedGenre && popularTV.length > 0 && (
        <FeaturedHero items={popularTV} onSelect={handleSelect} onPlay={(item) => handlePlayDirect(item.id, "tv")} />
      )}
      
      <div className={`${(popularTV.length > 0 && !selectedGenre) ? "relative z-10 -mt-20 md:-mt-32" : "pt-24 sm:pt-28"} pb-24 md:pb-12`}>
        {/* Continue Watching for TV */}
        {!selectedGenre && tvContinue.length > 0 && (
          <ContinueWatchingShelf items={tvContinue} onPlay={handlePlayDirect} />
        )}

        {/* Improved Genre Selector - Single Horizontal Line */}
        <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-10 mt-4 relative">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 whitespace-nowrap pl-1 pr-4">
            <div className="flex items-center gap-2 mb-0 w-auto flex-shrink-0 mr-1 sticky left-0 bg-background/90 py-2 pr-2 z-10 backdrop-blur-md">
              <Filter size={14} className="text-meta" />
              <span className="text-[10px] uppercase tracking-widest font-black text-meta/60 hidden sm:inline-block">Filter</span>
            </div>
            <button
              onClick={() => setSelectedGenre(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-lg ${
                selectedGenre === null
                  ? "bg-accent border-accent text-white shadow-accent/20"
                  : "bg-white/[0.03] border-white/5 text-meta/80 hover:bg-white/10"
              }`}
            >
              All
            </button>
            {TV_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-lg ${
                  selectedGenre === genre.id
                    ? "bg-accent border-accent text-white shadow-accent/20"
                    : "bg-white/[0.03] border-white/5 text-meta/80 hover:bg-white/10"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {shelves.map(({ title, items }) => (
          <ContentShelf key={title} title={title} items={items} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
};

export default TVShows;
