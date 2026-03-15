import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import PasswordGate from "@/components/PasswordGate";
import MainLayout from "@/components/MainLayout";
import Index from "./pages/Index.tsx";
import Movies from "./pages/Movies.tsx";
import TVShows from "./pages/TVShows.tsx";
import Anime from "./pages/Anime.tsx";
import MoviePage from "./pages/MoviePage.tsx";
import TVPage from "./pages/TVPage.tsx";
import WatchParty from "./pages/WatchParty.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/movies" element={<PageTransition><Movies /></PageTransition>} />
        <Route path="/tv" element={<PageTransition><TVShows /></PageTransition>} />
        <Route path="/anime" element={<PageTransition><Anime /></PageTransition>} />
        <Route path="/movie/:id" element={<PageTransition><MoviePage /></PageTransition>} />
        <Route path="/tv/:id" element={<PageTransition><TVPage /></PageTransition>} />
        <Route path="/watch-party/:roomId" element={<PageTransition><WatchParty /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PasswordGate>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MainLayout>
              <AnimatedRoutes />
            </MainLayout>
          </BrowserRouter>
        </PasswordGate>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
