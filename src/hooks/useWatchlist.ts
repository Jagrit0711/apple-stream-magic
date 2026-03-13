import { useState, useEffect } from "react";
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
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("watchlists" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWatchlist((data as any) || []);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  const addToWatchlist = async (item: {
    tmdb_id: number;
    media_type: "movie" | "tv";
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
  }) => {
    if (!user) {
      toast.error("Please sign in to add to watchlist");
      return;
    }

    try {
      const { error } = await supabase
        .from("watchlists" as any)
        .insert({
          user_id: user.id,
          ...item,
        });

      if (error) throw error;
      toast.success("Added to watchlist");
      fetchWatchlist();
    } catch (err: any) {
      if (err.code === "23505") {
        toast.error("Already in watchlist");
      } else {
        toast.error("Failed to add to watchlist");
      }
    }
  };

  const removeFromWatchlist = async (tmdb_id: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("watchlists" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdb_id);

      if (error) throw error;
      toast.success("Removed from watchlist");
      fetchWatchlist();
    } catch (err) {
      toast.error("Failed to remove from watchlist");
    }
  };

  const isInWatchlist = (tmdb_id: number) => {
    return watchlist.some(item => item.tmdb_id === tmdb_id);
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refreshWatchlist: fetchWatchlist,
  };
};
