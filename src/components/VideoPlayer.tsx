import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VideoPlayerProps {
  contentId: number | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  onClose: () => void;
}

const VideoPlayer = ({ contentId, type, season, episode, onClose }: VideoPlayerProps) => {
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
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[80] bg-surface/60 backdrop-blur-sm rounded-full p-2 text-meta hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
          <iframe
            src={src}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="encrypted-media"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayer;
