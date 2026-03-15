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
  created_at: string;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading: loading } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("apple_user_content" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("in_watchlist", true)
        .order("added_to_watchlist_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any as WatchlistItem[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (item: {
      tmdb_id: number;
      media_type: "movie" | "tv";
      title: string;
      poster_path: string | null;
      backdrop_path: string | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      
      const { data: existing } = await supabase
        .from("apple_user_content" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("tmdb_id", item.tmdb_id)
        .eq("media_type", item.media_type)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("apple_user_content" as any)
          .update({ in_watchlist: true, added_to_watchlist_at: new Date().toISOString() })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("apple_user_content" as any).insert({
          user_id: user.id,
          ...item,
          in_watchlist: true,
          added_to_watchlist_at: new Date().toISOString()
        });
        if (error) throw error;
      }
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
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("apple_user_content" as any)
        .update({ in_watchlist: false })
        .eq("user_id", user.id)
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
