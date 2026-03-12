import { useState } from "react";
import { TMDBMovie, getContentType } from "@/lib/tmdb";
import { useWatchHistory } from "@/hooks/useWatchHistory";

export const useContentActions = (allItems: TMDBMovie[]) => {
  const { history, trackWatch } = useWatchHistory();
  const [selectedItem, setSelectedItem] = useState<TMDBMovie | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [player, setPlayer] = useState<{
    id: number;
    type: "movie" | "tv";
    season?: number;
    episode?: number;
  } | null>(null);

  const handleSelect = (item: TMDBMovie) => setSelectedItem(item);

  const handlePlay = (item: TMDBMovie) => {
    const type = getContentType(item);
    const season = type === "tv" ? 1 : undefined;
    const episode = type === "tv" ? 1 : undefined;
    trackWatch(item, 5, null, season, episode);
    setPlayer({ id: item.id, type, season, episode });
  };

  const handlePlayDirect = (id: number, type: "movie" | "tv", season?: number, episode?: number) => {
    setSelectedItem(null);
    const existingHistory = history.find(h => h.tmdb_id === id && h.media_type === type);
    if (!existingHistory) {
      const found = allItems.find(i => i.id === id);
      if (found) trackWatch(found, 5, null, season, episode);
    }
    setPlayer({ id, type, season, episode });
  };

  return {
    selectedItem, setSelectedItem,
    player, setPlayer,
    searchOpen, setSearchOpen,
    authOpen, setAuthOpen,
    handleSelect, handlePlay, handlePlayDirect,
  };
};
