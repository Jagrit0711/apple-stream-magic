import { useState, useEffect } from "react";
import { Search, User, LogOut, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavChange: (nav: string) => void;
  activeNav: string;
  onAuthClick: () => void;
  onSearchClick?: () => void;
}

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Movies", path: "/movies" },
  { label: "TV Shows", path: "/tv" },
  { label: "Watchlist", path: "/profile" },
];

const Header = ({ onSearch, onNavChange, activeNav, onAuthClick, onSearchClick }: HeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                className={`relative px-4 py-2 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 ${
                  location.pathname === item.path
                    ? "text-foreground bg-white/10 shadow-lg shadow-white/5"
                    : "text-meta hover:text-foreground"
                }`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="header-nav"
                    className="absolute inset-0 bg-white/5 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSearchClick}
            className="p-3 rounded-full text-meta hover:text-foreground hover:bg-white/5 transition-all duration-300 touch-manipulation hidden md:flex"
          >
            <Search size={20} />
          </motion.button>

          {canInstall && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={promptInstall}
              className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-full text-meta hover:text-foreground hover:bg-white/5 transition-all duration-300 touch-manipulation"
              title="Install app"
            >
              <Download size={18} />
              <span className="text-xs font-black uppercase tracking-wider">Install</span>
            </motion.button>
          )}

          <div className="relative hidden md:block">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => user ? setMenuOpen(!menuOpen) : onAuthClick()}
              className="p-3 rounded-full text-meta hover:text-foreground hover:bg-white/5 transition-all duration-300 touch-manipulation"
            >
              <User size={20} />
            </motion.button>
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
                    <p className="text-sm text-foreground truncate font-semibold">{profile?.display_name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-meta truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-meta hover:text-foreground hover:bg-surface transition-colors touch-manipulation border-b border-border"
                  >
                    <User size={14} /> My Profile
                  </button>
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
