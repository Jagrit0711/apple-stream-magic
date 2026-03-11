import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";

interface VideoPlayerProps {
  contentId: number | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  onClose: () => void;
}

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
  const [controlsVisible, setControlsVisible] = useState(true);

  if (!contentId) return null;

  let src = `https://player.videasy.net/${type}/${contentId}`;
  if (type === "tv" && season && episode) {
    src += `/${season}/${episode}`;
  }
  src += "?color=3B82F6&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true";

  return (
    <AnimatePresence>
      {contentId && (
        <motion.div
          className="fixed inset-0 z-[70] bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => setControlsVisible(v => !v)}
        >
          {/* Top bar with back button - safe area aware */}
          <AnimatePresence>
            {controlsVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 z-[80] bg-gradient-to-b from-background/80 to-transparent pb-8 pt-[env(safe-area-inset-top,12px)] px-[env(safe-area-inset-left,8px)]"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="flex items-center gap-1.5 ml-2 mt-2 p-2.5 rounded-full bg-surface/60 backdrop-blur-sm text-foreground/80 hover:text-foreground active:scale-95 transition-all touch-manipulation"
                >
                  <ChevronLeft size={22} />
                  <span className="text-sm font-medium pr-2 hidden sm:inline">Back</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button top-right for desktop */}
          <AnimatePresence>
            {controlsVisible && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-4 right-4 z-[80] p-3 rounded-full bg-surface/60 backdrop-blur-sm text-foreground/80 hover:text-foreground transition-all hidden sm:block"
                style={{ top: "calc(env(safe-area-inset-top, 12px) + 8px)", right: "calc(env(safe-area-inset-right, 8px) + 8px)" }}
              >
                <X size={22} />
              </motion.button>
            )}
          </AnimatePresence>

          <iframe
            src={src}
            className="w-full h-full"
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            frameBorder="0"
            allowFullScreen
            allow="encrypted-media; fullscreen"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
