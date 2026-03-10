const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = "2dca580c2a14b55200e784d157207b4d";
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

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export const fetchTrending = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/trending/all/week").then(r => r.results);

export const fetchPopularMovies = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/movie/popular").then(r => r.results);

export const fetchTopRatedTV = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/tv/top_rated").then(r => r.results);

export const fetchPopularAnime = () =>
  tmdbFetch<{ results: TMDBMovie[] }>("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
  }).then(r => r.results);

export const fetchMovieDetail = (id: number) =>
  tmdbFetch<TMDBDetail>(`/movie/${id}`, { append_to_response: "credits" });

export const fetchTVDetail = (id: number) =>
  tmdbFetch<TMDBDetail>(`/tv/${id}`, { append_to_response: "credits" });

export const fetchTVSeasonEpisodes = (tvId: number, season: number) =>
  tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tvId}/season/${season}`).then(r => r.episodes);

export const searchMulti = (query: string) =>
  tmdbFetch<{ results: TMDBMovie[] }>("/search/multi", { query }).then(r =>
    r.results.filter(r => r.media_type === "movie" || r.media_type === "tv")
  );

export const getContentType = (item: TMDBMovie): "movie" | "tv" =>
  item.media_type === "tv" || item.first_air_date ? "tv" : "movie";

export const getTitle = (item: TMDBMovie) => item.title || item.name || "Untitled";
export const getYear = (item: TMDBMovie) =>
  (item.release_date || item.first_air_date || "").slice(0, 4);
