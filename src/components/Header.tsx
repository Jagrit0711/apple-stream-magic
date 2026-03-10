import { useState } from "react";
import { Search, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavChange: (nav: string) => void;
  activeNav: string;
  onAuthClick: () => void;
}

const NAV_ITEMS = ["Home", "Movies", "TV Shows", "Anime"];

const Header = ({ onSearch, onNavChange, activeNav, onAuthClick }: HeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (val: string) => {
    setQuery(val);
    onSearch(val);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
      <div className="flex items-center justify-between px-8 py-5 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-10">
          <h1 className="font-display font-bold text-xl tracking-tight text-foreground">
            Watch <span className="text-accent">by zuup</span>
          </h1>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => onNavChange(item)}
                className={`font-display font-medium text-sm tracking-wide transition-colors ${
                  activeNav === item ? "text-foreground" : "text-meta hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {searchOpen && (
              <motion.input
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                type="text"
                placeholder="Search movies, shows..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-surface border border-border rounded-md px-4 py-2 text-sm font-body text-foreground placeholder:text-meta focus:outline-none focus:ring-1 focus:ring-accent"
                autoFocus
              />
            )}
          </AnimatePresence>
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) { setQuery(""); onSearch(""); }
            }}
            className="text-meta hover:text-foreground transition-colors p-2"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Account */}
          <div className="relative">
            <button
              onClick={() => user ? setMenuOpen(!menuOpen) : onAuthClick()}
              className="text-meta hover:text-foreground transition-colors p-2"
            >
              <User size={20} />
            </button>
            {user && menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-body text-sm text-foreground truncate">{profile?.display_name || user.email}</p>
                  <p className="font-body text-xs text-meta truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left font-body text-sm text-meta hover:text-foreground hover:bg-surface transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
