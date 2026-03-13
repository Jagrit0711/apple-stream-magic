import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import PasswordGate from "@/components/PasswordGate";
import Index from "./pages/Index.tsx";
import Movies from "./pages/Movies.tsx";
import TVShows from "./pages/TVShows.tsx";
import Anime from "./pages/Anime.tsx";
import MoviePage from "./pages/MoviePage.tsx";
import TVPage from "./pages/TVPage.tsx";
import WatchParty from "./pages/WatchParty.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PasswordGate>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv" element={<TVShows />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/tv/:id" element={<TVPage />} />
              <Route path="/watch-party/:roomId" element={<WatchParty />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PasswordGate>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
