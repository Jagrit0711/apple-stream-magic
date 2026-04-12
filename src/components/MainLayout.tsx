import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import Header from "./Header";
import MobileNavBar from "./MobileNavBar";
import SearchOverlay from "./SearchOverlay";
import AuthModal from "./AuthModal";
import DetailView from "./DetailView";
import VideoPlayer from "./VideoPlayer";
import { TMDBMovie } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { TVNavProvider } from "@/hooks/useTVNav";
import { hasAppAccess } from "@/lib/access";

interface LayoutContextType {
  setSelectedItem: (item: TMDBMovie | null) => void;
  setPlayer: (player: { id: number; type: "movie" | "tv"; season?: number; episode?: number; resumeSeconds?: number } | null) => void;
  setSearchOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
  // TV nav needs to call these from outside — expose them via context
  registerTVContent: (row: number, items: TMDBMovie[]) => void;
  getTVItem: (row: number, col: number) => TMDBMovie | null;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error("useLayout must be used within a MainLayout");
  return context;
};

interface MainLayoutProps {
  children: React.ReactNode;
}

// Header nav paths — index matches TVNavProvider headerCol (0-4)
const HEADER_PATHS = ["/", "/movies", "/tv", "/profile"];

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const showShell = Boolean(user && hasAppAccess(profile));

  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [player, setPlayer] = useState<{ id: number; type: "movie" | "tv"; season?: number; episode?: number; resumeSeconds?: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<TMDBMovie | null>(null);

  // TV nav content registry — row → items[]
  const tvContentMap = useRef<Map<number, TMDBMovie[]>>(new Map());

  const registerTVContent = useCallback((row: number, items: TMDBMovie[]) => {
    tvContentMap.current.set(row, items);
  }, []);

  const getTVItem = useCallback((row: number, col: number): TMDBMovie | null => {
    return tvContentMap.current.get(row)?.[col] ?? null;
  }, []);

  // Header select handler (called by TVNavProvider onHeaderSelect)
  const handleHeaderSelect = useCallback((idx: number) => {
    if (idx === 4) {
      // Search
      setSearchOpen(true);
    } else if (HEADER_PATHS[idx]) {
      navigate(HEADER_PATHS[idx]);
    }
  }, [navigate]);

  // Card select handler (called by TVNavProvider onRowSelect)
  const handleRowSelect = useCallback((row: number, col: number) => {
    const item = getTVItem(row, col);
    if (item) setSelectedItem(item);
  }, [getTVItem]);

  const openModalsCount = [searchOpen, authOpen, !!player, !!selectedItem].filter(Boolean).length;
  const prevCount = useRef(0);
  const isBackNavigation = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      if (openModalsCount > 0) {
        isBackNavigation.current = true;
        if (player) setPlayer(null);
        else if (selectedItem) setSelectedItem(null);
        else if (searchOpen) setSearchOpen(false);
        else if (authOpen) setAuthOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [player, selectedItem, searchOpen, authOpen, openModalsCount]);

  useEffect(() => {
    if (isBackNavigation.current) {
      isBackNavigation.current = false;
      prevCount.current = openModalsCount;
      return;
    }
    if (openModalsCount > prevCount.current) {
      const diff = openModalsCount - prevCount.current;
      for (let i = 0; i < diff; i++) {
        window.history.pushState({ modalLevel: prevCount.current + i + 1 }, "");
      }
    } else if (openModalsCount < prevCount.current) {
      const diff = prevCount.current - openModalsCount;
      if (window.history.state?.modalLevel) window.history.go(-diff);
    }
    prevCount.current = openModalsCount;
  }, [openModalsCount]);

  useEffect(() => { setSearchOpen(false); }, [location.pathname]);

  const activeNav =
    location.pathname === "/" ? "Home" :
    location.pathname.startsWith("/movies") ? "Movies" :
    location.pathname.startsWith("/tv") ? "TV Shows" :
    location.pathname.startsWith("/anime") ? "Anime" :
    location.pathname.startsWith("/profile") ? "Profile" : "Home";

  return (
    <LayoutContext.Provider value={{ setSelectedItem, setPlayer, setSearchOpen, setAuthOpen, registerTVContent, getTVItem }}>
      <TVNavProvider
        onHeaderSelect={handleHeaderSelect}
        onRowSelect={handleRowSelect}
      >
        <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden">
          {showShell && (
            <Header
              onSearch={() => {}}
              onNavChange={() => {}}
              activeNav={activeNav}
              onAuthClick={() => setAuthOpen(true)}
              onSearchClick={() => setSearchOpen(true)}
            />
          )}

          <main>{children}</main>

          {showShell && (
            <MobileNavBar
              activeNav={activeNav}
              onNavChange={() => {}}
              onSearchClick={() => setSearchOpen(true)}
              onAuthClick={() => setAuthOpen(true)}
              isSearchOpen={searchOpen}
            />
          )}

          {showShell && (
            <DetailView
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onPlay={(id, type, s, e) => setPlayer({ id, type, season: s, episode: e })}
            />
          )}

          {showShell && player && (
            <VideoPlayer
              contentId={player.id}
              type={player.type}
              season={player.season}
              episode={player.episode}
              resumeSeconds={player.resumeSeconds}
              onClose={() => setPlayer(null)}
            />
          )}

          {showShell && (
            <SearchOverlay
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              onSelect={(item) => {
                setSearchOpen(false);
                setTimeout(() => navigate(`/${item.media_type}/${item.id}`), 50);
              }}
            />
          )}

          <AuthModal
            open={authOpen}
            onClose={() => setAuthOpen(false)}
          />
        </div>
      </TVNavProvider>
    </LayoutContext.Provider>
  );
};

export default MainLayout;
