const TMDB_BASE = "/api/tmdb";
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYWRhYzNmMzBhMmI3MDRiMDFmZDk3NzEwOWUxY2I5OSIsIm5iZiI6MTcyODQ2ODkwMC4zNDIwMDAyLCJzdWIiOiI2NzA2NTdhNGRjNTRmMjlkMGVhYjViYTciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.yIMztIJtw7BbDEw0UhbWzA4Hh7ovRhzTstcvVcMatyE";
const IMG_BASE = "https://image.tmdb.org/t/p";

export const img = (path: string | null, size: "w500" | "w780" | "w1280" | "original" = "w500") =>
  path ? `${IMG_BASE}/${size}${path}` : null;

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: string;
  original_language?: string;
}

export interface TMDBDetail extends TMDBMovie {
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: { id: number; name: string }[];
  tagline?: string;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  seasons?: { id: number; season_number: number; episode_count: number; name: string }[];
  similar?: { results: TMDBMovie[] };
  recommendations?: { results: TMDBMovie[] };
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  runtime?: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(window.location.origin + TMDB_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    
    if (res.ok) return await res.json();
    
    // If proxied fetch failed (likely local dev without proxy config or Vercel issues)
    throw new Error(`Proxy failed: ${res.status}`);
  } catch (err) {
    console.warn("Direct proxy failed, trying official TMDB endpoint directly:", err);
    
    // Try official TMDB directly. Note: This might still fail due to CORS in some browser environments
    // unless TMDB allows the origin directly.
    const directUrl = new URL("https://api.themoviedb.org/3" + endpoint);
    Object.entries(params).forEach(([k, v]) => directUrl.searchParams.set(k, v));
    
    const finalRes = await fetch(directUrl.toString(), {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!finalRes.ok) throw new Error(`TMDB Direct failed: ${finalRes.status}`);
    return await finalRes.json();
  }
}

export const fetchTrending = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/trending/all/week").then(r => r.results);

export const fetchPopularMovies = (page = 1) =>
  tmdbFetch<{ results: TMDBMovie[]; total_pages: number }>("/movie/popular", { page: String(page) });

export const fetchTopRatedTV = (page = 1) =>
  tmdbFetch<{ results: TMDBMovie[]; total_pages: number }>("/tv/top_rated", { page: String(page) });

export const fetchPopularAnime = (page = 1) =>
  tmdbFetch<{ results: TMDBMovie[]; total_pages: number }>("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
    page: String(page),
  });

export const fetchNowPlayingMovies = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/movie/now_playing").then(r => r.results);

export const fetchUpcomingMovies = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/movie/upcoming").then(r => r.results);

export const fetchTopRatedMovies = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/movie/top_rated").then(r => r.results);

export const fetchAiringTodayTV = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/tv/airing_today").then(r => r.results);

export const fetchPopularTV = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/tv/popular").then(r => r.results);

export const fetchOnTheAirTV = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/tv/on_the_air").then(r => r.results);

export const fetchMoviesByGenre = (genreId: number) =>
  tmdbFetch<{ results: TMDBMovie[] }>("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
  }).then(r => r.results);

export const fetchTVByGenre = (genreId: number) =>
  tmdbFetch<{ results: TMDBMovie[] }>("/discover/tv", {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
  }).then(r => r.results);

export const fetchMovieGenres = () =>
  tmdbFetch<{ genres: TMDBGenre[] }>("/genre/movie/list").then(r => r.genres);

export const fetchTVGenres = () =>
  tmdbFetch<{ genres: TMDBGenre[] }>("/genre/tv/list").then(r => r.genres);

export const fetchMovieDetail = (id: number) =>
  tmdbFetch<TMDBDetail>(`/movie/${id}`, { append_to_response: "credits,similar,recommendations" });

export const fetchTVDetail = (id: number) =>
  tmdbFetch<TMDBDetail>(`/tv/${id}`, { append_to_response: "credits,similar,recommendations" });

export const fetchTVSeasonEpisodes = (tvId: number, season: number) =>
  tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tvId}/season/${season}`).then(r => r.episodes);

export const searchMulti = (query: string) =>
  tmdbFetch<{ results: TMDBMovie[] }>("/search/multi", { query }).then(r =>
    r.results.filter(r => r.media_type === "movie" || r.media_type === "tv")
  );

export const fetchSimilar = (id: number, type: "movie" | "tv") =>
  tmdbFetch<{ results: TMDBMovie[] }>(`/${type}/${id}/similar`).then(r => r.results);

export const fetchTrendingDay = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/trending/all/day").then(r => r.results);

export const fetchTrendingWeek = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/trending/all/week").then(r => r.results);

export const fetchTop10Global = (type: "movie" | "tv") =>
  tmdbFetch<{ results: TMDBMovie[] }>(`/trending/${type}/day`).then(r => r.results.slice(0, 10));

export const fetchTop10Region = async (type: "movie" | "tv", region: string = "IN") => {
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString().split('T')[0];
  
  const params: Record<string, string> = {
    watch_region: region,
    sort_by: "popularity.desc",
  };

  if (region === "IN") {
    // 8: Netflix, 119: Amazon Prime Video (Hotstar removed as requested)
    params["with_watch_providers"] = "8|119";
    params["watch_region"] = "IN";
  }

  if (type === "tv") {
    params["first_air_date.gte"] = fiveYearsAgo;
  } else {
    params["primary_release_date.gte"] = fiveYearsAgo;
  }

  const data = await tmdbFetch<{ results: TMDBMovie[] }>(`/discover/${type}`, params);
  return data.results.slice(0, 10);
};

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export const fetchTrailers = async (id: number, type: "movie" | "tv"): Promise<TMDBVideo[]> => {
  const data = await tmdbFetch<{ results: TMDBVideo[] }>(`/${type}/${id}/videos`);
  const trailers = data.results.filter(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  return trailers.sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0));
};

export const fetchByIdAndType = async (id: number, type: "movie" | "tv"): Promise<TMDBDetail> =>
  type === "movie" ? fetchMovieDetail(id) : fetchTVDetail(id);

export const getContentType = (item: TMDBMovie): "movie" | "tv" =>
  item.media_type === "tv" || item.first_air_date ? "tv" : "movie";

export const getTitle = (item: TMDBMovie) => item.title || item.name || "Untitled";
export const getYear = (item: TMDBMovie) =>
  (item.release_date || item.first_air_date || "").slice(0, 4);

export const MOVIE_GENRES: TMDBGenre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

export const TV_GENRES: TMDBGenre[] = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10764, name: "Reality" },
];
