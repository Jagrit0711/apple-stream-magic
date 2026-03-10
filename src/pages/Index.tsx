import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TMDBMovie,
  getContentType,
  fetchTrending,
  fetchPopularMovies,
  fetchTopRatedTV,
  fetchPopularAnime,
} from "@/lib/tmdb";
import Header from "@/components/Header";
import FeaturedHero from "@/components/FeaturedHero";
import ContentShelf from "@/components/ContentShelf";
import DetailView from "@/components/DetailView";
import VideoPlayer from "@/components/VideoPlayer";
import SearchResults from "@/components/SearchResults";

const Index = () => {
  const [activeNav, setActiveNav] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<TMDBMovie | null>(null);
  const [player, setPlayer] = useState<{
    id: number;
    type: "movie" | "tv";
    season?: number;
    episode?: number;
  } | null>(null);

  const { data: trending = [] } = useQuery({ queryKey: ["trending"], queryFn: fetchTrending });
  const { data: movies = [] } = useQuery({ queryKey: ["popular-movies"], queryFn: fetchPopularMovies });
  const { data: tvShows = [] } = useQuery({ queryKey: ["top-tv"], queryFn: fetchTopRatedTV });
  const { data: anime = [] } = useQuery({ queryKey: ["popular-anime"], queryFn: fetchPopularAnime });

  const featured = trending[0] || null;

  const handleSelect = (item: TMDBMovie) => setSelectedItem(item);

  const handlePlay = (item: TMDBMovie) => {
    const type = getContentType(item);
    setPlayer({ id: item.id, type, season: type === "tv" ? 1 : undefined, episode: type === "tv" ? 1 : undefined });
  };

  const handlePlayDirect = (id: number, type: "movie" | "tv", season?: number, episode?: number) => {
    setSelectedItem(null);
    setPlayer({ id, type, season, episode });
  };

  const isSearching = searchQuery.length > 2;

  const shelves = useMemo(() => {
    if (activeNav === "Movies") return [{ title: "Popular Movies", items: movies }];
    if (activeNav === "TV Shows") return [{ title: "Top Rated TV Shows", items: tvShows }];
    if (activeNav === "Anime") return [{ title: "Popular Anime", items: anime }];
    return [
      { title: "Trending This Week", items: trending.slice(1) },
      { title: "Popular Movies", items: movies },
      { title: "Top Rated TV", items: tvShows },
      { title: "Anime", items: anime },
    ];
  }, [activeNav, trending, movies, tvShows, anime]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} onNavChange={setActiveNav} activeNav={activeNav} />

      {isSearching ? (
        <SearchResults query={searchQuery} onSelect={handleSelect} />
      ) : (
        <>
          {featured && activeNav === "Home" && (
            <FeaturedHero item={featured} onSelect={handleSelect} onPlay={handlePlay} />
          )}

          <div className={`${activeNav !== "Home" || !featured ? "pt-28" : "pt-8"} pb-16`}>
            {shelves.map(({ title, items }) => (
              <ContentShelf key={title} title={title} items={items} onSelect={handleSelect} />
            ))}
          </div>
        </>
      )}

      <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onPlay={handlePlayDirect} />

      {player && (
        <VideoPlayer
          contentId={player.id}
          type={player.type}
          season={player.season}
          episode={player.episode}
          onClose={() => setPlayer(null)}
        />
      )}
    </div>
  );
};

export default Index;
