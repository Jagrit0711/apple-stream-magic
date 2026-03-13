import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";

const MobileCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { label: "Movies", path: "/movies" },
    { label: "TV Shows", path: "/tv" },
    { label: "Anime", path: "/anime" },
  ];

  return (
    <div className="flex md:hidden items-center justify-center gap-3 px-4 py-2 w-full overflow-x-auto no-scrollbar bg-transparent absolute top-[88px] z-[40]">
      {categories.map((cat) => {
        const isActive = location.pathname === cat.path;
        return (
          <motion.button
            key={cat.path}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(isActive ? "/" : cat.path)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-3xl border shadow-2xl ${
              isActive 
                ? "bg-white/20 text-white border-white/40 ring-1 ring-white/20" 
                : "bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/10"
            }`}
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
