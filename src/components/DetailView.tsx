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

  useEffect(() => { setSelectedSeason(1); }, [item?.id]);
  useEffect(() => {
    if (item) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
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
          <motion.div className="fixed inset-0 bg-background/90 backdrop-blur-xl" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-4xl mt-8 mb-16 mx-4 z-10"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 glass rounded-full p-2.5 text-meta hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="relative aspect-video rounded-t-2xl overflow-hidden">
              {img(item.backdrop_path, "w1280") ? (
                <img src={img(item.backdrop_path, "w1280")!} alt={getTitle(item)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

              <div className="absolute bottom-6 left-8">
                <button
                  onClick={() => type === "movie" ? onPlay(item.id, "movie") : onPlay(item.id, "tv", selectedSeason, 1)}
                  className="flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3 rounded-full font-semibold text-sm hover:bg-accent/90 transition-all accent-glow"
                >
                  <Play size={16} fill="currentColor" />
                  {type === "movie" ? "Play" : "Play S1 E1"}
                </button>
              </div>
            </div>

            <div className="glass-strong rounded-b-2xl px-8 py-8">
              <h2 className="font-bold text-3xl text-foreground mb-2 tracking-tight">{getTitle(item)}</h2>

              <div className="flex items-center gap-3 mb-4 text-sm text-meta flex-wrap">
                <span>{getYear(item)}</span>
                {detail?.runtime && <span>{Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m</span>}
                {detail?.number_of_seasons && <span>{detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? "s" : ""}</span>}
                <span className="text-accent">★ {item.vote_average?.toFixed(1)}</span>
                {detail?.genres?.map(g => (
                  <span key={g.id} className="glass rounded-full px-3 py-0.5 text-xs">{g.name}</span>
                ))}
              </div>

              {detail?.tagline && (
                <p className="text-meta italic text-sm mb-3">"{detail.tagline}"</p>
              )}

              <p className="text-foreground/60 text-sm leading-relaxed mb-6 max-w-2xl">{item.overview}</p>

              {detail?.credits?.cast && detail.credits.cast.length > 0 && (
                <div className="mb-6">
                  <p className="text-meta text-xs mb-2 uppercase tracking-wider">Cast</p>
                  <p className="text-foreground/50 text-sm">{detail.credits.cast.slice(0, 6).map(c => c.name).join(", ")}</p>
                </div>
              )}

              {type === "tv" && detail?.seasons && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="font-semibold text-foreground text-sm">Episodes</p>
                    <div className="relative">
                      <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                        className="glass text-foreground text-sm px-4 py-2 pr-8 rounded-full appearance-none cursor-pointer focus:outline-none"
                      >
                        {detail.seasons.filter(s => s.season_number > 0).map(s => (
                          <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-meta pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {episodes?.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => onPlay(item.id, "tv", selectedSeason, ep.episode_number)}
                        className="w-full flex items-start gap-4 p-3 rounded-xl glass glass-hover text-left group"
                      >
                        <div className="flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-muted">
                          {ep.still_path ? (
                            <img src={img(ep.still_path, "w500")!} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Play size={14} className="text-meta" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground group-hover:text-foreground mb-0.5 font-medium">
                            {ep.episode_number}. {ep.name}
                          </p>
                          <p className="text-xs text-meta line-clamp-2">{ep.overview}</p>
                          {ep.runtime && <p className="text-xs text-meta mt-1">{ep.runtime}m</p>}
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
