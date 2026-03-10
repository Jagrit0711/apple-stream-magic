import { useQuery } from "@tanstack/react-query";
import { TMDBMovie, fetchSimilar, getContentType } from "@/lib/tmdb";
import { WatchHistoryItem } from "./useWatchHistory";

/**
 * Smart AI-like recommendations using TMDB's recommendation engine.
 * Aggregates similar/recommended content from user's watch history
 * and deduplicates to create a personalized shelf.
 */
export const useSmartRecommendations = (history: WatchHistoryItem[]) => {
  // Pick up to 4 recently watched items to base recommendations on
  const seeds = history.slice(0, 4);

  const { data: recs1 = [] } = useQuery({
    queryKey: ["ai-rec", seeds[0]?.tmdb_id, seeds[0]?.media_type],
    queryFn: () => fetchSimilar(seeds[0].tmdb_id, seeds[0].media_type as "movie" | "tv"),
    enabled: seeds.length > 0,
  });

  const { data: recs2 = [] } = useQuery({
    queryKey: ["ai-rec", seeds[1]?.tmdb_id, seeds[1]?.media_type],
    queryFn: () => fetchSimilar(seeds[1].tmdb_id, seeds[1].media_type as "movie" | "tv"),
    enabled: seeds.length > 1,
  });

  const { data: recs3 = [] } = useQuery({
    queryKey: ["ai-rec", seeds[2]?.tmdb_id, seeds[2]?.media_type],
    queryFn: () => fetchSimilar(seeds[2].tmdb_id, seeds[2].media_type as "movie" | "tv"),
    enabled: seeds.length > 2,
  });

  const { data: recs4 = [] } = useQuery({
    queryKey: ["ai-rec", seeds[3]?.tmdb_id, seeds[3]?.media_type],
    queryFn: () => fetchSimilar(seeds[3].tmdb_id, seeds[3].media_type as "movie" | "tv"),
    enabled: seeds.length > 3,
  });

  // Merge, deduplicate, score by frequency, and sort
  const allRecs = [...recs1, ...recs2, ...recs3, ...recs4];
  const watchedIds = new Set(history.map(h => h.tmdb_id));
  const seen = new Map<number, { item: TMDBMovie; score: number }>();

  for (const item of allRecs) {
    if (watchedIds.has(item.id)) continue; // Don't recommend already watched
    if (!item.poster_path) continue;
    const existing = seen.get(item.id);
    if (existing) {
      existing.score += item.vote_average;
    } else {
      seen.set(item.id, { item, score: item.vote_average });
    }
  }

  const recommendations = Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(r => r.item);

  return { recommendations, isLoading: false };
};
