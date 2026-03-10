import { useState, useEffect } from "react";
import { Search, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    onSearch(val);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 border-b border-[hsla(0,0%,100%,0.04)]"
          : "bg-gradient-to-b from-background via-background/60 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 md:px-8 py-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-0">
            <span className="font-semibold text-lg tracking-tight text-foreground">Watch</span>
            <span className="text-[10px] font-medium text-meta ml-1.5 tracking-wider uppercase">by zuup</span>
          </div>

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

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Search movies, shows, anime..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-surface border border-border rounded-full px-5 py-2.5 text-[13px] text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent/50"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) { setQuery(""); onSearch(""); }
              }}
              className="p-2.5 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all duration-300"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => user ? setMenuOpen(!menuOpen) : onAuthClick()}
              className="p-2.5 rounded-full text-meta hover:text-foreground hover:bg-[hsla(0,0%,100%,0.06)] transition-all duration-300"
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
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-meta hover:text-foreground hover:bg-surface transition-colors"
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
