import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTVDetail, fetchTVSeasonEpisodes, getTitle, img, fetchTrailers } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Play, ArrowLeft, Film, Users, Star, ChevronDown, Plus, Check } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import VideoPlayer from "@/components/VideoPlayer";
import Header from "@/components/Header";
import ContentShelf from "@/components/ContentShelf";
import { useLayout } from "@/components/MainLayout";

const TVPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParamsUrl] = useSearchParams();
  const navigate = useNavigate();
  const tvId = Number(id);
  const autoplay = searchParamsUrl.get("autoplay") === "1";
  const autoSeason = Number(searchParamsUrl.get("season") || 1);
  const autoEpisode = Number(searchParamsUrl.get("episode") || 1);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(autoSeason);
  const { setPlayer } = useLayout();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["detail", tvId, "tv"],
    queryFn: () => fetchTVDetail(tvId),
    enabled: !!tvId,
  });

  const { data: trailers = [] } = useQuery({
    queryKey: ["trailers", tvId, "tv"],
    queryFn: () => fetchTrailers(tvId, "tv"),
    enabled: !!tvId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes", tvId, selectedSeason],
    queryFn: () => fetchTVSeasonEpisodes(tvId, selectedSeason),
    enabled: !!tvId,
  });

  const isTV = (() => { try { return localStorage.getItem("tv-mode") === "1"; } catch { return false; } })();
  const [tvBtnIdx, setTvBtnIdx] = useState(0);
  const BTN_COUNT = 4;

  // TV remote nav for this page's action buttons
  useEffect(() => {
    if (!isTV) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.stopPropagation(); e.preventDefault(); setTvBtnIdx(i => Math.min(i + 1, BTN_COUNT - 1)); }
      if (e.key === "ArrowLeft")  { e.stopPropagation(); e.preventDefault(); setTvBtnIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Escape" || e.key === "Backspace") { e.stopPropagation(); navigate(-1); }
      if (e.key === "Enter" || e.key === " ") {
        e.stopPropagation(); e.preventDefault();
        (document.querySelector(`[data-tv-btn="${tvBtnIdx}"]`) as HTMLElement)?.click();
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [isTV, tvBtnIdx, navigate]);

  const btnCls = (idx: number, base: string) =>
    `${base} ${isTV && tvBtnIdx === idx ? "ring-2 ring-accent scale-105 shadow-[0_0_20px_hsla(346,90%,56%,0.5)]" : ""}`;

  useEffect(() => {
    if (detail) {
      document.title = `${getTitle(detail)} | Apple Stream`;
    }
    return () => { document.title = "Apple Stream"; };
  }, [detail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-meta">Show not found</p>
      </div>
    );
  }

  const mainTrailer = trailers[0];
  const backdrop = img(detail.backdrop_path, "w1280");

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="" onAuthClick={() => {}} onSearchClick={() => {}} />

      {/* Hero */}
      <div className="relative min-h-[70vh] flex items-end">
        {backdrop && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
          </div>
        )}

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-12 pb-12">
          <div className="max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-meta hover:text-foreground transition-colors text-sm mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-3 tracking-tight">
            {getTitle(detail)}
          </h1>

          <div className="flex items-center gap-4 text-sm text-meta mb-4 flex-wrap">
            {detail.first_air_date && <span>{detail.first_air_date.slice(0, 4)}</span>}
            {detail.number_of_seasons && (
              <span>{detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? "s" : ""}</span>
            )}
            <span className="flex items-center gap-1 text-yellow-400">
              <Star size={13} fill="currentColor" />
              {detail.vote_average?.toFixed(1)}
            </span>
            {detail.genres?.map(g => (
              <span key={g.id} className="glass rounded-full px-2.5 py-0.5 text-xs text-foreground/70">{g.name}</span>
            ))}
          </div>

          {detail.tagline && (
            <p className="text-meta italic text-sm mb-3">"{detail.tagline}"</p>
          )}

          <p className="text-foreground/70 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
            {detail.overview}
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              data-tv-btn="0"
              onClick={() => setPlayer({ id: tvId, type: "tv", season: 1, episode: 1 })}
              className={btnCls(0, "flex items-center gap-2 bg-accent text-white px-8 py-3.5 rounded-full font-semibold hover:bg-accent/90 transition-all accent-glow outline-none")}
            >
              <Play size={18} fill="currentColor" />
              Play S1 E1
            </button>

            {mainTrailer && !showTrailer && (
              <button
                data-tv-btn="1"
                onClick={() => setShowTrailer(true)}
                className={btnCls(1, "flex items-center gap-2 glass text-foreground px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all outline-none")}
              >
                <Film size={16} />
                Trailer
              </button>
            )}

            <button
              data-tv-btn="2"
              onClick={() => {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                navigate(`/watch-party/${roomId}?id=${tvId}&type=tv&season=1&episode=1`);
              }}
              className={btnCls(2, "flex items-center gap-2 glass text-foreground px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all outline-none")}
            >
              <Users size={16} />
              Watch Party
            </button>

            <button
              data-tv-btn="3"
              onClick={() => {
                if (isInWatchlist(tvId)) {
                  removeFromWatchlist(tvId);
                } else {
                  addToWatchlist({
                    tmdb_id: tvId,
                    media_type: "tv",
                    title: getTitle(detail),
                    poster_path: detail.poster_path,
                    backdrop_path: detail.backdrop_path,
                  });
                }
              }}
              className={btnCls(3, `flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold transition-all border outline-none ${
                isInWatchlist(tvId)
                  ? "bg-green-500/10 border-green-500/30 text-green-500"
                  : "glass text-foreground hover:bg-white/10 transition-all"
              }`)}
            >
              {isInWatchlist(tvId) ? <Check size={16} /> : <Plus size={16} />}
              {isInWatchlist(tvId) ? "In Watchlist" : "Add to Watchlist"}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Trailer modal */}
      {showTrailer && mainTrailer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${mainTrailer.key}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={mainTrailer.name}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Episodes */}
      <div className="px-6 sm:px-12 pb-20 max-w-[1400px] mx-auto">
        {detail.seasons && detail.seasons.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-foreground font-semibold text-lg">Episodes</h2>
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(Number(e.target.value))}
                  className="glass text-foreground text-sm px-4 py-2 pr-8 rounded-full appearance-none cursor-pointer focus:outline-none"
                >
                  {detail.seasons.filter(s => s.season_number > 0).map(s => (
                    <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-meta pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              {episodes.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => setPlayer({ id: tvId, type: "tv", season: selectedSeason, episode: ep.episode_number })}
                  className="w-full flex items-start gap-4 p-4 rounded-2xl glass glass-hover text-left group"
                >
                  <div className="flex-shrink-0 w-36 aspect-video rounded-xl overflow-hidden bg-surface">
                    {ep.still_path ? (
                      <img src={img(ep.still_path, "w500")!} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={20} className="text-meta opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-meta">Ep {ep.episode_number}</span>
                      {ep.runtime && <span className="text-xs text-meta">· {ep.runtime}m</span>}
                    </div>
                    <p className="text-sm text-foreground font-semibold mb-1 group-hover:text-accent transition-colors">
                      {ep.name}
                    </p>
                    <p className="text-xs text-meta line-clamp-2 leading-relaxed">{ep.overview}</p>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                      <Play size={14} className="text-accent" fill="currentColor" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Cast */}
        {detail.credits?.cast && detail.credits.cast.length > 0 && (
          <div className="mt-10">
            <h2 className="text-foreground font-semibold mb-4 text-lg">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {detail.credits.cast.slice(0, 8).map(actor => (
                <div key={actor.id} className="flex-shrink-0 text-center w-20">
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-surface">
                    {actor.profile_path ? (
                      <img
                        src={img(actor.profile_path, "w500")!}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-meta text-lg font-bold">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 font-medium leading-tight">{actor.name}</p>
                  <p className="text-[10px] text-meta truncate">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Content */}
      <div className="pb-20 max-w-6xl mx-auto">
        {(detail.recommendations?.results?.length ?? 0) > 0 && (
          <ContentShelf 
            title="More Like This" 
            items={detail.recommendations!.results} 
            onSelect={(item) => navigate(`/tv/${item.id}`)} 
          />
        )}
      </div>

    </div>
  );
};

export default TVPage;
