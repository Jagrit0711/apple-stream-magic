import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

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
      }, 3000);
    };

    window.addEventListener("mousemove", showControls);
    window.addEventListener("touchstart", showControls);
    showControls(); // Initial trigger

    return () => {
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("touchstart", showControls);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose();
  }, [onClose]);

  if (!contentId) return null;

  let src = `https://player.videasy.net/${type}/${contentId}`;
  if (type === "tv" && season && episode) {
    src += `/${season}/${episode}`;
  }
  src += "?color=E11D48&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true&autoplay=1";

  return (
    <AnimatePresence>
      {contentId && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-sans"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Loading state before iframe fully renders */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-0">
              <Loader2 size={48} className="animate-spin text-[#E11D48]" />
              <p className="text-white/50 text-sm font-medium tracking-widest uppercase">Loading stream...</p>
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
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/50 backdrop-blur-xl text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all outline-none border border-white/10"
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-semibold tracking-wide">Back</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Iframe player - intentionally NO sandbox attribute */}
          <iframe
            ref={iframeRef}
            src={src}
            onLoad={() => setIsIframeLoaded(true)}
            className={`w-full h-full border-0 relative z-[90] transition-opacity duration-700 ${isIframeLoaded ? "opacity-100" : "opacity-0"}`}
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
