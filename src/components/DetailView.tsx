import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  TMDBMovie,
  TMDBEpisode,
  img,
  getTitle,
  getYear,
  getContentType,
  fetchMovieDetail,
  fetchTVDetail,
  fetchTVSeasonEpisodes,
} from "@/lib/tmdb";

interface DetailViewProps {
  item: TMDBMovie | null;
  onClose: () => void;
  onPlay: (id: number, type: "movie" | "tv", season?: number, episode?: number) => void;
}

const DetailView = ({ item, onClose, onPlay }: DetailViewProps) => {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const type = item ? getContentType(item) : "movie";

  const { data: detail } = useQuery({
    queryKey: ["detail", item?.id, type],
    queryFn: () => (type === "movie" ? fetchMovieDetail(item!.id) : fetchTVDetail(item!.id)),
    enabled: !!item,
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", item?.id, selectedSeason],
    queryFn: () => fetchTVSeasonEpisodes(item!.id, selectedSeason),
    enabled: !!item && type === "tv",
  });

  useEffect(() => {
    setSelectedSeason(1);
  }, [item?.id]);

  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative w-full max-w-4xl mt-8 mb-16 mx-4 z-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 bg-surface/80 backdrop-blur-sm rounded-full p-2 text-meta hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {/* Hero image */}
            <div className="relative aspect-video rounded-t-lg overflow-hidden">
              {img(item.backdrop_path, "w1280") ? (
                <img
                  src={img(item.backdrop_path, "w1280")!}
                  alt={getTitle(item)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

              {/* Play button */}
              <div className="absolute bottom-6 left-8">
                <button
                  onClick={() => {
                    if (type === "movie") {
                      onPlay(item.id, "movie");
                    } else {
                      onPlay(item.id, "tv", selectedSeason, 1);
                    }
                  }}
                  className="flex items-center gap-2 bg-foreground text-primary-foreground px-8 py-3 rounded-md font-display font-semibold text-sm hover:bg-foreground/90 transition-colors animate-pulse-glow"
                >
                  <Play size={18} fill="currentColor" />
                  {type === "movie" ? "Play" : "Play S1 E1"}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-card rounded-b-lg px-8 py-8">
              <h2 className="font-display font-bold text-3xl text-foreground mb-2">
                {getTitle(item)}
              </h2>

              <div className="flex items-center gap-4 mb-4 font-body text-sm text-meta">
                <span>{getYear(item)}</span>
                {detail?.runtime && <span>{Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m</span>}
                {detail?.number_of_seasons && <span>{detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? "s" : ""}</span>}
                <span>★ {item.vote_average.toFixed(1)}</span>
                {detail?.genres?.map(g => (
                  <span key={g.id} className="bg-surface px-2 py-0.5 rounded text-xs">{g.name}</span>
                ))}
              </div>

              {detail?.tagline && (
                <p className="font-body text-meta italic text-sm mb-3">"{detail.tagline}"</p>
              )}

              <p className="font-body text-foreground/80 text-base leading-relaxed mb-6 max-w-2xl">
                {item.overview}
              </p>

              {/* Cast */}
              {detail?.credits?.cast && detail.credits.cast.length > 0 && (
                <div className="mb-6">
                  <p className="font-body text-meta text-sm mb-2">Cast</p>
                  <p className="font-body text-foreground/70 text-sm">
                    {detail.credits.cast.slice(0, 6).map(c => c.name).join(", ")}
                  </p>
                </div>
              )}

              {/* Episodes for TV */}
              {type === "tv" && detail?.seasons && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="font-display font-semibold text-foreground">Episodes</p>
                    <div className="relative">
                      <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                        className="bg-surface text-foreground font-body text-sm px-3 py-1.5 pr-8 rounded border border-border appearance-none cursor-pointer focus:outline-none"
                      >
                        {detail.seasons
                          .filter(s => s.season_number > 0)
                          .map(s => (
                            <option key={s.season_number} value={s.season_number}>
                              Season {s.season_number}
                            </option>
                          ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-meta pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {episodes?.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => onPlay(item.id, "tv", selectedSeason, ep.episode_number)}
                        className="w-full flex items-start gap-4 p-3 rounded-md bg-surface hover:bg-surface-hover transition-colors text-left group"
                      >
                        <div className="flex-shrink-0 w-32 aspect-video rounded overflow-hidden bg-muted">
                          {ep.still_path ? (
                            <img src={img(ep.still_path, "w500")!} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={16} className="text-meta" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-foreground group-hover:text-foreground mb-1">
                            {ep.episode_number}. {ep.name}
                          </p>
                          <p className="font-body text-xs text-meta line-clamp-2">{ep.overview}</p>
                          {ep.runtime && <p className="font-body text-xs text-meta mt-1">{ep.runtime}m</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DetailView;
