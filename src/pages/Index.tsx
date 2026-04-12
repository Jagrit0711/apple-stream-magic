import { useMemo, useEffect, useState } from "react";
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
  getContentType
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useSmartRecommendations } from "@/hooks/useSmartRecommendations";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import Top10Shelf from "@/components/Top10Shelf";
import ContinueWatchingShelf from "@/components/ContinueWatchingShelf";
import Onboarding from "@/components/Onboarding";
import Landing from "../components/Landing";
import MobileCategories from "@/components/MobileCategories";
import { useIsMobile } from "@/hooks/use-mobile";
import TabletLayout from "@/components/TabletLayout";
import { SkeletonShelf, SkeletonHero } from "@/components/Skeletons";
import { useLayout } from "@/components/MainLayout";
import { hasAppAccess } from "@/lib/access";

const Index = () => {
  const { user, profile } = useAuth();
  const { continueWatching, recentlyWatched, history, trackWatch, getHistoryEntry } = useWatchHistory();
  const { recommendations, personalizedShelves } = useSmartRecommendations(history);
  const accessGranted = hasAppAccess(profile);

  // TV mode detection — persisted in localStorage so no flash on reload
  const [isTVMode, setIsTVMode] = useState(() => {
    try { if (localStorage.getItem("tv-mode") === "1") return true; } catch {}
    return (
      navigator.userAgent.toLowerCase().includes("tv") ||
      navigator.userAgent.toLowerCase().includes("smart-tv")
    );
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        setIsTVMode(true);
        try { localStorage.setItem("tv-mode", "1"); } catch {}
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // User-Agent based device detection instead of purely CSS media queries
  const isTablet = useMemo(() => {
    const ua = navigator.userAgent;
    return /(tablet|ipad|playbook|macintosh.*touch)/i.test(ua) && !/mobile/i.test(ua);
  }, []);

  const { setSelectedItem, setPlayer, setAuthOpen } = useLayout();
  
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

  const handleSelect = (item: TMDBMovie) => setSelectedItem(item);
  const handlePlayDirect = (id: number, type: "movie" | "tv", s?: number, e?: number, r?: number) =>
    setPlayer({ id, type, season: s, episode: e, resumeSeconds: r });
  const handlePlay = (item: TMDBMovie) => {
    const type = getContentType(item);
    const existing = getHistoryEntry(item.id, type);
    if (!existing) {
      trackWatch(item);
    }
    handlePlayDirect(
      item.id,
      type,
      existing?.season ?? undefined,
      existing?.episode ?? undefined,
      existing?.position_seconds ?? undefined,
    );
  };

  const genreNameById = (id: number) => {
    const genres: Record<number, string> = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 14: "Fantasy", 27: "Horror", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller" };
    return genres[id] || "Picks";
  };

  const shelves = useMemo(() => {
    const s: { title: string; items: TMDBMovie[] }[] = [];
    if (recommendations.length > 0) s.push({ title: "🤖 AI Picks For You", items: recommendations });
    if (personalizedShelves?.length > 0) {
      s.push(...personalizedShelves);
    }
    
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
  }, [trending, trendingDay, movies, tvShows, anime, nowPlaying, upcoming, topRatedMovies, airingToday, popularTV, genreMovies1, genreMovies2, favoriteGenres, recommendations, personalizedShelves, actionMovies, sciFiMovies, comedyTV, familyMovies]);

  if (!user || !accessGranted) {
    return (
      <Landing
        trending={trendingDay}
        onAuthClick={() => setAuthOpen(true)}
        accessLocked={Boolean(user && !accessGranted)}
        userName={profile?.display_name || user?.email || undefined}
        hasAccount={Boolean(user)}
      />
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
          onPlayDirect={handlePlayDirect}
          onSearchClick={() => {}}
          onAuthClick={() => setAuthOpen(true)}
          user={user}
          profile={profile}
        />
      ) : (
        <div className="pb-24">
          <div className={`md:hidden relative`}>
            <MobileCategories />
          </div>

          {trending.length === 0 ? (
            <div className="pt-20 lg:pt-0">
              <SkeletonHero />
              <div className="-mt-20 relative z-10 space-y-12">
                <SkeletonShelf />
                <SkeletonShelf />
                <SkeletonShelf />
              </div>
            </div>
          ) : (
            <>
              <FeaturedHero items={trending} onPlay={handlePlay} onSelect={handleSelect} />
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 -mt-20 md:-mt-32 pb-24 md:pb-12"
              >
                {user && continueWatching.length > 0 && (
                  <ContinueWatchingShelf items={continueWatching} onPlay={handlePlayDirect} />
                )}
                
                {user && recentlyWatched.length > 0 && (
                  <motion.section 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8 sm:mb-10"
                  >
                     <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto mb-3 sm:mb-4">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">Recently Watched</h3>
                    </div>
                    <div className="shelf-scroll flex gap-2.5 sm:gap-3 overflow-x-auto px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto">
                      {recentlyWatched.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handlePlayDirect(item.tmdb_id, item.media_type as "movie" | "tv", item.season ?? undefined, item.episode ?? undefined, item.position_seconds ?? undefined)}
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

                {/* Interleaved Shelves */}
                {(() => {
                  const allShelves = [];
                  let contentShelfIndex = 0;

                  // 1. Top 10 Movies IN
                  if (top10MoviesIN.length > 0) allShelves.push({ type: 'top10', title: 'Top 10 Movies in India', items: top10MoviesIN });
                  
                  // 2. First normal shelf (Trending Today)
                  if (shelves.length > contentShelfIndex) {
                    allShelves.push({ type: 'content', title: shelves[contentShelfIndex].title, items: shelves[contentShelfIndex].items });
                    contentShelfIndex++;
                  }

                  // 3. Top 10 TV Shows IN
                  if (top10TVIN.length > 0) allShelves.push({ type: 'top10', title: 'Top 10 TV Shows in India', items: top10TVIN });

                  // 4. Second normal shelf
                  if (shelves.length > contentShelfIndex) {
                    allShelves.push({ type: 'content', title: shelves[contentShelfIndex].title, items: shelves[contentShelfIndex].items });
                    contentShelfIndex++;
                  }

                  // 5. Top 10 Movies Global
                  if (top10MoviesGlobal.length > 0) allShelves.push({ type: 'top10', title: 'Top 10 Movies Globally', items: top10MoviesGlobal });

                  // 6. Third normal shelf
                  if (shelves.length > contentShelfIndex) {
                    allShelves.push({ type: 'content', title: shelves[contentShelfIndex].title, items: shelves[contentShelfIndex].items });
                    contentShelfIndex++;
                  }

                  // 7. Top 10 TV Global
                  if (top10TVGlobal.length > 0) allShelves.push({ type: 'top10', title: 'Top 10 TV Shows Globally', items: top10TVGlobal });

                  // 8. Add remaining shelves (excluding any stray top 10s if they were in the main shelves array)
                  for (let i = contentShelfIndex; i < shelves.length; i++) {
                    if (!shelves[i].title.includes("Top 10")) {
                      allShelves.push({ type: 'content', title: shelves[i].title, items: shelves[i].items });
                    }
                  }

                  return allShelves.map((shelf, idx) => (
                    <motion.div
                      key={`${shelf.type}-${shelf.title}`}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
                    >
                      {shelf.type === 'top10' ? (
                        <Top10Shelf title={shelf.title} items={shelf.items} onSelect={handleSelect} rowIndex={idx} />
                      ) : (
                        <ContentShelf title={shelf.title} items={shelf.items} onSelect={handleSelect} rowIndex={idx} />
                      )}
                    </motion.div>
                  ));
                })()}
              </motion.div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Index;
