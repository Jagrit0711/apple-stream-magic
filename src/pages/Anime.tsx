import { useQuery } from "@tanstack/react-query";
import { fetchPopularAnime } from "@/lib/tmdb";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import MobileCategories from "@/components/MobileCategories";
import { useLayout } from "@/components/MainLayout";

const Anime = () => {
  const { setSelectedItem, setPlayer } = useLayout();
  const { data: animeData } = useQuery({ queryKey: ["popular-anime"], queryFn: () => fetchPopularAnime() });
  const anime = animeData?.results || [];

  const handleSelect = (item: any) => setSelectedItem(item);
  const handlePlayDirect = (id: number, type: "movie" | "tv", s?: number, e?: number, r?: number) =>
    setPlayer({ id, type, season: s, episode: e, resumeSeconds: r });

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden relative">
        <MobileCategories />
      </div>

      {anime.length > 0 && (
        <FeaturedHero items={anime} onSelect={handleSelect} onPlay={(item) => handlePlayDirect(item.id, "tv")} />
      )}
      <div className={`${anime.length > 0 ? "relative z-10 -mt-20 md:-mt-32" : "pt-24 sm:pt-28"} pb-24 md:pb-12`}>
        <ContentShelf title="Popular Anime" items={anime} onSelect={handleSelect} />
      </div>
    </div>
  );
};

export default Anime;
