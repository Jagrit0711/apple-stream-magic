import { useState, useEffect } from "react";
import { Search, User, LogOut, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavChange: (nav: string) => void;
  activeNav: string;
  onAuthClick: () => void;
  onSearchClick?: () => void;
}

const NAV_ITEMS = ["Home", "Movies", "TV Shows", "Anime"];

const Header = ({ onSearch, onNavChange, activeNav, onAuthClick, onSearchClick }: HeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 border-b border-[hsla(0,0%,100%,0.04)]"
          : "bg-gradient-to-b from-background via-background/60 to-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-baseline gap-0">
            <span className="font-semibold text-lg tracking-tight text-foreground">Watch</span>
            <span className="text-[10px] font-medium text-meta ml-1.5 tracking-wider uppercase">by zuup</span>
          </div>

          {/* Desktop nav only */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => onNavChange(item)}
                className={`relative px-4 py-2 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 ${
                  activeNav === item
                    ? "text-foreground bg-[hsla(0,0%,100%,0.08)]"
                    : "text-meta hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search - visible on all */}
          <button
            onClick={onSearchClick}
            className="p-2.5 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all duration-300 touch-manipulation hidden md:flex"
          >
            <Search size={18} />
          </button>

          {/* Install button - desktop only */}
          {canInstall && (
            <button
              onClick={promptInstall}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all duration-300 touch-manipulation"
              title="Install app"
            >
              <Download size={16} />
              <span className="text-xs font-medium">Install</span>
            </button>
          )}

          {/* Profile */}
          <div className="relative hidden md:block">
            <button
              onClick={() => user ? setMenuOpen(!menuOpen) : onAuthClick()}
              className="p-2.5 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all duration-300 touch-manipulation"
            >
              <User size={18} />
            </button>
            <AnimatePresence>
              {user && menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-2xl"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm text-foreground truncate">{profile?.display_name || user.email}</p>
                    <p className="text-xs text-meta truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-meta hover:text-foreground hover:bg-surface transition-colors touch-manipulation"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
