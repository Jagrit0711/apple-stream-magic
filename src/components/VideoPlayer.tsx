import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface VideoPlayerProps {
  contentId: number | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  onClose: () => void;
}

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose();
  }, [onClose]);

  if (!contentId) return null;

  // Route through Vercel Edge Function proxy instead of directly to player.videasy.net
  // This lets us apply sandbox attribute without Videasy detecting it
  let src = `/api/proxy/${type}/${contentId}`;
  if (type === "tv" && season && episode) {
    src += `/${season}/${episode}`;
  }
  src += "?color=E11D48&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true";

  return (
    <AnimatePresence>
      {contentId && (
        <motion.div
          className="fixed inset-0 z-[70] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={handleClose}
            className="absolute z-[90] flex items-center gap-1 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white/90 active:scale-95 transition-all touch-manipulation"
            style={{
              top: "calc(env(safe-area-inset-top, 8px) + 4px)",
              left: "calc(env(safe-area-inset-left, 8px) + 4px)",
            }}
          >
            <ChevronLeft size={20} />
            <span className="text-xs font-medium sm:text-sm">Back</span>
          </button>

          <iframe
            ref={iframeRef}
            src={src}
            className="w-full h-full border-0"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            allowFullScreen
            allow="encrypted-media; fullscreen; autoplay"
            // allow-popups is intentionally missing — this is what kills the ad redirect
            // Works without Videasy detecting it because src is now our own domain (/api/proxy/...)
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-orientation-lock allow-fullscreen"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
