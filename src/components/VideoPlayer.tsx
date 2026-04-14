import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Play, X, Tv2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail, fetchTVDetail, fetchTVSeasonEpisodes, img } from "@/lib/tmdb";

interface VideoPlayerProps {
  contentId: number | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  resumeSeconds?: number;
  onClose: () => void;
}

// Detect if the user is likely on a TV (coarse pointer = remote/touch, no fine mouse)
const isTVDevice = () =>
  window.matchMedia("(pointer: coarse)").matches &&
  !("ontouchstart" in window) ||
  navigator.userAgent.toLowerCase().includes("tv") ||
  navigator.userAgent.toLowerCase().includes("smart-tv");

const VideoPlayer = ({ contentId, type, season, episode, resumeSeconds, onClose }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isTV, setIsTV] = useState(false);
  const [showEpPicker, setShowEpPicker] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [playingSeason, setPlayingSeason] = useState(season ?? 1);
  const [playingEpisode, setPlayingEpisode] = useState(episode ?? 1);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // TV detection — also triggers when user uses arrow keys (TV remote)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"].includes(e.key)) {
        setIsTV(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    if (isTVDevice()) setIsTV(true);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    if (!contentId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [contentId]);

  // Hide controls after inactivity
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!showEpPicker) setControlsVisible(false);
    }, isTV ? 8000 : 5000);
  }, [showEpPicker, isTV]);

  useEffect(() => {
    window.addEventListener("mousemove", showControls);
    window.addEventListener("touchstart", showControls);
    window.addEventListener("mousedown", showControls);
    window.addEventListener("click", showControls);
    window.addEventListener("keydown", showControls);
    showControls();
    return () => {
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("touchstart", showControls);
      window.removeEventListener("mousedown", showControls);
      window.removeEventListener("click", showControls);
      window.removeEventListener("keydown", showControls);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showControls]);

  // TV remote keyboard navigation
  useEffect(() => {
    if (!isTV) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
        if (showEpPicker) { setShowEpPicker(false); return; }
        onClose();
      }
      if (e.key === "ArrowUp" && type === "tv") {
        e.preventDefault();
        setShowEpPicker(true);
      }
      if (e.key === "ArrowDown" && showEpPicker) {
        e.preventDefault();
        setShowEpPicker(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isTV, showEpPicker, onClose, type]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose();
  }, [onClose]);

  // Fetch data
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

  const allSeasons = (detail as any)?.seasons?.filter((s: any) => s.season_number > 0) ?? [];

  // Auto next-episode countdown
  useEffect(() => {
    setShowCountdown(false);
    setCountdown(10);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (type === "tv" && playingSeason && playingEpisode && episodes && detail) {
      const currentEp = episodes.find(e => e.episode_number === playingEpisode);
      const runtime = currentEp?.runtime || (detail as any).episode_run_time?.[0] || 45;
      const creditsTime = Math.max((runtime * 60 * 1000) - 45000, 10000);

      const timer = setTimeout(() => {
        const hasNext = episodes.some(e => e.episode_number === playingEpisode + 1);
        if (hasNext || allSeasons.some((s: any) => s.season_number === playingSeason + 1)) {
          setShowCountdown(true);
        }
      }, creditsTime);

      const handleMessage = (e: MessageEvent) => {
        try {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (data?.data?.event === "ended" || data?.event === "ended") {
            const hasNext = episodes.some(ep => ep.episode_number === playingEpisode + 1);
            if (hasNext) setShowCountdown(true);
          }
        } catch {}
      };
      window.addEventListener("message", handleMessage);
      return () => { clearTimeout(timer); window.removeEventListener("message", handleMessage); };
    }
  }, [playingSeason, playingEpisode, episodes, type, detail]);

  useEffect(() => {
    if (showCountdown) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { handleNextEpisode(); return 10; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [showCountdown]);

  const handleNextEpisode = useCallback(() => {
    if (!episodes || !detail) return;
    setShowCountdown(false);
    setCountdown(10);
    setIsIframeLoaded(false);
    const hasNextInSeason = episodes.some(e => e.episode_number === playingEpisode! + 1);
    if (hasNextInSeason) {
      setPlayingEpisode(prev => prev + 1);
    } else {
      const nextSeason = allSeasons.find((s: any) => s.season_number === playingSeason + 1);
      if (nextSeason) { setPlayingSeason(prev => prev + 1); setPlayingEpisode(1); }
    }
  }, [episodes, detail, playingSeason, playingEpisode, allSeasons]);

  if (!contentId) return null;

  let src = `https://www.vidking.net/embed/${type}/${contentId}`;
  if (type === "tv" && playingSeason && playingEpisode) {
    src += `/${playingSeason}/${playingEpisode}`;
  }
  src += "?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true";
  const resumeAt = Math.max(0, Math.floor(resumeSeconds ?? 0));
  if (resumeAt > 0) {
    // Best-effort support for different player query conventions.
    src += `&startAt=${resumeAt}&start=${resumeAt}&t=${resumeAt}`;
  }

  const title = (detail as any)?.title || (detail as any)?.name || "";

  return (
    <AnimatePresence>
      {contentId && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center landscape:items-stretch landscape:justify-start font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Ambient Theater Glow */}
          {detail?.backdrop_path && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-50">
              <img
                src={img(detail.backdrop_path, "w1280")!}
                alt="ambient"
                className="w-[120%] h-[120%] object-cover blur-[80px] saturate-[2] mix-blend-screen"
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}

          {/* Loading Spinner */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-[95]">
              <div className="relative">
                <Loader2 size={56} className="animate-spin text-[#e50914]" />
                <div className="absolute inset-0 blur-2xl bg-[#e50914]/30 rounded-full" />
              </div>
              <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Loading stream...</p>
              {title && <p className="text-white/30 text-xs">{title}{type === "tv" ? ` · S${playingSeason} E${playingEpisode}` : ""}</p>}
            </div>
          )}

          {/* ── TOP BAR ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {controlsVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="absolute top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none"
                style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
              >
                <div className="flex items-center justify-between px-4 md:px-8 py-4 pointer-events-auto">
                  {/* Close / Back */}
                  <button
                    id="player-close-btn"
                    onClick={handleClose}
                    autoFocus={isTV}
                    className={`
                      flex items-center gap-3 rounded-full text-white transition-all outline-none
                      ${isTV
                        ? "px-8 py-4 text-xl font-bold bg-white/10 border-2 border-white/30 focus:border-[#e50914] focus:bg-[#e50914]/20 focus:scale-105 focus:shadow-[0_0_30px_rgba(229,9,20,0.5)]"
                        : "px-5 py-2.5 text-sm font-bold bg-black/60 backdrop-blur-2xl border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95"}
                    `}
                    style={isTV ? undefined : { WebkitBackdropFilter: "blur(40px)" }}
                  >
                    <ArrowLeft size={isTV ? 28 : 20} className="transition-transform group-hover:-translate-x-1" />
                    <span>{isTV ? "Back" : "Close Player"}</span>
                  </button>

                  {/* Title + TV Mode badge */}
                  <div className="flex items-center gap-3">
                    {title && (
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-white font-bold text-sm md:text-base leading-tight">{title}</span>
                        {type === "tv" && (
                          <span className="text-white/50 text-xs">Season {playingSeason} · Episode {playingEpisode}</span>
                        )}
                      </div>
                    )}
                    {isTV && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e50914]/20 border border-[#e50914]/40">
                        <Tv2 size={14} className="text-[#e50914]" />
                        <span className="text-[#e50914] text-xs font-bold tracking-wide">TV MODE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TV remote hint bar */}
                {isTV && type === "tv" && (
                  <div className="flex items-center justify-center gap-6 pb-3 text-white/40 text-xs">
                    <span className="flex items-center gap-1.5"><ChevronUp size={14} /> Episodes</span>
                    <span className="flex items-center gap-1.5">ESC <ArrowLeft size={12} /> Back</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── EPISODE PICKER (TV / Keyboard) ─────────────────────── */}
          <AnimatePresence>
            {showEpPicker && type === "tv" && (
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[120] bg-gradient-to-t from-black via-black/95 to-transparent pt-16 pb-6 px-4 md:px-10"
              >
                {/* Season tabs */}
                {allSeasons.length > 1 && (
                  <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-2 scrollbar-none">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest shrink-0">Season</span>
                    {allSeasons.map((s: any) => (
                      <button
                        key={s.season_number}
                        onClick={() => { setPlayingSeason(s.season_number); setPlayingEpisode(1); setIsIframeLoaded(false); }}
                        className={`
                          shrink-0 px-5 py-2 rounded-full font-bold text-sm transition-all outline-none
                          ${isTV ? "focus:scale-110 focus:shadow-[0_0_20px_rgba(229,9,20,0.6)]" : ""}
                          ${playingSeason === s.season_number
                            ? "bg-[#e50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.5)]"
                            : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/10"}
                        `}
                      >
                        S{s.season_number}
                      </button>
                    ))}
                  </div>
                )}

                {/* Episode grid */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                  {episodes?.map(ep => {
                    const isPlaying = ep.episode_number === playingEpisode;
                    return (
                      <button
                        key={ep.episode_number}
                        onClick={() => { setPlayingEpisode(ep.episode_number); setIsIframeLoaded(false); setShowEpPicker(false); }}
                        autoFocus={isPlaying && isTV}
                        className={`
                          shrink-0 snap-start flex flex-col items-start text-left rounded-2xl overflow-hidden transition-all outline-none
                          ${isTV
                            ? `w-52 focus:scale-105 focus:shadow-[0_0_30px_rgba(229,9,20,0.7)] focus:ring-2 focus:ring-[#e50914]`
                            : `w-40 hover:scale-105`}
                          ${isPlaying
                            ? "ring-2 ring-[#e50914] shadow-[0_0_25px_rgba(229,9,20,0.5)]"
                            : "opacity-70 hover:opacity-100"}
                        `}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-video bg-white/5">
                          {ep.still_path
                            ? <img src={img(ep.still_path, "w500")!} alt={ep.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white/20">
                                <Play size={24} fill="currentColor" />
                              </div>
                          }
                          {isPlaying && (
                            <div className="absolute inset-0 bg-[#e50914]/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg">
                                <Play size={14} fill="white" className="text-white ml-0.5" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white/80 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            E{ep.episode_number}
                          </div>
                        </div>
                        {/* Episode info */}
                        <div className={`w-full px-3 py-2 bg-black/60 ${isPlaying ? "bg-[#e50914]/10" : ""}`}>
                          <p className="text-white text-xs font-bold truncate leading-tight">{ep.name}</p>
                          {ep.runtime && <p className="text-white/40 text-[10px] mt-0.5">{ep.runtime}m</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dismiss hint */}
                <div className="flex items-center justify-center mt-4 gap-2 text-white/30 text-xs">
                  {isTV
                    ? <><ChevronDown size={14} /> Press Down to close</>
                    : <><X size={12} /> Click outside to close</>
                  }
                </div>

                {/* Click-outside dismiss for mouse */}
                {!isTV && (
                  <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setShowEpPicker(false)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BOTTOM BAR (TV: episode picker trigger) ─────────────── */}
          <AnimatePresence>
            {controlsVisible && type === "tv" && !showEpPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-0 left-0 right-0 z-[110] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <div className="flex items-center justify-between px-4 md:px-8 py-4 pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <button
                      id="ep-picker-btn"
                      onClick={() => setShowEpPicker(true)}
                      className={`
                        flex items-center gap-2 rounded-full font-bold transition-all outline-none
                        ${isTV
                          ? "px-8 py-4 text-base bg-white/10 border-2 border-white/30 text-white focus:border-[#e50914] focus:bg-[#e50914]/20 focus:scale-105 focus:shadow-[0_0_30px_rgba(229,9,20,0.5)]"
                          : "px-4 py-2 text-sm bg-black/60 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20"}
                      `}
                    >
                      <ChevronUp size={isTV ? 22 : 16} />
                      <span>Episodes</span>
                    </button>

                    <div className="text-white/40 text-sm">
                      S{playingSeason} · E{playingEpisode}
                      {episodes?.find(e => e.episode_number === playingEpisode)?.name && (
                        <span className="text-white/60 ml-2 hidden sm:inline">
                          {episodes.find(e => e.episode_number === playingEpisode)?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Next episode button */}
                  {episodes?.some(e => e.episode_number === playingEpisode + 1) && (
                    <button
                      onClick={handleNextEpisode}
                      className={`
                        flex items-center gap-2 rounded-full font-bold transition-all outline-none
                        ${isTV
                          ? "px-8 py-4 text-base bg-[#e50914] text-white focus:scale-110 focus:shadow-[0_0_30px_rgba(229,9,20,0.8)]"
                          : "px-4 py-2 text-sm bg-[#e50914] text-white hover:bg-[#e50914]/80"}
                      `}
                    >
                      <span>Next</span>
                      <ChevronRight size={isTV ? 22 : 16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── NEXT EPISODE COUNTDOWN ───────────────────────────────── */}
          <AnimatePresence>
            {showCountdown && type === "tv" && (
              <motion.div
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className={`
                  absolute z-[120] overflow-hidden
                  ${isTV
                    ? "bottom-28 right-10 w-96 rounded-3xl border-2 border-white/20 bg-black/90 backdrop-blur-3xl p-7 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
                    : "bottom-20 right-6 md:bottom-28 md:right-14 w-72 md:w-80 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl p-5 shadow-2xl"}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#e50914]/10 to-transparent pointer-events-none" />

                <button
                  onClick={() => setShowCountdown(false)}
                  className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>

                <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">Up Next</p>
                <p className="text-white font-bold text-lg leading-snug mb-4 pr-6">
                  Episode {playingEpisode + 1}
                  {episodes?.find(e => e.episode_number === playingEpisode + 1)?.name && (
                    <span className="block text-sm text-white/50 font-normal mt-0.5 truncate">
                      {episodes.find(e => e.episode_number === playingEpisode + 1)?.name}
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    autoFocus={isTV}
                    onClick={handleNextEpisode}
                    className={`
                      flex-1 bg-[#e50914] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all outline-none
                      ${isTV
                        ? "py-4 text-base focus:scale-105 focus:shadow-[0_0_30px_rgba(229,9,20,0.7)]"
                        : "py-2.5 text-sm hover:bg-[#e50914]/80 active:scale-95"}
                    `}
                  >
                    <Play size={isTV ? 20 : 16} fill="currentColor" />
                    Play Now
                  </button>

                  {/* Countdown ring */}
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="19" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                      <circle
                        cx="22" cy="22" r="19"
                        stroke="#e50914"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="119.4"
                        strokeDashoffset={119.4 - (countdown / 10) * 119.4}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                      {countdown}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── IFRAME PLAYER ───────────────────────────────────────── */}
          <iframe
            ref={iframeRef}
            src={src}
            key={src}
            onLoad={() => setIsIframeLoaded(true)}
            className={`
              w-[96vw] h-[54vw] max-h-[88dvh]
              landscape:w-screen landscape:h-[100dvh] landscape:max-h-[100dvh]
              md:w-full md:h-full
              rounded-2xl landscape:rounded-none md:rounded-none
              border border-white/10 landscape:border-0 md:border-0
              relative z-[90]
              transition-opacity duration-700
              shadow-2xl landscape:shadow-none md:shadow-none
              ${isIframeLoaded ? "opacity-100" : "opacity-0"}
            `}
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
