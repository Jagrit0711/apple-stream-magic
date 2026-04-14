import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { MOVIE_GENRES } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";

const Onboarding = () => {
  const { profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!profile || profile.onboarding_complete) return null;

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleFinish = async () => {
    if (saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      await completeOnboarding(selectedGenres);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save onboarding");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: "Welcome to Watch",
      subtitle: "Stream unlimited movies, TV shows, and anime. All in one place.",
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center">
            <Sparkles size={32} className="text-accent" />
          </div>
        </div>
      ),
    },
    {
      title: "Pick your favorites",
      subtitle: "We'll personalize your recommendations based on what you love.",
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto">
          {MOVIE_GENRES.map(genre => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                selectedGenres.includes(genre.id)
                  ? "bg-accent text-accent-foreground accent-glow"
                  : "glass glass-hover text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {selectedGenres.includes(genre.id) && <Check size={12} />}
                {genre.name}
              </span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "You're all set",
      subtitle: "Your personalized feed is ready. Start watching now.",
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center">
            <Check size={32} className="text-accent" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[90] bg-background flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-xl mx-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
              i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/50" : "w-4 bg-[hsla(0,0%,100%,0.08)]"
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <h1 className="font-bold text-3xl md:text-4xl text-foreground mb-2 tracking-tight">{steps[step].title}</h1>
            <p className="text-meta text-sm mb-8">{steps[step].subtitle}</p>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-center gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-full text-sm text-meta hover:text-foreground transition-colors">Back</button>
          )}
          <button
            onClick={step < steps.length - 1 ? () => setStep(step + 1) : () => { void handleFinish(); }}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground rounded-full font-semibold text-sm hover:bg-accent/90 transition-all accent-glow"
          >
            {saving ? "Saving..." : step === 0 ? "Get Started" : step < steps.length - 1 ? "Continue" : "Start Watching"}
            <ChevronRight size={14} />
          </button>
        </div>

        {step === 0 && (
          <button onClick={() => { void handleFinish(); }} disabled={saving} className="mt-4 text-meta text-xs hover:text-foreground transition-colors">Skip</button>
        )}
        {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
      </div>
    </motion.div>
  );
};

export default Onboarding;
