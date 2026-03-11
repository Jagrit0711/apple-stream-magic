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
        .from("watch_history")
        .select("*")
        .eq("user_id", user.id)
        .order("last_watched_at", { ascending: false })
        .limit(20);
      return (data || []) as WatchHistoryItem[];
    },
    enabled: !!user,
  });

  // Items between 5% and 90% progress = continue watching
  // Items >= 90% = recently watched (finished)
  // Items < 5% = just started, also show in continue watching
  const continueWatching = history.filter(h => h.progress >= 1 && h.progress < 90);
  const recentlyWatched = history.filter(h => h.progress >= 90).slice(0, 10);

  const upsertMutation = useMutation({
    mutationFn: async (entry: {
      tmdb_id: number;
      media_type: string;
      title: string;
      poster_path: string | null;
      backdrop_path: string | null;
      progress: number;
      duration: number | null;
      season?: number;
      episode?: number;
    }) => {
      if (!user) return;
      const { error } = await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          tmdb_id: entry.tmdb_id,
          media_type: entry.media_type,
          title: entry.title,
          poster_path: entry.poster_path,
          backdrop_path: entry.backdrop_path,
          progress: entry.progress,
          duration: entry.duration,
          season: entry.season ?? null,
          episode: entry.episode ?? null,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,tmdb_id,media_type" }
      );
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

        let tmdb_id: number | undefined;
        let progressPct: number | undefined;
        let media_type: string = "movie";
        let title: string | undefined;
        let duration: number | null = null;
        let season: number | undefined;
        let episode: number | undefined;

        // Format 1: videasy standard
        if (data.id && data.progress !== undefined) {
          tmdb_id = Number(data.id);
          progressPct = Number(data.progress);
          media_type = data.type || data.media_type || "movie";
          title = data.title;
          duration = data.duration ? Number(data.duration) : null;
          season = data.season ? Number(data.season) : undefined;
          episode = data.episode ? Number(data.episode) : undefined;
        }
        // Format 2: timeupdate event
        else if (data.event === "timeupdate" && data.currentTime && data.duration) {
          tmdb_id = data.id ? Number(data.id) : undefined;
          const pct = (Number(data.currentTime) / Number(data.duration)) * 100;
          progressPct = Math.round(pct);
          media_type = data.type || "movie";
          title = data.title;
          duration = Number(data.duration);
          season = data.season ? Number(data.season) : undefined;
          episode = data.episode ? Number(data.episode) : undefined;
        }

        if (!tmdb_id || progressPct === undefined || isNaN(tmdb_id) || isNaN(progressPct)) return;
        if (progressPct < 0 || progressPct > 100) return;

        // Throttle: only update every ~30 seconds worth of change (avoid too many writes)
        upsertMutation.mutate({
          tmdb_id,
          media_type,
          title: title || `Content ${tmdb_id}`,
          poster_path: null,
          backdrop_path: null,
          progress: Math.round(progressPct),
          duration,
          season,
          episode,
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
