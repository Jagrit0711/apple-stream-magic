import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useRef } from "react";
import Header from "./Header";
import MobileNavBar from "./MobileNavBar";
import SearchOverlay from "./SearchOverlay";
import AuthModal from "./AuthModal";
import DetailView from "./DetailView";
import VideoPlayer from "./VideoPlayer";
import { TMDBMovie } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";

interface LayoutContextType {
  setSelectedItem: (item: TMDBMovie | null) => void;
  setPlayer: (player: { id: number; type: "movie" | "tv"; season?: number; episode?: number } | null) => void;
  setSearchOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
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

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [player, setPlayer] = useState<{ id: number; type: "movie" | "tv"; season?: number; episode?: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<TMDBMovie | null>(null);

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
      if (window.history.state?.modalLevel) {
        window.history.go(-diff);
      }
    }
    prevCount.current = openModalsCount;
  }, [openModalsCount]);

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const activeNav = 
    location.pathname === "/" ? "Home" : 
    location.pathname.startsWith("/movies") ? "Movies" :
    location.pathname.startsWith("/tv") ? "TV Shows" :
    location.pathname.startsWith("/anime") ? "Anime" :
    location.pathname.startsWith("/profile") ? "Profile" : "Home";

  return (
    <LayoutContext.Provider value={{ setSelectedItem, setPlayer, setSearchOpen, setAuthOpen }}>
      <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden">
        <Header 
          onSearch={() => {}} 
          onNavChange={() => {}} 
          activeNav={activeNav} 
          onAuthClick={() => setAuthOpen(true)} 
          onSearchClick={() => setSearchOpen(true)} 
        />

        <main>{children}</main>

        <MobileNavBar 
          activeNav={activeNav} 
          onNavChange={() => {}} 
          onSearchClick={() => setSearchOpen(true)} 
          onAuthClick={() => setAuthOpen(true)} 
          isSearchOpen={searchOpen} 
        />

        <DetailView 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onPlay={(id, type, s, e) => setPlayer({ id, type, season: s, episode: e })} 
        />
        
        {player && (
          <VideoPlayer 
            contentId={player.id} 
            type={player.type} 
            season={player.season} 
            episode={player.episode} 
            onClose={() => setPlayer(null)} 
          />
        )}

        <SearchOverlay 
          open={searchOpen} 
          onClose={() => setSearchOpen(false)} 
          onSelect={(item) => {
            setSearchOpen(false);
            setTimeout(() => navigate(`/${item.media_type}/${item.id}`), 50);
          }} 
        />
        
        <AuthModal 
          open={authOpen} 
          onClose={() => setAuthOpen(false)} 
        />
      </div>
    </LayoutContext.Provider>
  );
};

export default MainLayout;
