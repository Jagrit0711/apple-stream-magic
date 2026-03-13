import { useMemo } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TMDBMovie,
  fetchTrending,
  fetchPopularMovies,
  fetchTopRatedTV,
  fetchPopularAnime,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  fetchTopRatedMovies,
  fetchAiringTodayTV,
  fetchPopularTV,
  fetchTrendingDay,
  fetchMoviesByGenre,
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useSmartRecommendations } from "@/hooks/useSmartRecommendations";
import { useContentActions } from "@/hooks/useContentActions";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchOverlay from "@/components/SearchOverlay";
import ContinueWatchingShelf from "@/components/ContinueWatchingShelf";
import AuthModal from "@/components/AuthModal";
import Onboarding from "@/components/Onboarding";
import Landing from "@/components/Landing";
import MobileNavBar from "@/components/MobileNavBar";
import TabletLayout from "@/components/TabletLayout";

const Index = () => {
  const { user, profile } = useAuth();
  const { continueWatching, recentlyWatched, history } = useWatchHistory();
  const { recommendations } = useSmartRecommendations(history);

  // User-Agent based device detection instead of purely CSS media queries
  const isTablet = useMemo(() => {
    const ua = navigator.userAgent;
    return /(tablet|ipad|playbook|macintosh.*touch)/i.test(ua) && !/mobile/i.test(ua);
  }, []);

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

  const movies = moviesData?.results || [];
  const tvShows = tvData?.results || [];
  const anime = animeData?.results || [];

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

  const allItems = [...trending, ...trendingDay, ...movies, ...tvShows, ...anime, ...nowPlaying, ...topRatedMovies, ...popularTV];

  const {
    selectedItem, setSelectedItem, player, setPlayer, searchOpen, setSearchOpen,
    authOpen, setAuthOpen, handleSelect, handlePlay, handlePlayDirect,
  } = useContentActions(allItems);

  const genreNameById = (id: number) => {
    const genres: Record<number, string> = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 14: "Fantasy", 27: "Horror", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller" };
    return genres[id] || "Picks";
  };

  const shelves = useMemo(() => {
    const s: { title: string; items: TMDBMovie[] }[] = [
      { title: "Trending Today", items: trendingDay.slice(0, 20) },
      { title: "Trending This Week", items: trending.slice(1, 20) },
    ];
    if (recommendations.length > 0) s.push({ title: "🤖 AI Picks For You", items: recommendations });
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
  }, [trending, trendingDay, movies, tvShows, anime, nowPlaying, upcoming, topRatedMovies, airingToday, popularTV, genreMovies1, genreMovies2, favoriteGenres, recommendations]);

  const overlays = (
    <>
      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />
      {player && <VideoPlayer contentId={player.id} type={player.type} season={player.season} episode={player.episode} onClose={() => setPlayer(null)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );

  if (!user && trendingDay.length > 0) {
    return (
      <>
        <Landing trending={trendingDay} onAuthClick={() => setAuthOpen(true)} />
        {overlays}
      </>
    );
  }

  return (
    <>
      {user && profile && !profile.onboarding_complete && <Onboarding />}

      {isTablet ? (
        <TabletLayout
          activeNav="Home"
          onNavChange={() => {}}
          trending={trending}
          shelves={shelves}
          continueWatching={continueWatching}
          onSelect={handleSelect}
          onPlay={handlePlay}
          onSearchClick={() => setSearchOpen(true)}
          onAuthClick={() => setAuthOpen(true)}
          user={user}
          profile={profile}
        />
      ) : (
        <div className="mobile-layout-wrapper min-h-screen bg-background overflow-x-hidden">
          <Header onSearch={() => {}} onNavChange={() => {}} activeNav="Home" onAuthClick={() => setAuthOpen(true)} onSearchClick={() => setSearchOpen(true)} />
          {trending.length > 0 && <FeaturedHero items={trending} onSelect={handleSelect} onPlay={handlePlay} />}
        <div className={`${trending.length > 0 ? "pt-6 sm:pt-8" : "pt-24 sm:pt-28"} pb-24 md:pb-16`}>
          {user && continueWatching.length > 0 && (
            <ContinueWatchingShelf items={continueWatching} onPlay={handlePlayDirect} />
          )}
          {user && recentlyWatched.length > 0 && (
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
        <MobileNavBar activeNav="Home" onNavChange={() => {}} onSearchClick={() => setSearchOpen(true)} onAuthClick={() => setAuthOpen(true)} />
      </div>
      )}

      {overlays}
    </>
  );
};

export default Index;
