import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { motion } from "framer-motion";
import { 
  User as UserIcon, Settings, LogOut, 
  Trash2, Calendar, Heart, ShieldCheck
} from "lucide-react";
import ContentCard from "@/components/ContentCard";
import { MOVIE_GENRES } from "@/lib/tmdb";

const Profile = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { watchlist, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [selectedGenres, setSelectedGenres] = useState<number[]>(profile?.favorite_genres || []);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ 
      display_name: displayName,
      favorite_genres: selectedGenres
    });
    setIsEditing(false);
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId) 
        : [...prev, genreId]
    );
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden">
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
        {/* Profile Hero */}
        <div className="glass-strong rounded-3xl p-6 sm:p-10 mb-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <UserIcon size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-accent to-orange-500 p-1 shadow-2xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-background" alt="" />
                ) : (
                  <div className="w-full h-full rounded-full bg-surface border-4 border-background flex items-center justify-center text-3xl font-bold font-black">
                    {profile?.display_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  {profile?.display_name || "Adventurer"}
                </h1>
                <div className="flex justify-center md:justify-start gap-2">
                  {profile?.onboarding_complete && (
                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1 uppercase tracking-widest leading-none">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-meta text-xs mb-6 font-bold uppercase tracking-wider">
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <Calendar size={14} className="text-accent" /> Joined {new Date(profile?.created_at || "").toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <Heart size={14} className="text-accent" /> {watchlist.length} items in watchlist
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Settings size={14} /> Edit Profile
                </button>
                <button 
                  onClick={signOut}
                  className="px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-10 pt-10 border-t border-white/5"
            >
              <form onSubmit={handleUpdateProfile} className="max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-meta/60 mb-3">Display Name</label>
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all font-bold"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-meta/60 mb-3">Favorite Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {MOVIE_GENRES.map(genre => (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => toggleGenre(genre.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            selectedGenres.includes(genre.id)
                              ? "bg-accent border-accent text-white"
                              : "bg-white/5 border-white/10 text-meta hover:border-white/30"
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest text-meta hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="bg-accent text-white px-8 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest shadow-lg shadow-accent/20 hover:scale-105 transition-transform active:scale-95">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* Watchlist Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
               My Watchlist
            </h2>
          </div>

          {!watchlistLoading && watchlist.length === 0 ? (
            <div className="bg-white/[0.02] rounded-3xl p-16 text-center border-2 border-dashed border-white/5">
              <p className="text-meta/60 text-sm font-bold">Your watchlist is empty. Start adding some movies and shows!</p>
              <button onClick={() => navigate("/")} className="mt-4 text-accent text-xs font-black uppercase tracking-widest">Discover Content</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {watchlist.map(item => (
                <div key={item.id} className="relative group">
                  <div 
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
                  >
                    <ContentCard 
                      item={{
                        id: item.tmdb_id,
                        title: item.title,
                        poster_path: item.poster_path,
                        media_type: item.media_type,
                        vote_average: 0,
                        genre_ids: []
                      } as any} 
                      onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
                    />
                  </div>
                  <button 
                    onClick={() => removeFromWatchlist(item.tmdb_id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
