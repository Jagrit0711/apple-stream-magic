import { useQuery } from "@tanstack/react-query";
import { fetchTopRatedTV, fetchAiringTodayTV, fetchPopularTV, fetchOnTheAirTV } from "@/lib/tmdb";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import MobileNavBar from "@/components/MobileNavBar";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchOverlay from "@/components/SearchOverlay";
import AuthModal from "@/components/AuthModal";
import { useContentActions } from "@/hooks/useContentActions";
import { TV_GENRES, fetchTVByGenre } from "@/lib/tmdb";
import { useState } from "react";
import { Filter } from "lucide-react";

const TVShows = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  const { data: tvData } = useQuery({ queryKey: ["top-tv"], queryFn: () => fetchTopRatedTV() });
  const { data: airingToday = [] } = useQuery({ queryKey: ["airing-today"], queryFn: fetchAiringTodayTV });
  const { data: popularTV = [] } = useQuery({ queryKey: ["popular-tv"], queryFn: fetchPopularTV });
  const { data: onTheAir = [] } = useQuery({ queryKey: ["on-the-air"], queryFn: fetchOnTheAirTV });
  
  const { data: genreTV = [] } = useQuery({ 
    queryKey: ["genre-tv", selectedGenre],
    queryFn: () => fetchTVByGenre(selectedGenre!),
    enabled: !!selectedGenre
  });

  const tvShows = tvData?.results || [];

  const {
    selectedItem, setSelectedItem, player, setPlayer, searchOpen, setSearchOpen,
    authOpen, setAuthOpen, handleSelect, handlePlay, handlePlayDirect,
  } = useContentActions([...airingToday, ...popularTV, ...tvShows, ...onTheAir, ...genreTV]);

  const shelves = selectedGenre 
    ? [{ title: `${TV_GENRES.find(g => g.id === selectedGenre)?.name} TV Shows`, items: genreTV }]
    : [
        { title: "Airing Today", items: airingToday },
        { title: "Popular TV", items: popularTV },
        { title: "Top Rated TV", items: tvShows },
        { title: "On The Air", items: onTheAir },
      ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="TV Shows" onAuthClick={() => setAuthOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      
      {!selectedGenre && popularTV.length > 0 && <FeaturedHero items={popularTV} onSelect={handleSelect} onPlay={handlePlay} />}
      
      <div className={`${(popularTV.length > 0 && !selectedGenre) ? "pt-6 sm:pt-8" : "pt-24 sm:pt-28"} pb-24 md:pb-16`}>
        {/* Genre Selector */}
        <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Filter size={16} className="text-meta mr-2" />
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedGenre === null
                  ? "bg-accent border-accent text-white"
                  : "bg-white/5 border-white/10 text-meta hover:border-white/30"
              }`}
            >
              All
            </button>
            {TV_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedGenre === genre.id
                    ? "bg-accent border-accent text-white"
                    : "bg-white/5 border-white/10 text-meta hover:border-white/30"
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
      <MobileNavBar activeNav="TV Shows" onNavChange={() => {}} onSearchClick={() => setSearchOpen(true)} onAuthClick={() => setAuthOpen(true)} />
      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />
      {player && <VideoPlayer contentId={player.id} type={player.type} season={player.season} episode={player.episode} onClose={() => setPlayer(null)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default TVShows;
