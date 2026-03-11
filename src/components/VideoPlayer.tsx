import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { initAdBlocker } from "@/lib/adBlocker";

interface VideoPlayerProps {
  contentId: number | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  onClose: () => void;
}

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // Track whether the iframe has been "activated" by a real user click
  const [activated, setActivated] = useState(false);
  const lastBlurTime = useRef<number>(0);

  // Re-enforce ad blocker whenever player opens
  useEffect(() => {
    if (!contentId) return;
    initAdBlocker();
    setActivated(false); // reset activation on new content
  }, [contentId]);

  // Tab-under / new tab detection:
  // When the iframe opens a new tab, the parent window loses focus then regains it.
  // We detect this and immediately close any new tabs that were opened.
  useEffect(() => {
    if (!contentId) return;

    const handleBlur = () => {
      lastBlurTime.current = Date.now();
    };

    const handleFocus = () => {
      const elapsed = Date.now() - lastBlurTime.current;
      // If focus was lost for less than 2 seconds, a tab was likely opened and we came back
      if (elapsed < 2000 && elapsed > 50) {
        // Try to close the rogue tab - works if it was opened via window.open
        // For links opened as new tabs, we can't close them but we prevent future ones
        console.warn("[AdBlock] New tab / focus theft detected, elapsed:", elapsed);
        // Force focus back
        window.focus();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [contentId]);

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

  // The core fix: transparent overlay sits on top of iframe.
  // On FIRST click: we absorb it (preventing the ad click-through), activate the player.
  // After activation: overlay has pointer-events:none so the real player is usable.
  // On window blur after activation: we know a rogue tab opened — re-show the overlay
  // so the NEXT click is also absorbed.
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivated(true);
    // Focus the iframe for keyboard controls
    iframeRef.current?.focus();
  }, []);

  // When window blurs (tab opened), reset protection
  useEffect(() => {
    if (!activated || !contentId) return;

    const handleBlurReset = () => {
      // Small delay to distinguish normal blur from tab-opening
      setTimeout(() => {
        // If we're still on the page (not navigated away), re-arm the overlay
        setActivated(false);
      }, 100);
    };

    window.addEventListener("blur", handleBlurReset);
    return () => window.removeEventListener("blur", handleBlurReset);
  }, [activated, contentId]);

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
          className="fixed inset-0 z-[70] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back button — always above everything */}
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

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src={src}
            className="w-full h-full border-0"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            allowFullScreen
            allow="encrypted-media; fullscreen; autoplay"
          />

          {/* 
            AD SHIELD OVERLAY
            - When NOT activated: covers the entire iframe, intercepts the first click
              (which would've triggered the ad redirect), then removes itself.
            - When activated: pointer-events:none — invisible, player works normally.
            - When window blurs (ad tab opened): re-arms automatically.
            
            The "Click to Play" prompt lets users know why their first click didn't play.
          */}
          <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="absolute inset-0 z-[80] flex flex-col items-center justify-center transition-opacity duration-200"
            style={{
              // When activated: fully transparent and non-interactive
              pointerEvents: activated ? "none" : "all",
              opacity: activated ? 0 : 1,
              // Completely invisible - just blocking clicks, no visual
              background: "transparent",
            }}
          >
            {/* Only show prompt before first activation */}
            {!activated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex flex-col items-center gap-3 pointer-events-none"
                style={{
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(16px)",
                  borderRadius: "20px",
                  padding: "24px 32px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: "hsl(346 90% 56%)",
                    boxShadow: "0 0 30px hsl(346 90% 56% / 0.4)",
                  }}
                >
                  {/* Play icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-white font-semibold text-sm">Tap to Play</p>
                <p className="text-white/40 text-xs text-center max-w-[180px]">
                  Ad shield active
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
