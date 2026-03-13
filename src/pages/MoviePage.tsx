import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail, getTitle, img, fetchTrailers } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Play, ArrowLeft, Film, Users, Star, Clock } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import Header from "@/components/Header";

const MoviePage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const movieId = Number(id);
  const autoplay = searchParams.get("autoplay") === "1";
  const [player, setPlayer] = useState(autoplay);
  const [showTrailer, setShowTrailer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["detail", movieId, "movie"],
    queryFn: () => fetchMovieDetail(movieId),
    enabled: !!movieId,
  });

  const { data: trailers = [] } = useQuery({
    queryKey: ["trailers", movieId, "movie"],
    queryFn: () => fetchTrailers(movieId, "movie"),
    enabled: !!movieId,
  });

  useEffect(() => {
    if (detail) {
      document.title = `${getTitle(detail)} | Apple Stream`;
    }
    return () => { document.title = "Apple Stream"; };
  }, [detail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-meta">Movie not found</p>
      </div>
    );
  }

  const mainTrailer = trailers[0];
  const backdrop = img(detail.backdrop_path, "w1280");

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="" onAuthClick={() => {}} onSearchClick={() => setSearchOpen(true)} />

      {/* Hero */}
      <div className="relative min-h-[70vh] flex items-end">
        {backdrop && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
          </div>
        )}

        <div className="relative z-10 px-6 sm:px-12 pb-12 max-w-3xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-meta hover:text-foreground transition-colors text-sm mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-3 tracking-tight">
            {getTitle(detail)}
          </h1>

          <div className="flex items-center gap-4 text-sm text-meta mb-4 flex-wrap">
            {detail.release_date && <span>{detail.release_date.slice(0, 4)}</span>}
            {detail.runtime && (
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m
              </span>
            )}
            <span className="flex items-center gap-1 text-yellow-400">
              <Star size={13} fill="currentColor" />
              {detail.vote_average?.toFixed(1)}
            </span>
            {detail.genres?.map(g => (
              <span key={g.id} className="glass rounded-full px-2.5 py-0.5 text-xs text-foreground/70">{g.name}</span>
            ))}
          </div>

          {detail.tagline && (
            <p className="text-meta italic text-sm mb-3">"{detail.tagline}"</p>
          )}

          <p className="text-foreground/70 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
            {detail.overview}
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setPlayer(true)}
              className="flex items-center gap-2 bg-accent text-white px-8 py-3.5 rounded-full font-semibold hover:bg-accent/90 transition-all accent-glow"
            >
              <Play size={18} fill="currentColor" />
              Play Now
            </button>

            {mainTrailer && !showTrailer && (
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 glass text-foreground px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all"
              >
                <Film size={16} />
                Watch Trailer
              </button>
            )}

            <button
              onClick={() => {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                navigate(`/watch-party/${roomId}?id=${movieId}&type=movie`);
              }}
              className="flex items-center gap-2 glass text-foreground px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all"
            >
              <Users size={16} />
              Watch Party
            </button>
          </div>
        </div>
      </div>

      {/* Trailer modal */}
      {showTrailer && mainTrailer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${mainTrailer.key}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={mainTrailer.name}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Cast & Info */}
      <div className="px-6 sm:px-12 pb-20 max-w-4xl">
        {detail.credits?.cast && detail.credits.cast.length > 0 && (
          <div className="mb-8">
            <h2 className="text-foreground font-semibold mb-4 text-lg">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {detail.credits.cast.slice(0, 8).map(actor => (
                <div key={actor.id} className="flex-shrink-0 text-center w-20">
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-surface">
                    {actor.profile_path ? (
                      <img
                        src={img(actor.profile_path, "w500")!}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-meta text-lg font-bold">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 font-medium leading-tight">{actor.name}</p>
                  <p className="text-[10px] text-meta truncate">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {player && (
        <VideoPlayer contentId={movieId} type="movie" onClose={() => setPlayer(false)} />
      )}
    </div>
  );
};

export default MoviePage;
