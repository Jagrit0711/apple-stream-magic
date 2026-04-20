import { useEffect, useRef, useCallback, useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Play, X, Tv2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail, fetchTVDetail, fetchTVSeasonEpisodes, img } from "@/lib/tmdb";
import { useWatchHistory } from "@/hooks/useWatchHistory";

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

const PLAYER_OPTIONS = [
  { key: "vidking", label: "Server 1" },
  { key: "videasy", label: "Server 2" },
];

const SITE_COLOR = "e50914"; // Your site accent color (hex, no #)

const VideoPlayer = ({ contentId, type, season, episode, resumeSeconds, onClose }: VideoPlayerProps) => {
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [showPlayerSelect, setShowPlayerSelect] = useState(true);
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
  const { trackWatch } = useWatchHistory();

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

  // Bootstrap a history row when playback starts or episode changes.
  useEffect(() => {
    if (!contentId || !detail) return;

    trackWatch(
      {
        id: contentId,
        title: (detail as any).title || "",
        name: (detail as any).name,
        overview: (detail as any).overview || "",
        poster_path: (detail as any).poster_path || null,
        backdrop_path: (detail as any).backdrop_path || null,
        release_date: (detail as any).release_date,
        first_air_date: (detail as any).first_air_date,
        vote_average: Number((detail as any).vote_average || 0),
        genre_ids: Array.isArray((detail as any).genres)
          ? (detail as any).genres.map((g: any) => Number(g.id)).filter((v: number) => !Number.isNaN(v))
          : [],
        media_type: type,
      },
      1,
      null,
      type === "tv" ? playingSeason : undefined,
      type === "tv" ? playingEpisode : undefined,
      resumeSeconds ?? null,
      null,
    );
  }, [contentId, detail, type, playingSeason, playingEpisode, resumeSeconds, trackWatch]);

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


  // Show player selection dialog if not chosen
  if (!contentId) return null;
  if (showPlayerSelect && contentId) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 items-center min-w-[320px]">
          <h2 className="text-white text-xl font-bold mb-2">Choose a Video Player</h2>
          <div className="flex flex-col gap-4 w-full">
            {PLAYER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className="w-full py-3 px-6 rounded-lg bg-[#e50914] text-white font-bold text-lg hover:bg-[#b0060f] transition-all focus:outline-none focus:ring-2 focus:ring-[#e50914]"
                onClick={() => { setSelectedPlayer(opt.key); setShowPlayerSelect(false); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            className="mt-4 text-white/60 hover:text-white text-xs underline"
            onClick={onClose}
          >Cancel</button>
        </div>
      </div>
    );
  }


  // Build iframe src based on selected player
  let src = "";
  if (selectedPlayer === "vidking") {
    src = `https://www.vidking.net/embed/${type}/${contentId}`;
    if (type === "tv" && playingSeason && playingEpisode) {
      src += `/${playingSeason}/${playingEpisode}`;
    }
    src += `?color=${SITE_COLOR}&autoPlay=true&nextEpisode=false&episodeSelector=false`;
    const resumeAt = Math.max(0, Math.floor(resumeSeconds ?? 0));
    if (resumeAt > 0) {
      src += `&startAt=${resumeAt}&start=${resumeAt}&t=${resumeAt}`;
    }
  } else if (selectedPlayer === "videasy") {
    // VIDEASY URL structure
    if (type === "movie") {
      src = `https://player.videasy.net/movie/${contentId}?color=${SITE_COLOR}`;
    } else if (type === "tv") {
      src = `https://player.videasy.net/tv/${contentId}/${playingSeason}/${playingEpisode}?color=${SITE_COLOR}`;
    }
    const resumeAt = Math.max(0, Math.floor(resumeSeconds ?? 0));
    if (resumeAt > 0) {
      src += `&progress=${resumeAt}`;
    }
  }

  const title = (detail as any)?.title || (detail as any)?.name || "";

  return (
    <AnimatePresence>
      {contentId && selectedPlayer && (
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


          {/* ── IFRAME PLAYER ───────────────────────────────────────── */}
          {selectedPlayer === "videasy" ? (
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
              referrerPolicy="no-referrer"
            />
          ) : (
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
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
              referrerPolicy="no-referrer"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
