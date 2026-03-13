import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, ChevronDown, Film, Tv, Users, Plus, Check, Volume2, VolumeX } from "lucide-react";
import { usePersistentMute } from "@/hooks/usePersistentMute";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
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
  fetchTrailers,
} from "@/lib/tmdb";

interface DetailViewProps {
  item: TMDBMovie | null;
  onClose: () => void;
  onPlay: (id: number, type: "movie" | "tv", season?: number, episode?: number) => void;
}

const DetailView = ({ item, onClose, onPlay }: DetailViewProps) => {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showTrailer, setShowTrailer] = useState(false);
  const navigate = useNavigate();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isMuted, toggleMute } = usePersistentMute();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const type = item ? getContentType(item) : "movie";

  const { data: detail } = useQuery({
    queryKey: ["detail", item?.id, type],
    queryFn: () => (type === "movie" ? fetchMovieDetail(item!.id) : fetchTVDetail(item!.id)),
    enabled: !!item,
  });

  const { data: trailers = [] } = useQuery({
    queryKey: ["trailers", item?.id, type],
    queryFn: () => fetchTrailers(item!.id, type),
    enabled: !!item,
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", item?.id, selectedSeason],
    queryFn: () => fetchTVSeasonEpisodes(item!.id, selectedSeason),
    enabled: !!item && type === "tv",
  });

  useEffect(() => { setSelectedSeason(1); setShowTrailer(false); }, [item?.id]);
  useEffect(() => {
    if (item) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const func = isMuted ? "mute" : "unMute";
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: [] }),
        "*"
      );
    }
  }, [isMuted, item]);

  const handleWatchParty = () => {
    if (!item) return;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onClose();
    navigate(`/watch-party/${roomId}?id=${item.id}&type=${type}`);
  };

  const mainTrailer = trailers[0];

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

            {/* Hero / Trailer area */}
            <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-black group/hero">
              {mainTrailer && (
                <div className="absolute inset-0 z-0">
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0 scale-[1.3] pointer-events-none transition-transform duration-1000 group-hover/hero:scale-[1.4]"
                    src={`https://www.youtube-nocookie.com/embed/${mainTrailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${mainTrailer.key}&playsinline=1&enablejsapi=1`}
                    allow="autoplay; encrypted-media"
                  />
                </div>
              )}
              
              {!mainTrailer && img(item.backdrop_path, "w1280") && (
                <img src={img(item.backdrop_path, "w1280")!} alt={getTitle(item)} className="w-full h-full object-cover" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
              
              {/* Overlay Mute Toggle */}
              {mainTrailer && (
                <button
                  onClick={toggleMute}
                  className="absolute bottom-6 right-6 z-20 glass rounded-full p-3 text-white hover:bg-white/20 transition-all shadow-2xl opacity-0 group-hover/hero:opacity-100"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              )}
            </div>

            <div className="glass-strong rounded-b-2xl px-8 py-8">
              <h2 className="font-bold text-3xl text-foreground mb-2 tracking-tight">{getTitle(item)}</h2>

              <div className="flex items-center gap-3 mb-6 text-sm text-meta flex-wrap">
                <span>{getYear(item)}</span>
                {detail?.runtime && <span>{Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m</span>}
                {detail?.number_of_seasons && <span>{detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? "s" : ""}</span>}
                <span className="text-accent font-bold">★ {item.vote_average?.toFixed(1)}</span>
                {detail?.genres?.map(g => (
                  <span key={g.id} className="bg-white/5 border border-white/10 rounded-full px-3 py-0.5 text-xs text-foreground/80">{g.name}</span>
                ))}
              </div>

              {/* Action Buttons always visible */}
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onClose(); navigate(`/${type}/${item.id}?autoplay=1${type === "tv" ? `&season=${selectedSeason}&episode=1` : ""}`); }}
                  className="flex items-center gap-2 bg-accent text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-accent/90 transition-all shadow-xl shadow-accent/20"
                >
                  <Play size={16} fill="currentColor" />
                  {type === "movie" ? "Play Movie" : "Play S1 E1"}
                </motion.button>

                {!showTrailer && mainTrailer && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2 bg-white/5 border border-white/5 text-white px-6 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"
                  >
                    <Film size={16} />
                    Watch Trailer
                  </motion.button>
                )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleWatchParty}
                    className="flex items-center gap-2 bg-white/5 border border-white/5 text-white px-6 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"
                  >
                    <Users size={16} />
                    Watch Party
                  </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isInWatchlist(item.id)) {
                      removeFromWatchlist(item.id);
                    } else {
                      addToWatchlist({
                        tmdb_id: item.id,
                        media_type: type,
                        title: getTitle(item),
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                      });
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all border shadow-xl ${
                    isInWatchlist(item.id) 
                      ? "bg-green-500/10 border-green-500/30 text-green-500" 
                      : "bg-white/5 border-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {isInWatchlist(item.id) ? <Check size={16} /> : <Plus size={16} />}
                  {isInWatchlist(item.id) ? "In Watchlist" : "Watchlist"}
                </motion.button>
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

              {/* All trailers list */}
              {trailers.length > 1 && (
                <div className="mb-6">
                  <p className="text-meta text-xs mb-3 uppercase tracking-wider">Videos</p>
                  <div className="flex gap-2 flex-wrap">
                    {trailers.slice(0, 4).map(v => (
                      <button
                        key={v.id}
                        onClick={() => setShowTrailer(true)}
                        className="glass text-xs text-foreground/70 px-3 py-1.5 rounded-full hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <Film size={11} />
                        {v.name.length > 30 ? v.name.slice(0, 30) + "…" : v.name}
                      </button>
                    ))}
                  </div>
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
                        onClick={() => { onClose(); navigate(`/tv/${item.id}?autoplay=1&season=${selectedSeason}&episode=${ep.episode_number}`); }}
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
