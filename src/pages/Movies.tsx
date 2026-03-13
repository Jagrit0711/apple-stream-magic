import { useQuery } from "@tanstack/react-query";
import { fetchPopularMovies, fetchNowPlayingMovies, fetchUpcomingMovies, fetchTopRatedMovies } from "@/lib/tmdb";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import MobileNavBar from "@/components/MobileNavBar";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import AuthModal from "@/components/AuthModal";
import SearchOverlay from "@/components/SearchOverlay";
import { useContentActions } from "@/hooks/useContentActions";
import { MOVIE_GENRES, fetchMoviesByGenre } from "@/lib/tmdb";
import { useState } from "react";
import { Filter } from "lucide-react";

const Movies = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  
  const { data: moviesData } = useQuery({ queryKey: ["popular-movies"], queryFn: () => fetchPopularMovies() });
  const { data: nowPlaying = [] } = useQuery({ queryKey: ["now-playing"], queryFn: fetchNowPlayingMovies });
  const { data: upcoming = [] } = useQuery({ queryKey: ["upcoming"], queryFn: fetchUpcomingMovies });
  const { data: topRatedMovies = [] } = useQuery({ queryKey: ["top-rated-movies"], queryFn: fetchTopRatedMovies });
  
  const { data: genreMovies = [] } = useQuery({ 
    queryKey: ["genre-movies", selectedGenre],
    queryFn: () => fetchMoviesByGenre(selectedGenre!),
    enabled: !!selectedGenre
  });

  const movies = moviesData?.results || [];

  const {
    selectedItem, setSelectedItem, player, setPlayer, searchOpen, setSearchOpen,
    authOpen, setAuthOpen, handleSelect, handlePlay, handlePlayDirect,
  } = useContentActions([...nowPlaying, ...movies, ...topRatedMovies, ...upcoming, ...genreMovies]);

  const shelves = selectedGenre 
    ? [{ title: `${MOVIE_GENRES.find(g => g.id === selectedGenre)?.name} Movies`, items: genreMovies }]
    : [
        { title: "Now Playing", items: nowPlaying },
        { title: "Popular Movies", items: movies },
        { title: "Top Rated", items: topRatedMovies },
        { title: "Upcoming", items: upcoming },
      ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="Movies" onAuthClick={() => setAuthOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      
      {!selectedGenre && nowPlaying.length > 0 && <FeaturedHero items={nowPlaying} onSelect={handleSelect} onPlay={handlePlay} />}
      
      <div className={`${(nowPlaying.length > 0 && !selectedGenre) ? "pt-6 sm:pt-8" : "pt-24 sm:pt-28"} pb-24 md:pb-16`}>
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
            {MOVIE_GENRES.map(genre => (
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
      <MobileNavBar activeNav="Movies" onNavChange={() => {}} onSearchClick={() => setSearchOpen(true)} onAuthClick={() => setAuthOpen(true)} />
      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />
      {player && <VideoPlayer contentId={player.id} type={player.type} season={player.season} episode={player.episode} onClose={() => setPlayer(null)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Movies;
