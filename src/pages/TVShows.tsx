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

const TVShows = () => {
  const { data: tvData } = useQuery({ queryKey: ["top-tv"], queryFn: () => fetchTopRatedTV() });
  const { data: airingToday = [] } = useQuery({ queryKey: ["airing-today"], queryFn: fetchAiringTodayTV });
  const { data: popularTV = [] } = useQuery({ queryKey: ["popular-tv"], queryFn: fetchPopularTV });
  const { data: onTheAir = [] } = useQuery({ queryKey: ["on-the-air"], queryFn: fetchOnTheAirTV });
  const tvShows = tvData?.results || [];

  const {
    selectedItem, setSelectedItem, player, setPlayer, searchOpen, setSearchOpen,
    authOpen, setAuthOpen, handleSelect, handlePlay, handlePlayDirect,
  } = useContentActions([...airingToday, ...popularTV, ...tvShows, ...onTheAir]);

  const shelves = [
    { title: "Airing Today", items: airingToday },
    { title: "Popular TV", items: popularTV },
    { title: "Top Rated TV", items: tvShows },
    { title: "On The Air", items: onTheAir },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="TV Shows" onAuthClick={() => setAuthOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      {popularTV.length > 0 && <FeaturedHero items={popularTV} onSelect={handleSelect} onPlay={handlePlay} />}
      <div className={`${popularTV.length > 0 ? "pt-6 sm:pt-8" : "pt-24 sm:pt-28"} pb-24 md:pb-16`}>
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
