import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
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

export const useWatchlist = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isZuupUser = (user as any)?.app_metadata?.provider === "zuup";
  const actorUserId = profile?.user_id || user?.id || null;

  const { data: watchlist = [], isLoading: loading } = useQuery({
    queryKey: ["watchlist", actorUserId, isZuupUser],
    queryFn: async () => {
      if (!actorUserId) return [];

      if (isZuupUser) {
        const res = await fetch(`/api/zuup/user-content?user_id=${encodeURIComponent(actorUserId)}&watchlist=1&limit=500`);
        const text = await res.text();
        const parsed = text ? JSON.parse(text) : [];
        if (!res.ok) throw new Error(parsed?.error || "Failed to fetch watchlist");
        return (Array.isArray(parsed) ? parsed : []) as any as WatchlistItem[];
      }

      const { data, error } = await supabase
        .from("apple_user_content" as any)
        .select("*")
        .eq("user_id", actorUserId)
        .eq("in_watchlist", true)
        .order("added_to_watchlist_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any as WatchlistItem[];
    },
    enabled: !!actorUserId,
  });

  const addMutation = useMutation({
    mutationFn: async (item: {
      tmdb_id: number;
      media_type: "movie" | "tv";
      title: string;
      poster_path: string | null;
      backdrop_path: string | null;
    }) => {
      if (!actorUserId) throw new Error("Not signed in");

      if (isZuupUser) {
        const res = await fetch("/api/zuup/user-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: actorUserId,
            ...item,
            in_watchlist: true,
            added_to_watchlist_at: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Failed to add watchlist item");
        return;
      }
      
      const { error } = await supabase.from("apple_user_content" as any).upsert({
        user_id: actorUserId,
        ...item,
        in_watchlist: true,
        added_to_watchlist_at: new Date().toISOString()
      }, { onConflict: "user_id,tmdb_id,media_type" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to watchlist");
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: any) => {
      if (err.code === "23505") {
        toast.error("Already in watchlist");
      } else {
        toast.error("Failed to add to watchlist");
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (tmdb_id: number) => {
      if (!actorUserId) throw new Error("Not signed in");

      if (isZuupUser) {
        const res = await fetch("/api/zuup/user-content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: actorUserId,
            tmdb_id,
            updates: { in_watchlist: false },
          }),
        });
        if (!res.ok) throw new Error("Failed to remove watchlist item");
        return;
      }

      const { error } = await supabase
        .from("apple_user_content" as any)
        .update({ in_watchlist: false })
        .eq("user_id", actorUserId)
        .eq("tmdb_id", tmdb_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from watchlist");
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: () => toast.error("Failed to remove from watchlist"),
  });

  const isInWatchlist = (tmdb_id: number) => {
    return watchlist.some(item => item.tmdb_id === tmdb_id);
  };

  return {
    watchlist,
    loading,
    addToWatchlist: addMutation.mutate,
    removeFromWatchlist: removeMutation.mutate,
    isInWatchlist,
    refreshWatchlist: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  };
};
