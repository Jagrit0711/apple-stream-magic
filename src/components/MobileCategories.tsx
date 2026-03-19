import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";

// Shows on mobile (below header) AND on TV (overlaid on hero)
// Controlled by the `isTV` prop — on TV it positions differently
interface MobileCategoriesProps {
  isTV?: boolean;
}

const MobileCategories = ({ isTV = false }: MobileCategoriesProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { label: "Movies",   path: "/movies" },
    { label: "TV Shows", path: "/tv" },
    { label: "Anime",    path: "/anime" },
  ];

  return (
    <div
      className={`flex items-center justify-center gap-3 px-4 py-2 w-full overflow-x-auto no-scrollbar bg-transparent z-[40] ${
        isTV
          ? "absolute top-[96px] left-0 right-0"   // TV: overlay on hero
          : "absolute top-[88px] md:hidden left-0 right-0" // Mobile only
      }`}
    >
      {categories.map((cat) => {
        const isActive = location.pathname === cat.path;
        return (
          <motion.button
            key={cat.path}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: categories.indexOf(cat) * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(isActive ? "/" : cat.path)}
            className={`
              flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl
              text-[10px] font-black uppercase tracking-widest transition-all
              backdrop-blur-3xl border shadow-2xl outline-none
              ${isTV ? "focus:ring-2 focus:ring-accent focus:border-accent/60" : ""}
              ${isActive
                ? "bg-white/20 text-white border-white/40 ring-1 ring-white/20"
                : "bg-white/[0.03] text-white/50 border-white/5 hover:bg-white/10 hover:text-white/80"}
            `}
          >
            {cat.label}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 rounded-full bg-white flex items-center justify-center ml-1.5 shadow-sm"
              >
                <X size={10} className="text-black stroke-[4]" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default MobileCategories;
