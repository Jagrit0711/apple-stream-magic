import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";

const SITE_PASSWORD = "jagritsirgodfatherjagrit";
const STORAGE_KEY = "watch_site_unlocked";

const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setUnlocked(true);
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  if (loading) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-accent" />
        </div>
        <h1 className="font-bold text-2xl text-foreground mb-1 tracking-tight">Watch by zuup</h1>
        <p className="text-meta text-sm mb-8">Enter password to continue</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="Password"
              autoFocus
              className={`w-full bg-surface border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-meta focus:outline-none focus:ring-1 transition-all ${
                error ? "border-destructive ring-destructive/40" : "border-border focus:ring-accent/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-meta hover:text-foreground p-1 touch-manipulation"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-xs"
            >
              Wrong password
            </motion.p>
          )}
          <button
            type="submit"
            className="w-full bg-accent text-accent-foreground py-3.5 rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all touch-manipulation"
          >
            Unlock
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordGate;
