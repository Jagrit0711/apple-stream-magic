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

const ALLOWED_DOMAINS = ["zuup.dev", "player.videasy.net", "videasy.net", "localhost"];

const isAllowed = (url: string) => {
  try {
    const parsed = new URL(url, window.location.href);
    // Allow relative URLs and same origin
    if (parsed.origin === window.location.origin) return true;
    return ALLOWED_DOMAINS.some(
      d => parsed.hostname === d || parsed.hostname.endsWith("." + d)
    );
  } catch {
    return true;
  }
};

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Smart redirect/popup blocking - no sandbox needed
  useEffect(() => {
    // 1. Override window.open to kill external popups from ads/players
    const originalOpen = window.open.bind(window);
    window.open = (url?: string | URL, target?: string, features?: string) => {
      if (url && !isAllowed(url.toString())) {
        console.warn("[Watch] Blocked popup:", url);
        return null;
      }
      return originalOpen(url, target, features);
    };

    // 2. Block anchor clicks navigating to external domains
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.href || anchor.getAttribute("href") || "";
      if (href && !isAllowed(href)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.warn("[Watch] Blocked link navigation:", href);
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  // Lock orientation to landscape on mobile
  useEffect(() => {
    if (!contentId) return;
    const lock = async () => {
      try { await (screen.orientation as any)?.lock?.("landscape"); } catch {}
    };
    lock();
    return () => {
      try { (screen.orientation as any)?.unlock?.(); } catch {}
    };
  }, [contentId]);

  // Prevent body scroll while player is open
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

  let src = `https://player.videasy.net/${type}/${contentId}`;
  if (type === "tv" && season && episode) {
    src += `/${season}/${episode}`;
  }
  src += "?color=E11D48&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true";

  return (
    <AnimatePresence>
      {contentId && (
        <motion.div
          className="fixed inset-0 z-[70] bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back button */}
          <button
            onClick={handleClose}
            className="absolute z-[80] flex items-center gap-1 px-3 py-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground/90 active:scale-95 transition-all touch-manipulation"
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
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
