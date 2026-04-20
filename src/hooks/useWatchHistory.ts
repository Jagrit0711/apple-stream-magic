import { useEffect, useCallback, useState } from "react";
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
  position_seconds: number | null;
  duration_seconds: number | null;
  season: number | null;
  episode: number | null;
  last_watched_at: string;
}

export const useWatchHistory = () => {
  // Local storage key
  const STORAGE_KEY = "zuup_watch_history";
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Save to localStorage
  const saveHistory = (items: WatchHistoryItem[]) => {
    setHistory(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  };


  // Items between 5% and 90% progress = continue watching
  // Items >= 90% = recently watched (finished)
  // Items < 5% = just started, also show in continue watching
  const continueWatching = history.filter(h => h.progress < 90);
  const recentlyWatched = history.filter(h => h.progress >= 90).slice(0, 10);


  // Add or update a watch history entry
  const upsertHistory = (entry: Partial<WatchHistoryItem> & { tmdb_id: number; media_type: string }) => {
    const now = new Date().toISOString();
    let updated = false;
    let items = [...history];
    for (let i = 0; i < items.length; i++) {
      if (items[i].tmdb_id === entry.tmdb_id && items[i].media_type === entry.media_type &&
        (entry.media_type !== "tv" || (items[i].season === entry.season && items[i].episode === entry.episode))) {
        items[i] = { ...items[i], ...entry, last_watched_at: now };
        updated = true;
        break;
      }
    }
    if (!updated) {
      items.unshift({
        id: `${entry.tmdb_id}-${entry.media_type}-${entry.season ?? ""}-${entry.episode ?? ""}`,
        tmdb_id: entry.tmdb_id,
        media_type: entry.media_type,
        title: entry.title || `Content ${entry.tmdb_id}`,
        poster_path: entry.poster_path || null,
        backdrop_path: entry.backdrop_path || null,
        in_watchlist: false,
        added_to_watchlist_at: null,
        progress: entry.progress ?? 0,
        duration: entry.duration ?? null,
        position_seconds: entry.position_seconds ?? null,
        duration_seconds: entry.duration_seconds ?? null,
        season: entry.season ?? null,
        episode: entry.episode ?? null,
        last_watched_at: now,
      });
    }
    // Limit to 50 entries
    if (items.length > 50) items = items.slice(0, 50);
    saveHistory(items);
  };

  const trackWatch = useCallback(
    (
      item: TMDBMovie,
      progress = 5,
      duration: number | null = null,
      season?: number,
      episode?: number,
      positionSeconds?: number | null,
      durationSeconds?: number | null,
    ) => {
      upsertHistory({
        tmdb_id: item.id,
        media_type: getContentType(item),
        title: getTitle(item),
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        progress,
        duration,
        position_seconds: positionSeconds,
        duration_seconds: durationSeconds,
        season,
        episode,
      });
    },
    [history]
  );

  // Listen for progress messages from VIDEASY player
  // Videasy sends postMessage with various formats - handle all of them
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data || typeof data !== "object") return;

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
        let positionSeconds: number | undefined;
        let durationSeconds: number | null = null;
        let season: number | undefined;
        let episode: number | undefined;

        const source = data.data && typeof data.data === "object" ? data.data : data;

        if (source.id !== undefined || source.tmdb_id !== undefined || source.contentId !== undefined) {
          tmdb_id = readNumber(source.tmdb_id, source.contentId, source.content_id, source.id, source.movieId, source.tvId);
          progressPct = readNumber(source.progress, source.percent, source.percentage);
          media_type = source.type || source.media_type || (source.tvId ? "tv" : "movie");
          title = source.title || source.name;
          durationSeconds = readNumber(source.duration, source.totalDuration, source.length) ?? null;
          duration = durationSeconds;
          positionSeconds = readNumber(source.currentTime, source.current_time, source.position, source.time, source.elapsed);
          season = readNumber(source.season, source.season_number);
          episode = readNumber(source.episode, source.episode_number);
        } else if (source.event === "timeupdate" && source.currentTime && source.duration) {
          tmdb_id = readNumber(source.tmdb_id, source.contentId, source.content_id, source.id, source.movieId, source.tvId);
          const pct = (Number(source.currentTime) / Number(source.duration)) * 100;
          progressPct = Math.round(pct);
          media_type = source.type || source.media_type || "movie";
          title = source.title || source.name;
          durationSeconds = Number(source.duration);
          duration = durationSeconds;
          positionSeconds = Number(source.currentTime);
          season = readNumber(source.season, source.season_number);
          episode = readNumber(source.episode, source.episode_number);
        }

        if (
          progressPct === undefined
          && positionSeconds !== undefined
          && durationSeconds !== null
          && durationSeconds > 0
        ) {
          progressPct = Math.round((positionSeconds / durationSeconds) * 100);
        }

        if (!tmdb_id || progressPct === undefined || isNaN(tmdb_id) || isNaN(progressPct)) return;
        if (progressPct < 0 || progressPct > 100) return;

        upsertHistory({
          tmdb_id,
          media_type,
          ...(title && { title }),
          progress: Math.round(progressPct),
          ...(duration && { duration }),
          ...(positionSeconds !== undefined && { position_seconds: positionSeconds }),
          ...(durationSeconds !== null && { duration_seconds: durationSeconds }),
          ...(season !== undefined && { season }),
          ...(episode !== undefined && { episode }),
        });
      } catch (e) {
        // Silently ignore parse errors
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [history]);

  const getHistoryEntry = useCallback(
    (tmdbId: number, mediaType: "movie" | "tv", season?: number, episode?: number) => {
      const matches = history.filter(h => h.tmdb_id === tmdbId && h.media_type === mediaType);
      if (matches.length === 0) return null;

      if (mediaType === "tv") {
        const exact = matches.find(h =>
          (season === undefined || h.season === season)
          && (episode === undefined || h.episode === episode)
        );
        if (exact) return exact;

        if (season !== undefined) {
          const sameSeason = matches.find(h => h.season === season);
          if (sameSeason) return sameSeason;
        }
      }

      return matches[0];
    },
    [history]
  );

  const getResumeSeconds = useCallback(
    (tmdbId: number, mediaType: "movie" | "tv", season?: number, episode?: number) =>
      getHistoryEntry(tmdbId, mediaType, season, episode)?.position_seconds ?? null,
    [getHistoryEntry]
  );

  return { continueWatching, recentlyWatched, history, trackWatch, getHistoryEntry, getResumeSeconds };
};
