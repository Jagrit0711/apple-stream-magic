import { useMemo } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
  fetchTrendingWeek,
  fetchTVByGenre,
  fetchMoviesByGenre,
  fetchTop10Global,
  fetchTop10Region,
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useSmartRecommendations } from "@/hooks/useSmartRecommendations";
import { useContentActions } from "@/hooks/useContentActions";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import Top10Shelf from "@/components/Top10Shelf";
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

  const { data: trending = [] as TMDBMovie[] } = useQuery({ queryKey: ["trending-week"], queryFn: fetchTrendingWeek });
  const { data: trendingDay = [] as TMDBMovie[] } = useQuery({ queryKey: ["trending-day"], queryFn: fetchTrendingDay });
  const { data: moviesData } = useQuery({ queryKey: ["popular-movies"], queryFn: () => fetchPopularMovies() });
  const { data: tvData } = useQuery({ queryKey: ["top-tv"], queryFn: () => fetchTopRatedTV() });
  const { data: animeData } = useQuery({ queryKey: ["popular-anime"], queryFn: () => fetchPopularAnime() });
  const { data: nowPlaying = [] as TMDBMovie[] } = useQuery({ queryKey: ["now-playing"], queryFn: fetchNowPlayingMovies });
  const { data: upcoming = [] as TMDBMovie[] } = useQuery({ queryKey: ["upcoming"], queryFn: fetchUpcomingMovies });
  const { data: topRatedMovies = [] as TMDBMovie[] } = useQuery({ queryKey: ["top-rated-movies"], queryFn: fetchTopRatedMovies });
  const { data: airingToday = [] as TMDBMovie[] } = useQuery({ queryKey: ["airing-today"], queryFn: fetchAiringTodayTV });
  const { data: popularTV = [] as TMDBMovie[] } = useQuery({ queryKey: ["popular-tv"], queryFn: fetchPopularTV });
  
  // Diverse genre items
  const { data: actionMovies = [] as TMDBMovie[] } = useQuery({ queryKey: ["genre-action"], queryFn: () => fetchMoviesByGenre(28) });
  const { data: sciFiMovies = [] as TMDBMovie[] } = useQuery({ queryKey: ["genre-scifi"], queryFn: () => fetchMoviesByGenre(878) });
  const { data: comedyTV = [] as TMDBMovie[] } = useQuery({ queryKey: ["genre-comedy-tv"], queryFn: () => fetchTVByGenre(35) });
  const { data: familyMovies = [] as TMDBMovie[] } = useQuery({ queryKey: ["genre-family"], queryFn: () => fetchMoviesByGenre(10751) });

  const { data: top10MoviesGlobal = [] } = useQuery({ queryKey: ["top10-movies-global"], queryFn: () => fetchTop10Global("movie") });
  const { data: top10TVGlobal = [] } = useQuery({ queryKey: ["top10-tv-global"], queryFn: () => fetchTop10Global("tv") });
  const { data: top10MoviesIN = [] } = useQuery({ queryKey: ["top10-movies-in"], queryFn: () => fetchTop10Region("movie", "IN") });
  const { data: top10TVIN = [] } = useQuery({ queryKey: ["top10-tv-in"], queryFn: () => fetchTop10Region("tv", "IN") });

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
      { title: "Blockbuster Movies", items: movies.slice(5, 25) },
      { title: "Top Rated Shows", items: tvShows.slice(0, 20) },
    );
    
    if (genreMovies1.length > 0 && favoriteGenres[0]) {
      s.push({ title: `Because you like ${genreNameById(favoriteGenres[0])}`, items: genreMovies1 });
    }
    
    s.push(
      { title: "Action Must-Watch", items: actionMovies.slice(0, 20) },
      { title: "Sci-Fi & Fantasy", items: sciFiMovies.slice(0, 20) },
    );

    s.push(
      { title: "Critic Choice Movies", items: topRatedMovies.slice(5, 25) },
      { title: "Coming Soon", items: upcoming.slice(0, 20) },
    );
    
    if (genreMovies2.length > 0 && favoriteGenres[1]) {
      s.push({ title: `${genreNameById(favoriteGenres[1])} Picks For You`, items: genreMovies2 });
    }

    s.push(
      { title: "Hot TV Series", items: popularTV.slice(5, 25) },
      { title: "Comedy Hub", items: comedyTV.slice(0, 20) },
      { title: "Family Collection", items: familyMovies.slice(0, 20) },
      { title: "TV Favorites", items: tvShows.slice(5, 25) },
      { title: "Anime Spotlight", items: anime },
    );
    return s.filter(shelf => shelf.items && shelf.items.length > 0);
  }, [trending, trendingDay, movies, tvShows, anime, nowPlaying, upcoming, topRatedMovies, airingToday, popularTV, genreMovies1, genreMovies2, favoriteGenres, recommendations, actionMovies, sciFiMovies, comedyTV, familyMovies]);

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`${trending.length > 0 ? "pt-2 sm:pt-4" : "pt-20 sm:pt-24"} pb-20 md:pb-12`}
        >
          {user && continueWatching.length > 0 && (
            <ContinueWatchingShelf items={continueWatching} onPlay={handlePlayDirect} />
          )}
          {user && recentlyWatched.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8 sm:mb-10"
            >
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
            </motion.section>
          )}

          {/* Special Top 10 Shelves with staggered entrance */}
          {top10MoviesIN.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", damping: 20 }}>
              <Top10Shelf title="Top 10 Movies in India: Netflix & Prime" items={top10MoviesIN} onSelect={handleSelect} />
            </motion.div>
          )}
          {top10TVIN.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", damping: 20, delay: 0.1 }}>
              <Top10Shelf title="Top 10 TV Shows in India: Netflix & Prime" items={top10TVIN} onSelect={handleSelect} />
            </motion.div>
          )}
          {top10MoviesGlobal.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", damping: 20, delay: 0.2 }}>
              <Top10Shelf title="Top 10 Movies Globally Today" items={top10MoviesGlobal} onSelect={handleSelect} />
            </motion.div>
          )}
          {top10TVGlobal.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", damping: 20, delay: 0.3 }}>
              <Top10Shelf title="Top 10 TV Shows Globally Today" items={top10TVGlobal} onSelect={handleSelect} />
            </motion.div>
          )}

          {shelves.filter(s => !s.title.includes("Top 10")).map(({ title, items }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: idx * 0.05 + 0.2 }}
            >
              <ContentShelf title={title} items={items} onSelect={handleSelect} />
            </motion.div>
          ))}
        </motion.div>
        <MobileNavBar activeNav="Home" onNavChange={() => {}} onSearchClick={() => setSearchOpen(true)} onAuthClick={() => setAuthOpen(true)} />
      </div>
      )}

      {overlays}
    </>
  );
};

export default Index;
