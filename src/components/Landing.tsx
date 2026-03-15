import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Tv, Users, Film, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { TMDBMovie, img } from "@/lib/tmdb";

interface LandingProps {
  trending: TMDBMovie[];
  onAuthClick: () => void;
}

const Landing = ({ trending, onAuthClick }: LandingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 500]);

  // Use the best posters from trending for our cinematic background wall
  const posters = trending
    .filter((t) => t.poster_path)
    .map((t) => img(t.poster_path, "w500"))
    .filter(Boolean) as string[];

  // Split into columns for the parallax wall
  const col1 = [...posters.slice(0, 6), ...posters.slice(0, 6)];
  const col2 = [...posters.slice(6, 12), ...posters.slice(6, 12)];
  const col3 = [...posters.slice(12, 18), ...posters.slice(12, 18)];
  const col4 = [...posters.slice(1, 7), ...posters.slice(1, 7)];

  return (
    <div ref={containerRef} className="relative bg-black min-h-screen font-sans selection:bg-[#E11D48]/30 overflow-x-hidden">
      


      {/* Hero Section */}
      <div className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        
        {/* Cinematic Parallax Poster Wall */}
        <div className="absolute inset-0 z-0 overflow-hidden flex justify-center gap-4 sm:gap-6 lg:gap-8 opacity-40 scale-[1.15] -rotate-6 blur-[2px] pointer-events-none">
          {/* Column 1 (Scrolls Up) */}
          <motion.div 
            animate={{ y: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
            className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-[150px] sm:w-[220px] lg:w-[280px]"
          >
            {col1.map((p, i) => (
              <img key={i} src={p} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl" />
            ))}
          </motion.div>
          {/* Column 2 (Scrolls Down) */}
          <motion.div 
            animate={{ y: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 50 }}
            className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-[150px] sm:w-[220px] lg:w-[280px] -mt-[300px]"
          >
            {col2.map((p, i) => (
              <img key={i} src={p} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl" />
            ))}
          </motion.div>
          {/* Column 3 (Scrolls Up) */}
          <motion.div 
            animate={{ y: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 45 }}
            className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-[150px] sm:w-[220px] lg:w-[280px] -mt-[150px]"
          >
            {col3.map((p, i) => (
              <img key={i} src={p} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl" />
            ))}
          </motion.div>
          {/* Column 4 (Scrolls Down) - Hidden on smaller screens */}
          <motion.div 
            animate={{ y: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 55 }}
            className="hidden md:flex flex-col gap-4 sm:gap-6 lg:gap-8 w-[150px] sm:w-[220px] lg:w-[280px] -mt-[400px]"
          >
            {col4.map((p, i) => (
              <img key={i} src={p} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl" />
            ))}
          </motion.div>
        </div>

        {/* Deep Gradients to melt the posters into the background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-0" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-medium mb-8 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
              Now entirely free to stream
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Movies.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E11D48] via-fuchsia-500 to-[#E11D48] animate-gradient bg-300%">
              Zero limits.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed font-medium"
          >
            Watch anywhere. Cancel never. Dive into an infinite library of 4K movies, anime, and TV shows—perfectly synchronized with your friends.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button 
              onClick={onAuthClick}
              className="w-full sm:w-auto group relative flex items-center justify-center gap-2 px-8 py-4 bg-[#E11D48] text-white rounded-full font-bold text-lg hover:bg-[#E11D48]/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_#E11D48]"
            >
              Get Started
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-white/30 font-medium">No credit card required.</span>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 cursor-pointer hover:text-white transition-colors z-20"
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase">Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </div>

      {/* Immersive Experience Section */}
      <div className="relative z-10 py-32 px-6 overflow-hidden bg-black">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-gradient-to-tr from-violet-600/30 via-fuchsia-600/20 to-orange-600/30 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 text-sm font-semibold mb-8 backdrop-blur-md shadow-xl"
          >
            <Sparkles size={16} className="text-fuchsia-400" />
            A Premium Experience
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 max-w-4xl tracking-tight leading-[1.1]"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Built for those who demand <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400">the best visual fidelity.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-white/50 max-w-2xl font-medium leading-relaxed"
          >
            We designed a theater-like environment right in your browser. With intelligent search, smart AI recommendations, and seamless sync capabilities that put you right into the action.
          </motion.p>
        </div>
      </div>

      {/* Feature Section */}
      <div className="relative z-10 bg-black py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: <Film size={32} />,
                title: "Cinematic Quality",
                desc: "Enjoy trailers, info, and fully native ad-free playback packed directly into a breathtaking glassmorphism interface."
              },
              {
                icon: <Users size={32} />,
                title: "Watch Party",
                desc: "Perfectly synchronized streams. Just share a link, click enter, and start the countdown to watch together globally."
              },
              {
                icon: <Tv size={32} />,
                title: "Every Device",
                desc: "Phones, tablets, desktops, you name it. A dedicated layout system scales elegantly to whatever screen you own."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#E11D48]/10 text-[#E11D48] flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(225,29,72,0.2)]">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>{f.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>Ready to start watching?</h2>
          <p className="text-white/50 mb-10 max-w-xl mx-auto">Join thousands of others already experiencing the best way to stream on the internet.</p>
          <button 
            onClick={onAuthClick}
            className="group px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* Deep Footer */}
      <footer className="relative z-10 py-8 text-center text-white/20 text-xs border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} Watch by zuup. All rights reserved.</p>
      </footer>
      
      {/* Global Style overrides for the animated gradient text */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 300%;
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
