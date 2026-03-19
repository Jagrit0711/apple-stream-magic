import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Play, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail, fetchTVDetail, fetchTVSeasonEpisodes, img } from "@/lib/tmdb";

interface VideoPlayerProps {
  contentId: number | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  onClose: () => void;
}

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!contentId) return;
    const lock = async () => {
      try { await (screen.orientation as any)?.lock?.("landscape"); } catch {}
    };
    lock();
    return () => { try { (screen.orientation as any)?.unlock?.(); } catch {} };
  }, [contentId]);

  useEffect(() => {
    if (!contentId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [contentId]);

  // Hide UI controls after a few seconds of inactivity
  useEffect(() => {
    const showControls = () => {
      setControlsVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 5000);
    };

    window.addEventListener("mousemove", showControls);
    window.addEventListener("touchstart", showControls);
    window.addEventListener("mousedown", showControls);
    window.addEventListener("click", showControls);
    window.addEventListener("keydown", showControls);
    showControls(); // Initial trigger

    return () => {
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("touchstart", showControls);
      window.removeEventListener("mousedown", showControls);
      window.removeEventListener("click", showControls);
      window.removeEventListener("keydown", showControls);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose();
  }, [onClose]);

  const [playingSeason, setPlayingSeason] = useState(season);
  const [playingEpisode, setPlayingEpisode] = useState(episode);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: detail } = useQuery({
    queryKey: ["detail", contentId, type],
    queryFn: () => type === "movie" ? fetchMovieDetail(contentId!) : fetchTVDetail(contentId!),
    enabled: !!contentId,
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", contentId, playingSeason],
    queryFn: () => fetchTVSeasonEpisodes(contentId!, playingSeason!),
    enabled: type === "tv" && !!contentId && !!playingSeason,
  });

  useEffect(() => {
    // Reset countdown state when episode changes
    setShowCountdown(false);
    setCountdown(10);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (type === "tv" && playingSeason && playingEpisode && episodes && detail) {
      const currentEp = episodes.find(e => e.episode_number === playingEpisode);
      const runtime = currentEp?.runtime || (detail as any).episode_run_time?.[0] || 45;
      
      // Show countdown 45 seconds before episode officially ends (credits)
      const creditsTime = Math.max((runtime * 60 * 1000) - 45000, 10000); 
      
      const timer = setTimeout(() => {
        const hasNext = episodes.some(e => e.episode_number === playingEpisode + 1);
        if (hasNext || (detail as any).seasons?.length > playingSeason) {
          setShowCountdown(true);
        }
      }, creditsTime);

      // We also listen to generic iframe messages just in case player posts an ended event
      const handleMessage = (e: MessageEvent) => {
        if (e.data?.event === "ended" || e.data?.type === "ended") {
          const hasNext = episodes.some(e => e.episode_number === playingEpisode! + 1);
          if (hasNext) setShowCountdown(true);
        }
      };
      window.addEventListener("message", handleMessage);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [playingSeason, playingEpisode, episodes, type, detail]);

  useEffect(() => {
    if (showCountdown) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleNextEpisode();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showCountdown]);

  const handleNextEpisode = useCallback(() => {
    if (!episodes || !detail) return;
    setShowCountdown(false);
    setCountdown(10);
    const hasNextInSeason = episodes.some(e => e.episode_number === playingEpisode! + 1);
    if (hasNextInSeason) {
      setPlayingEpisode(playingEpisode! + 1);
      setIsIframeLoaded(false);
    } else {
      const allSeasons = (detail as any).seasons || [];
      if (allSeasons.some((s: any) => s.season_number === playingSeason! + 1)) {
        setPlayingSeason(playingSeason! + 1);
        setPlayingEpisode(1);
        setIsIframeLoaded(false);
      }
    }
  }, [episodes, detail, playingSeason, playingEpisode]);

  if (!contentId) return null;

  let src = `https://www.vidking.net/embed/${type}/${contentId}`;
  if (type === "tv" && playingSeason && playingEpisode) {
    src += `/${playingSeason}/${playingEpisode}`;
  }
  src += "?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true";

  return (
    <AnimatePresence>
      {contentId && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Ambient Theater Edge Glow */}
          {detail?.backdrop_path && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-60">
              <img 
                src={img(detail.backdrop_path, "w1280")!} 
                alt="ambient" 
                className="w-[120%] h-[120%] object-cover blur-[100px] saturate-[2.5] mix-blend-screen scale-110"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}

          {/* Loading state before iframe fully renders */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[95]">
              <Loader2 size={48} className="animate-spin text-[#E11D48] relative z-10" />
              <p className="text-white/50 text-sm font-medium tracking-widest uppercase relative z-10">Loading stream...</p>
            </div>
          )}

          {/* Player controls overlay */}
          <AnimatePresence>
            {controlsVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-[110]"
              >
                <div 
                  className="absolute p-4 flex items-center gap-4 pointer-events-auto"
                  style={{
                    top: "calc(env(safe-area-inset-top, 0px))",
                    left: "calc(env(safe-area-inset-left, 0px))",
                  }}
                >
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-black/60 backdrop-blur-2xl text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all outline-none border border-white/20 shadow-2xl pointer-events-auto group"
                    style={{ WebkitBackdropFilter: "blur(40px)" }}
                  >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold tracking-tight">Close Player</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Episode UI */}
          <AnimatePresence>
            {showCountdown && type === "tv" && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-16 right-8 md:bottom-24 md:right-16 z-[120] glass-strong rounded-2xl p-5 w-72 md:w-80 shadow-2xl overflow-hidden border border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none" />
                <button 
                  onClick={() => setShowCountdown(false)} 
                  className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
                <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">Up Next</p>
                <p className="text-white font-bold text-base md:text-lg leading-tight mb-4 truncate">
                  Episode {playingEpisode! + 1}
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleNextEpisode}
                    className="flex-1 bg-white text-black hover:bg-white/90 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Play size={16} fill="currentColor" />
                    Play Now
                  </button>
                  <div className="w-10 h-10 rounded-full border-2 border-accent/30 flex items-center justify-center text-accent font-bold text-sm relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="2" fill="none" 
                        strokeDasharray="100" strokeDashoffset={100 - (countdown / 10) * 100} 
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    {countdown}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Iframe player - intentionally NO sandbox attribute */}
          <iframe
            ref={iframeRef}
            src={src}
            onLoad={() => setIsIframeLoaded(true)}
            className={`w-[95%] h-[90%] md:w-full md:h-full rounded-2xl md:rounded-none object-cover border border-white/10 md:border-0 relative z-[90] transition-opacity duration-700 shadow-2xl md:shadow-none ${isIframeLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            allowFullScreen
            allow="encrypted-media; fullscreen; autoplay"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
