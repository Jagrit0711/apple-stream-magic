import { useQuery } from "@tanstack/react-query";
import { fetchPopularMovies, fetchNowPlayingMovies, fetchUpcomingMovies, fetchTopRatedMovies } from "@/lib/tmdb";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import MobileNavBar from "@/components/MobileNavBar";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchOverlay from "@/components/SearchOverlay";
import AuthModal from "@/components/AuthModal";
import { useContentActions } from "@/hooks/useContentActions";

const Movies = () => {
  const { data: moviesData } = useQuery({ queryKey: ["popular-movies"], queryFn: () => fetchPopularMovies() });
  const { data: nowPlaying = [] } = useQuery({ queryKey: ["now-playing"], queryFn: fetchNowPlayingMovies });
  const { data: upcoming = [] } = useQuery({ queryKey: ["upcoming"], queryFn: fetchUpcomingMovies });
  const { data: topRatedMovies = [] } = useQuery({ queryKey: ["top-rated-movies"], queryFn: fetchTopRatedMovies });
  const movies = moviesData?.results || [];

  const {
    selectedItem, setSelectedItem, player, setPlayer, searchOpen, setSearchOpen,
    authOpen, setAuthOpen, handleSelect, handlePlay, handlePlayDirect,
  } = useContentActions([...nowPlaying, ...movies, ...topRatedMovies, ...upcoming]);

  const shelves = [
    { title: "Now Playing", items: nowPlaying },
    { title: "Popular Movies", items: movies },
    { title: "Top Rated", items: topRatedMovies },
    { title: "Upcoming", items: upcoming },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="Movies" onAuthClick={() => setAuthOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      {nowPlaying.length > 0 && <FeaturedHero items={nowPlaying} onSelect={handleSelect} onPlay={handlePlay} />}
      <div className={`${nowPlaying.length > 0 ? "pt-6 sm:pt-8" : "pt-24 sm:pt-28"} pb-24 md:pb-16`}>
        {shelves.map(({ title, items }) => (
          <ContentShelf key={title} title={title} items={items} onSelect={handleSelect} />
        ))}
      </div>
      <MobileNavBar activeNav="Movies" onNavChange={() => {}} onSearchClick={() => setSearchOpen(true)} onAuthClick={() => setAuthOpen(true)} />
      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />
      {player && <VideoPlayer contentId={player.id} type={player.type} season={player.season} episode={player.episode} onClose={() => setPlayer(null)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Movies;
