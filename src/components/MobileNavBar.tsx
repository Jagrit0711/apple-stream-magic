import { Home, Film, Tv, Search, User, Sparkles, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface MobileNavBarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onSearchClick: () => void;
  onAuthClick: () => void;
}

const NAV_ITEMS = [
  { key: "Home", path: "/", icon: Home, label: "Home" },
  { key: "Movies", path: "/movies", icon: Film, label: "Movies" },
  { key: "TV Shows", path: "/tv", icon: Tv, label: "TV" },
  { key: "Anime", path: "/anime", icon: Sparkles, label: "Anime" },
  { key: "search", path: "", icon: Search, label: "Search" },
];

const MobileNavBar = ({ activeNav, onNavChange, onSearchClick, onAuthClick }: MobileNavBarProps) => {
  const { user } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();
  const location = useLocation();

  const getActive = (key: string, path: string) => {
    if (key === "search") return false;
    return location.pathname === path;
  };

  const handleTap = (key: string, path: string) => {
    if (key === "search") {
      onSearchClick();
    } else {
      navigate(path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 border-t border-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {NAV_ITEMS.map(({ key, path, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleTap(key, path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg touch-manipulation transition-colors ${
              getActive(key, path) ? "text-accent" : "text-meta"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg touch-manipulation text-meta"
          >
            <Download size={20} />
            <span className="text-[10px] font-medium">Install</span>
          </button>
        )}
        <button
          onClick={onAuthClick}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg touch-manipulation text-meta"
        >
          <User size={20} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNavBar;
