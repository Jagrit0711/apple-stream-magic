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
import { useSmartRecommendations } from "@/hooks/useSmartRecommendations";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchOverlay from "@/components/SearchOverlay";
import ContinueWatchingShelf from "@/components/ContinueWatchingShelf";
import AuthModal from "@/components/AuthModal";
import Onboarding from "@/components/Onboarding";

const Index = () => {
  const { user, profile } = useAuth();
  const { continueWatching, recentlyWatched, history, trackWatch } = useWatchHistory();
  const { recommendations } = useSmartRecommendations(history);
  const [activeNav, setActiveNav] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
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
    const s: { title: string; items: TMDBMovie[] }[] = [
      { title: "Trending Today", items: trendingDay.slice(0, 20) },
      { title: "Trending This Week", items: trending.slice(1, 20) },
    ];
    if (recommendations.length > 0) {
      s.push({ title: "🤖 AI Picks For You", items: recommendations });
    }
    s.push(
      { title: "Now Playing in Theaters", items: nowPlaying },
      { title: "Popular Movies", items: movies },
    );
    if (genreMovies1.length > 0 && favoriteGenres[0]) {
      s.push({ title: `Because you like ${genreNameById(favoriteGenres[0])}`, items: genreMovies1 });
    }
    s.push(
      { title: "Top Rated Movies", items: topRatedMovies },
      { title: "Upcoming Movies", items: upcoming },
    );
    if (genreMovies2.length > 0 && favoriteGenres[1]) {
      s.push({ title: `${genreNameById(favoriteGenres[1])} Picks For You`, items: genreMovies2 });
    }
    s.push(
      { title: "Popular TV", items: popularTV },
      { title: "Top Rated TV", items: tvShows },
      { title: "Airing Today", items: airingToday },
      { title: "Anime", items: anime },
    );
    return s;
  }, [activeNav, trending, trendingDay, movies, tvShows, anime, nowPlaying, upcoming, topRatedMovies, airingToday, popularTV, onTheAir, genreMovies1, genreMovies2, favoriteGenres, recommendations]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {user && <Onboarding />}

      <Header
        onSearch={() => {}}
        onNavChange={setActiveNav}
        activeNav={activeNav}
        onAuthClick={() => setAuthOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
      />

      {activeNav === "Home" && trending.length > 0 && (
        <FeaturedHero items={trending} onSelect={handleSelect} onPlay={handlePlay} />
      )}

      <div className={`${activeNav !== "Home" || trending.length === 0 ? "pt-24 sm:pt-28" : "pt-6 sm:pt-8"} pb-16`}>
        {user && continueWatching.length > 0 && activeNav === "Home" && (
          <ContinueWatchingShelf items={continueWatching} onPlay={handlePlayDirect} />
        )}

        {user && recentlyWatched.length > 0 && activeNav === "Home" && (
          <section className="mb-8 sm:mb-10">
            <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-3 sm:mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">Recently Watched</h3>
            </div>
            <div className="shelf-scroll flex gap-2.5 sm:gap-3 overflow-x-auto px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto">
              {recentlyWatched.map(item => (
                <button
                  key={item.id}
                  onClick={() => handlePlayDirect(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined)}
                  className="flex-shrink-0 w-[120px] sm:w-[160px] group focus:outline-none active:scale-[0.97] touch-manipulation"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-meta text-sm">No Image</div>
                    )}
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-foreground/70 truncate text-left font-medium">{item.title}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {shelves.map(({ title, items }) => (
          <ContentShelf key={title} title={title} items={items} onSelect={handleSelect} />
        ))}
      </div>

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

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Index;
