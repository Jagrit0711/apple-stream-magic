import { useQuery } from "@tanstack/react-query";
import { fetchPopularAnime } from "@/lib/tmdb";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import MobileNavBar from "@/components/MobileNavBar";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchOverlay from "@/components/SearchOverlay";
import AuthModal from "@/components/AuthModal";
import { useContentActions } from "@/hooks/useContentActions";

const Anime = () => {
  const { data: animeData } = useQuery({ queryKey: ["popular-anime"], queryFn: () => fetchPopularAnime() });
  const anime = animeData?.results || [];

  const {
    selectedItem, setSelectedItem, player, setPlayer, searchOpen, setSearchOpen,
    authOpen, setAuthOpen, handleSelect, handlePlay, handlePlayDirect,
  } = useContentActions(anime);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header onSearch={() => {}} onNavChange={() => {}} activeNav="Anime" onAuthClick={() => setAuthOpen(true)} onSearchClick={() => setSearchOpen(true)} />
      {anime.length > 0 && <FeaturedHero items={anime} onSelect={handleSelect} onPlay={handlePlay} />}
      <div className={`${anime.length > 0 ? "pt-6 sm:pt-8" : "pt-24 sm:pt-28"} pb-24 md:pb-16`}>
        <ContentShelf title="Popular Anime" items={anime} onSelect={handleSelect} />
      </div>
      <MobileNavBar activeNav="Anime" onNavChange={() => {}} onSearchClick={() => setSearchOpen(true)} onAuthClick={() => setAuthOpen(true)} />
      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />
      {player && <VideoPlayer contentId={player.id} type={player.type} season={player.season} episode={player.episode} onClose={() => setPlayer(null)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Anime;
