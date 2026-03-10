import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TMDBMovie,
  getContentType,
  fetchTrending,
  fetchPopularMovies,
  fetchTopRatedTV,
  fetchPopularAnime,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  fetchTopRatedMovies,
  fetchAiringTodayTV,
  fetchPopularTV,
  fetchOnTheAirTV,
  fetchTrendingDay,
  fetchMoviesByGenre,
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchResults from "@/components/SearchResults";
import ContinueWatchingShelf from "@/components/ContinueWatchingShelf";
import AuthModal from "@/components/AuthModal";
import Onboarding from "@/components/Onboarding";

const Index = () => {
  const { user, profile } = useAuth();
  const { continueWatching, recentlyWatched, trackWatch } = useWatchHistory();
  const [activeNav, setActiveNav] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<TMDBMovie | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [player, setPlayer] = useState<{
    id: number;
    type: "movie" | "tv";
    season?: number;
    episode?: number;
  } | null>(null);

  const { data: trending = [] } = useQuery({ queryKey: ["trending"], queryFn: fetchTrending });
  const { data: trendingDay = [] } = useQuery({ queryKey: ["trending-day"], queryFn: fetchTrendingDay });
  const { data: moviesData } = useQuery({ queryKey: ["popular-movies"], queryFn: () => fetchPopularMovies() });
  const { data: tvData } = useQuery({ queryKey: ["top-tv"], queryFn: () => fetchTopRatedTV() });
  const { data: animeData } = useQuery({ queryKey: ["popular-anime"], queryFn: () => fetchPopularAnime() });
  const { data: nowPlaying = [] } = useQuery({ queryKey: ["now-playing"], queryFn: fetchNowPlayingMovies });
  const { data: upcoming = [] } = useQuery({ queryKey: ["upcoming"], queryFn: fetchUpcomingMovies });
  const { data: topRatedMovies = [] } = useQuery({ queryKey: ["top-rated-movies"], queryFn: fetchTopRatedMovies });
  const { data: airingToday = [] } = useQuery({ queryKey: ["airing-today"], queryFn: fetchAiringTodayTV });
  const { data: popularTV = [] } = useQuery({ queryKey: ["popular-tv"], queryFn: fetchPopularTV });
  const { data: onTheAir = [] } = useQuery({ queryKey: ["on-the-air"], queryFn: fetchOnTheAirTV });

  // Genre-based shelves for personalized recommendations
  const favoriteGenres = profile?.favorite_genres || [];
  const { data: genreMovies1 = [] } = useQuery({
    queryKey: ["genre-movies", favoriteGenres[0]],
    queryFn: () => fetchMoviesByGenre(favoriteGenres[0]),
    enabled: favoriteGenres.length > 0,
  });
  const { data: genreMovies2 = [] } = useQuery({
    queryKey: ["genre-movies", favoriteGenres[1]],
    queryFn: () => fetchMoviesByGenre(favoriteGenres[1]),
    enabled: favoriteGenres.length > 1,
  });

  const movies = moviesData?.results || [];
  const tvShows = tvData?.results || [];
  const anime = animeData?.results || [];

  const featured = trending[0] || null;

  const handleSelect = (item: TMDBMovie) => setSelectedItem(item);
  const handlePlay = (item: TMDBMovie) => {
    const type = getContentType(item);
    trackWatch(item, 0, null, type === "tv" ? 1 : undefined, type === "tv" ? 1 : undefined);
    setPlayer({ id: item.id, type, season: type === "tv" ? 1 : undefined, episode: type === "tv" ? 1 : undefined });
  };
  const handlePlayDirect = (id: number, type: "movie" | "tv", season?: number, episode?: number) => {
    setSelectedItem(null);
    setPlayer({ id, type, season, episode });
  };

  const isSearching = searchQuery.length > 2;

  const genreNameById = (id: number) => {
    const genres: Record<number, string> = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 14: "Fantasy", 27: "Horror", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller" };
    return genres[id] || "Picks";
  };

  const shelves = useMemo(() => {
    if (activeNav === "Movies") return [
      { title: "Now Playing", items: nowPlaying },
      { title: "Popular Movies", items: movies },
      { title: "Top Rated", items: topRatedMovies },
      { title: "Upcoming", items: upcoming },
    ];
    if (activeNav === "TV Shows") return [
      { title: "Airing Today", items: airingToday },
      { title: "Popular TV", items: popularTV },
      { title: "Top Rated TV", items: tvShows },
      { title: "On The Air", items: onTheAir },
    ];
    if (activeNav === "Anime") return [
      { title: "Popular Anime", items: anime },
    ];
    // Home
    const s = [
      { title: "Trending Today", items: trendingDay.slice(0, 20) },
      { title: "Trending This Week", items: trending.slice(1, 20) },
      { title: "Now Playing in Theaters", items: nowPlaying },
      { title: "Popular Movies", items: movies },
      { title: "Top Rated Movies", items: topRatedMovies },
      { title: "Upcoming Movies", items: upcoming },
      { title: "Popular TV", items: popularTV },
      { title: "Top Rated TV", items: tvShows },
      { title: "Airing Today", items: airingToday },
      { title: "Anime", items: anime },
    ];
    // Add personalized genre shelves
    if (genreMovies1.length > 0 && favoriteGenres[0]) {
      s.splice(2, 0, { title: `Because you like ${genreNameById(favoriteGenres[0])}`, items: genreMovies1 });
    }
    if (genreMovies2.length > 0 && favoriteGenres[1]) {
      s.splice(4, 0, { title: `${genreNameById(favoriteGenres[1])} Picks For You`, items: genreMovies2 });
    }
    return s;
  }, [activeNav, trending, trendingDay, movies, tvShows, anime, nowPlaying, upcoming, topRatedMovies, airingToday, popularTV, onTheAir, genreMovies1, genreMovies2, favoriteGenres]);

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding for new users */}
      {user && <Onboarding />}

      <Header onSearch={setSearchQuery} onNavChange={setActiveNav} activeNav={activeNav} onAuthClick={() => setAuthOpen(true)} />

      {isSearching ? (
        <SearchResults query={searchQuery} onSelect={handleSelect} />
      ) : (
        <>
          {featured && activeNav === "Home" && (
            <FeaturedHero item={featured} onSelect={handleSelect} onPlay={handlePlay} />
          )}

          <div className={`${activeNav !== "Home" || !featured ? "pt-28" : "pt-8"} pb-16`}>
            {/* Continue Watching */}
            {user && continueWatching.length > 0 && activeNav === "Home" && (
              <ContinueWatchingShelf items={continueWatching} onPlay={handlePlayDirect} />
            )}

            {/* Recently Watched */}
            {user && recentlyWatched.length > 0 && activeNav === "Home" && (
              <section className="mb-12">
                <div className="px-8 max-w-[1600px] mx-auto mb-4">
                  <h3 className="font-display font-semibold text-lg text-foreground">Recently Watched</h3>
                </div>
                <div className="shelf-scroll flex gap-4 overflow-x-auto px-8 max-w-[1600px] mx-auto">
                  {recentlyWatched.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handlePlayDirect(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined)}
                      className="flex-shrink-0 w-[180px] group focus:outline-none"
                    >
                      <div className="aspect-[2/3] rounded-md overflow-hidden bg-surface mb-2">
                        {item.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-meta font-body text-sm">No Image</div>
                        )}
                      </div>
                      <p className="font-body text-sm text-foreground/80 truncate text-left">{item.title}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {shelves.map(({ title, items }) => (
              <ContentShelf key={title} title={title} items={items} onSelect={handleSelect} />
            ))}
          </div>
        </>
      )}

      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />

      {player && (
        <VideoPlayer
          contentId={player.id}
          type={player.type}
          season={player.season}
          episode={player.episode}
          onClose={() => setPlayer(null)}
        />
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Index;
