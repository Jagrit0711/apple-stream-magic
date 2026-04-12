import { useState, useEffect, useRef } from "react";
import { Search, User, LogOut, Download, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useTVNav } from "@/hooks/useTVNav";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavChange: (nav: string) => void;
  activeNav: string;
  onAuthClick: () => void;
  onSearchClick?: () => void;
}

// Header nav items — indices MUST match HEADER_PATHS in MainLayout
const NAV_ITEMS = [
  { label: "Home",      path: "/" },
  { label: "Movies",    path: "/movies" },
  { label: "TV Shows",  path: "/tv" },
  { label: "Watchlist", path: "/profile" },
  // index 4 = Search (handled separately)
];

const Header = ({ onSearch, onNavChange, activeNav, onAuthClick, onSearchClick }: HeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // TV nav — reads from global provider (no local arrow key handling here)
  const { isTV, zone, headerCol, getHeaderFocused } = useTVNav();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auto-focus search input when expanded
  useEffect(() => {
    if (searchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchExpanded]);

  // When TV nav selects search (index 4), expand the search bar
  useEffect(() => {
    if (isTV && zone === "header" && headerCol === 4 && !searchExpanded) {
      // TV cursor is on Search icon — auto-expand on Enter (handled by TVNavProvider → onHeaderSelect → setSearchOpen)
    }
  }, [isTV, zone, headerCol, searchExpanded]);

  const tvNavHighlight = (idx: number) =>
    isTV && zone === "header" && headerCol === idx;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-2xl border-b border-white/[0.04]"
          : "bg-gradient-to-b from-background/80 via-background/30 to-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="relative flex items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 max-w-[1600px] mx-auto">

        {/* ── Logo ─────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-0 cursor-pointer shrink-0 z-10"
          onClick={() => navigate("/")}
        >
          <span className="font-bold text-2xl sm:text-3xl tracking-tighter text-foreground leading-none">Watch</span>
          <span className="text-[10px] font-black text-meta tracking-[0.3em] uppercase opacity-60 mt-0.5 ml-4">by zuup</span>
        </div>

        {/* ── Center Nav ───────────────────────────────────── */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          {NAV_ITEMS.map((item, i) => {
            const isActive = location.pathname === item.path;
            const isTVHighlighted = tvNavHighlight(i);
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                id={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                className={`
                  relative px-4 py-2 rounded-full text-[13px] font-bold tracking-wide
                  transition-all duration-200 outline-none
                  ${isTVHighlighted
                    ? "text-accent ring-2 ring-accent ring-offset-1 ring-offset-background scale-110"
                    : isActive
                    ? "text-foreground"
                    : "text-meta hover:text-foreground"}
                `}
              >
                {item.label}
                {(isActive || isTVHighlighted) && (
                  <motion.div
                    layoutId="header-nav-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${
                      isTVHighlighted ? "bg-accent/20" : "bg-white/10 shadow-lg shadow-white/5"
                    }`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* ── Right: Search bar + Actions ─────────────────── */}
        <div className="ml-auto flex items-center gap-2">

          {/* Search — expands into a bar, highlighted on TV when headerCol === 4 */}
          <div className="hidden md:flex items-center">
            <AnimatePresence mode="wait">
              {searchExpanded ? (
                <motion.div
                  key="search-bar"
                  initial={{ width: 36, opacity: 0.5 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 36, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 h-10 overflow-hidden"
                >
                  <Search size={16} className="text-meta shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); onSearch(e.target.value); }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && searchQuery.trim()) onSearchClick?.();
                      if (e.key === "Escape") setSearchExpanded(false);
                    }}
                    placeholder="Search movies & shows..."
                    className="bg-transparent text-foreground text-sm placeholder:text-meta/60 outline-none w-full"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    onClick={() => setSearchExpanded(false)}
                    className="text-meta hover:text-foreground transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { onSearchClick?.(); setSearchExpanded(true); }}
                  id="header-search-btn"
                  className={`
                    p-2.5 rounded-full transition-all duration-200 outline-none
                    ${tvNavHighlight(4)
                      ? "text-accent ring-2 ring-accent ring-offset-1 ring-offset-background bg-accent/10 scale-110"
                      : "text-meta hover:text-foreground hover:bg-white/5"}
                  `}
                  aria-label="Search"
                >
                  <Search size={19} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {canInstall && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={promptInstall}
              className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-full text-meta hover:text-foreground hover:bg-white/5 transition-all duration-300 outline-none"
              title="Install app"
            >
              <Download size={18} />
              <span className="text-xs font-black uppercase tracking-wider">Install</span>
            </motion.button>
          )}

          {/* User avatar */}
          <div className="relative hidden md:block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => user ? setMenuOpen(!menuOpen) : onAuthClick()}
              className={`flex items-center gap-2 transition-all duration-300 touch-manipulation outline-none rounded-full ${
                user
                  ? "p-1 bg-white/5 hover:bg-white/10"
                  : "px-5 py-2.5 bg-accent text-white shadow-xl shadow-accent/20 hover:scale-105"
              }`}
            >
              {user ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-[13px] font-black uppercase text-white shadow-lg border border-white/10">
                  {profile?.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              ) : (
                <>
                  <User size={18} />
                  <span className="text-[12px] font-black uppercase tracking-wider">Join Now</span>
                </>
              )}
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
                  {profile?.is_admin && (
                    <button
                      onClick={() => { navigate("/admin"); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-meta hover:text-foreground hover:bg-surface transition-colors touch-manipulation border-b border-border"
                    >
                      <ShieldCheck size={14} /> Admin Dashboard
                    </button>
                  )}
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

      {/* TV mode indicator — shows which zone/col is focused */}
      {isTV && zone === "header" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        />
      )}
    </header>
  );
};

export default Header;
