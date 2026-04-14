import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import MainLayout from "@/components/MainLayout";
import AccessGate from "@/components/AccessGate";
import Index from "./pages/Index.tsx";
import Movies from "./pages/Movies.tsx";
import TVShows from "./pages/TVShows.tsx";
import Anime from "./pages/Anime.tsx";
import MoviePage from "./pages/MoviePage.tsx";
import TVPage from "./pages/TVPage.tsx";
import WatchParty from "./pages/WatchParty.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import ZuupCallback from "./pages/ZuupCallback.tsx";
import Legal from "./pages/Legal.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/movies" element={<PageTransition><AccessGate><Movies /></AccessGate></PageTransition>} />
        <Route path="/tv" element={<PageTransition><AccessGate><TVShows /></AccessGate></PageTransition>} />
        <Route path="/anime" element={<PageTransition><AccessGate><Anime /></AccessGate></PageTransition>} />
        <Route path="/movie/:id" element={<PageTransition><AccessGate><MoviePage /></AccessGate></PageTransition>} />
        <Route path="/tv/:id" element={<PageTransition><AccessGate><TVPage /></AccessGate></PageTransition>} />
        <Route path="/watch-party/:roomId" element={<PageTransition><AccessGate><WatchParty /></AccessGate></PageTransition>} />
        <Route path="/profile" element={<PageTransition><AccessGate><Profile /></AccessGate></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AccessGate requireAdmin><Admin /></AccessGate></PageTransition>} />
        <Route path="/callback" element={<PageTransition><ZuupCallback /></PageTransition>} />
        <Route path="/auth/zuup/callback" element={<PageTransition><ZuupCallback /></PageTransition>} />
        <Route path="/legal" element={<PageTransition><Legal /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
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
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MainLayout>
            <AnimatedRoutes />
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
