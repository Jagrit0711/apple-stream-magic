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

const ALLOWED_DOMAIN = "zuup.dev";

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Block external redirects - intercept any navigation away from zuup.dev
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if we're being navigated away
      e.preventDefault();
    };

    // Intercept clicks that might navigate away
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.href;
        if (href) {
          try {
            const url = new URL(href);
            if (!url.hostname.endsWith(ALLOWED_DOMAIN) && url.hostname !== ALLOWED_DOMAIN) {
              e.preventDefault();
              e.stopPropagation();
              console.warn("Blocked external navigation to:", href);
              return false;
            }
          } catch {}
        }
      }
    };

    // Block window.open calls to external domains
    const originalOpen = window.open;
    window.open = (url?: string | URL, ...args: any[]) => {
      if (url) {
        try {
          const parsed = new URL(url.toString(), window.location.href);
          if (!parsed.hostname.endsWith(ALLOWED_DOMAIN) && parsed.hostname !== ALLOWED_DOMAIN) {
            console.warn("Blocked window.open to:", url);
            return null;
          }
        } catch {}
      }
      return originalOpen(url, ...args);
    };

    // Block location.href assignments to external domains via MutationObserver on iframes
    const handleMessage = (event: MessageEvent) => {
      // Block messages trying to navigate parent
      if (event.data && typeof event.data === "object") {
        if (event.data.type === "navigate" || event.data.action === "redirect") {
          const url = event.data.url || event.data.href;
          if (url) {
            try {
              const parsed = new URL(url, window.location.href);
              if (!parsed.hostname.endsWith(ALLOWED_DOMAIN) && parsed.hostname !== ALLOWED_DOMAIN) {
                console.warn("Blocked redirect message to:", url);
                return;
              }
            } catch {}
          }
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleMessage);
      window.open = originalOpen;
    };
  }, []);

  // Lock orientation to landscape on mobile when playing
  useEffect(() => {
    if (!contentId) return;
    const lockOrientation = async () => {
      try {
        await (screen.orientation as any)?.lock?.("landscape");
      } catch {}
    };
    lockOrientation();
    return () => {
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {}
    };
  }, [contentId]);

  // Prevent body scroll
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
          {/* Back button - always visible, Netflix-style */}
          <button
            onClick={handleClose}
            className="absolute top-3 left-3 z-[80] flex items-center gap-1 px-3 py-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground/90 active:scale-95 transition-all touch-manipulation"
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
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            allowFullScreen
            allow="encrypted-media; fullscreen; autoplay"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-fullscreen"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
