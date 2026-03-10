const TMDB_BASE = "https://api.themoviedb.org/3";
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
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
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
