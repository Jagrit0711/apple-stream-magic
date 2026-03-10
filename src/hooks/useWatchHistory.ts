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

  const continueWatching = history.filter(h => h.progress > 0 && h.progress < 90);
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
      await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          ...entry,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,tmdb_id,media_type" }
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watch-history"] }),
  });

  const trackWatch = useCallback(
    (item: TMDBMovie, progress = 0, duration: number | null = null, season?: number, episode?: number) => {
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
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.id && data?.progress !== undefined && user) {
          upsertMutation.mutate({
            tmdb_id: data.id,
            media_type: data.type || "movie",
            title: data.title || `Content ${data.id}`,
            poster_path: null,
            backdrop_path: null,
            progress: data.progress,
            duration: data.duration || null,
            season: data.season,
            episode: data.episode,
          });
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [user, upsertMutation]);

  return { continueWatching, recentlyWatched, history, trackWatch };
};
