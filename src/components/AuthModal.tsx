import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-background/95 backdrop-blur-2xl" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4 glass-strong rounded-2xl p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-meta hover:text-foreground transition-colors">
              <X size={18} />
            </button>

            <h2 className="font-bold text-xl text-foreground mb-1 tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-meta text-sm mb-6">
              {mode === "login" ? "Sign in to continue" : "Join Watch by zuup"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent/50"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent/50"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent/50"
                required
                minLength={6}
              />

              {error && <p className="text-destructive text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 accent-glow"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-meta text-xs mt-5">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="text-accent hover:underline">
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
