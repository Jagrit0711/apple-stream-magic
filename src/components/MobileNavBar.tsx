import { Home, Search, User, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useLayout } from "@/components/MainLayout";

interface MobileNavBarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onSearchClick: () => void;
  onAuthClick: () => void;
  isSearchOpen?: boolean;
}

const NAV_ITEMS = [
  { key: "Home", path: "/", icon: Home, label: "Home" },
  { key: "search", path: "", icon: Search, label: "Search" },
];

const MobileNavBar = ({ activeNav, onNavChange, onSearchClick, onAuthClick, isSearchOpen }: MobileNavBarProps) => {
  const { user, profile } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();
  const location = useLocation();

  const { setSearchOpen } = useLayout();

  const getActive = (key: string, path: string) => {
    if (key === "search") return !!isSearchOpen;
    if (key === "Home") {
      return (location.pathname === "/" || location.pathname === "/movies" || location.pathname === "/tv" || location.pathname === "/anime") && !isSearchOpen;
    }
    return location.pathname === path && !isSearchOpen;
  };

  const handleTap = (key: string, path: string) => {
    if (key === "search") {
      onSearchClick();
    } else {
      setSearchOpen(false);
      navigate(path);
    }
  };

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-auto md:hidden"
    >
      <div className="flex items-center gap-1 p-2 rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {NAV_ITEMS.map(({ key, path, icon: Icon }) => {
          const active = getActive(key, path);
          return (
            <button
              key={key}
              onClick={() => handleTap(key, path)}
              className={`relative p-4 rounded-full touch-manipulation transition-all duration-300 flex items-center justify-center ${
                active ? "text-white" : "text-meta hover:text-white"
              }`}
            >
              <div 
                className={`absolute inset-0 bg-accent shadow-[0_0_20px_rgba(225,29,72,0.4)] rounded-full -z-10 transition-opacity duration-300 ${active ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
              />
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            </button>
          );
        })}
        
        <button
          onClick={() => {
            setSearchOpen(false);
            if (user) navigate("/profile");
            else onAuthClick();
          }}
          className={`relative p-4 rounded-full touch-manipulation transition-all duration-300 flex items-center justify-center group`}
        >
          <div 
            className={`absolute inset-0 bg-accent shadow-[0_0_20px_rgba(225,29,72,0.4)] rounded-full -z-10 transition-opacity duration-300 ${(location.pathname === "/profile" && !isSearchOpen) ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
          />
          {user ? (
            <div className="w-[24px] h-[24px] rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-[10px] font-black uppercase text-white shadow-lg overflow-hidden ring-1 ring-white/30 relative z-10 transition-transform active:scale-95">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                profile?.display_name?.charAt(0) || user.email?.charAt(0) || 'U'
              )}
            </div>
          ) : (
            <User size={22} strokeWidth={location.pathname === "/profile" && !isSearchOpen ? 2.5 : 2} className={`relative z-10 ${location.pathname === "/profile" && !isSearchOpen ? "text-white" : "text-meta group-hover:text-white"}`} />
          )}
        </button>
      </div>
    </nav>
  );
};

export default MobileNavBar;
