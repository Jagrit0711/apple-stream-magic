import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { MOVIE_GENRES } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";

const Onboarding = () => {
  const { profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  if (!profile || profile.onboarding_complete) return null;

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    completeOnboarding(selectedGenres);
  };

  const steps = [
    {
      title: "Welcome to Watch by zuup",
      subtitle: "Your personal streaming universe. Discover movies, TV shows, and anime all in one place.",
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="font-display font-bold text-4xl text-accent">W</span>
          </div>
          <p className="font-body text-meta text-center max-w-md">
            We'll personalize your experience based on your preferences. Let's get started!
          </p>
        </div>
      ),
    },
    {
      title: "What do you love to watch?",
      subtitle: "Pick your favorite genres so we can recommend content you'll enjoy.",
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {MOVIE_GENRES.map(genre => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`px-4 py-3 rounded-lg font-body text-sm transition-all border ${
                selectedGenres.includes(genre.id)
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-surface text-foreground border-border hover:border-accent/50"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {selectedGenres.includes(genre.id) && <Check size={14} />}
                {genre.name}
              </span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "You're all set!",
      subtitle: "Enjoy unlimited movies, shows, and anime. Your personalized feed is ready.",
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
            <Check size={40} className="text-accent" />
          </div>
          <p className="font-body text-meta text-center max-w-md">
            We've set up your recommendations. Start exploring now!
          </p>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[90] bg-background flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-2xl mx-4 text-center">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/60" : "w-4 bg-surface"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
              {steps[step].title}
            </h1>
            <p className="font-body text-meta text-base mb-8">{steps[step].subtitle}</p>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-center gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-lg font-display font-medium text-sm text-meta hover:text-foreground transition-colors"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground rounded-lg font-display font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              {step === 0 ? "Get Started" : "Continue"}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground rounded-lg font-display font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              Start Watching
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {step === 0 && (
          <button
            onClick={handleFinish}
            className="mt-4 text-meta text-sm font-body hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Onboarding;
