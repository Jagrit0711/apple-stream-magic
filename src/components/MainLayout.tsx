import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
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
          onSelect={(item) => navigate(`/${item.media_type}/${item.id}`)} 
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
