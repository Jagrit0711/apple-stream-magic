import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { TMDBMovie, getTitle, getContentType } from "@/lib/tmdb";

export interface WatchHistoryItem {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  in_watchlist: boolean;
  added_to_watchlist_at: string | null;
  progress: number;
  duration: number | null;
  season: number | null;
  episode: number | null;
  last_watched_at: string;
}

export const useWatchHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ["watch-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("apple_user_content" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("last_watched_at", { ascending: false })
        .limit(20);
      return (data || []) as any as WatchHistoryItem[];
    },
    enabled: !!user,
  });

  // Items between 5% and 90% progress = continue watching
  // Items >= 90% = recently watched (finished)
  // Items < 5% = just started, also show in continue watching
  const continueWatching = history.filter(h => h.progress < 90);
  const recentlyWatched = history.filter(h => h.progress >= 90).slice(0, 10);

  const upsertMutation = useMutation({
    mutationFn: async (entry: {
      tmdb_id: number;
      media_type: string;
      title?: string;
      poster_path?: string | null;
      backdrop_path?: string | null;
      progress: number;
      duration?: number | null;
      season?: number;
      episode?: number;
    }) => {
      if (!user) return;
      
      const payload: any = {
        user_id: user.id,
        tmdb_id: entry.tmdb_id,
        media_type: entry.media_type,
        progress: entry.progress,
        last_watched_at: new Date().toISOString(),
      };
      
      if (entry.title !== undefined) payload.title = entry.title;
      if (entry.poster_path !== undefined) payload.poster_path = entry.poster_path;
      if (entry.backdrop_path !== undefined) payload.backdrop_path = entry.backdrop_path;
      if (entry.duration !== undefined) payload.duration = entry.duration;
      if (entry.season !== undefined) payload.season = entry.season ?? null;
      if (entry.episode !== undefined) payload.episode = entry.episode ?? null;

      // Fallback for title to satisfy NOT NULL constraint on INSERT
      if (!payload.title) payload.title = `Content ${entry.tmdb_id}`;

      const { error } = await supabase
        .from("apple_user_content" as any)
        .upsert(payload, { onConflict: "user_id,tmdb_id,media_type" });

      if (error) console.error("Watch history upsert error:", error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watch-history"] }),
  });

  const trackWatch = useCallback(
    (item: TMDBMovie, progress = 5, duration: number | null = null, season?: number, episode?: number) => {
      upsertMutation.mutate({
        tmdb_id: item.id,
        media_type: getContentType(item),
        title: getTitle(item),
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        progress,
        duration,
        season,
        episode,
      });
    },
    [upsertMutation]
  );

  // Listen for progress messages from VIDEASY player
  // Videasy sends postMessage with various formats - handle all of them
  useEffect(() => {
    if (!user) return;

    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data || typeof data !== "object") return;

        // Videasy postMessage formats:
        // { type: "progress", id, progress, duration, season, episode }
        // { id, progress, type/media_type, title, season, episode }
        // { event: "timeupdate", currentTime, duration, ... }

        const readNumber = (...values: unknown[]) => {
          for (const value of values) {
            if (value === null || value === undefined || value === "") continue;
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) return parsed;
          }
          return undefined;
        };

        let tmdb_id: number | undefined;
        let progressPct: number | undefined;
        let media_type: string = "movie";
        let title: string | undefined;
        let duration: number | null = null;
        let season: number | undefined;
        let episode: number | undefined;

        const source = data.data && typeof data.data === "object" ? data.data : data;

        // Format 1: videasy standard
        if (source.id !== undefined || source.tmdb_id !== undefined || source.contentId !== undefined) {
          tmdb_id = readNumber(source.tmdb_id, source.contentId, source.content_id, source.id, source.movieId, source.tvId);
          progressPct = readNumber(source.progress, source.percent, source.percentage);
          media_type = source.type || source.media_type || (source.tvId ? "tv" : "movie");
          title = source.title || source.name;
          duration = readNumber(source.duration, source.totalDuration, source.length) ?? null;
          season = readNumber(source.season, source.season_number);
          episode = readNumber(source.episode, source.episode_number);
        }
        // Format 2: timeupdate event
        else if (source.event === "timeupdate" && source.currentTime && source.duration) {
          tmdb_id = readNumber(source.tmdb_id, source.contentId, source.content_id, source.id, source.movieId, source.tvId);
          const pct = (Number(source.currentTime) / Number(source.duration)) * 100;
          progressPct = Math.round(pct);
          media_type = source.type || source.media_type || "movie";
          title = source.title || source.name;
          duration = Number(source.duration);
          season = readNumber(source.season, source.season_number);
          episode = readNumber(source.episode, source.episode_number);
        }

        if (!tmdb_id || progressPct === undefined || isNaN(tmdb_id) || isNaN(progressPct)) return;
        if (progressPct < 0 || progressPct > 100) return;

        // Throttle: only update every ~30 seconds worth of change (avoid too many writes)
        upsertMutation.mutate({
          tmdb_id,
          media_type,
          ...(title && { title }),
          progress: Math.round(progressPct),
          ...(duration && { duration }),
          ...(season && { season }),
          ...(episode && { episode }),
        });
      } catch (e) {
        // Silently ignore parse errors
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [user, upsertMutation]);

  return { continueWatching, recentlyWatched, history, trackWatch };
};
