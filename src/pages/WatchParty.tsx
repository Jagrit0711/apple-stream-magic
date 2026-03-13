import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Send, Check, Link2, ArrowLeft,
  Play, Loader2, Crown, MessageSquare, GripVertical
} from "lucide-react";
import { useWatchParty } from "@/hooks/useWatchParty";
import { useQuery } from "@tanstack/react-query";
import { fetchByIdAndType, getTitle, img } from "@/lib/tmdb";

const WatchParty = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contentId = Number(searchParams.get("id"));
  const contentType = (searchParams.get("type") as "movie" | "tv") || "movie";
  const seasonParam = Number(searchParams.get("season") || 1);
  const episodeParam = Number(searchParams.get("episode") || 1);

  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    userId, displayName, members, partyState, messages,
    isHost, connected, broadcastState, sendChat,
  } = useWatchParty(roomId || "");

  const { data: detail } = useQuery({
    queryKey: ["detail", contentId, contentType],
    queryFn: () => fetchByIdAndType(contentId, contentType),
    enabled: !!contentId,
  });

  // Host initializes the lobby
  useEffect(() => {
    if (isHost && connected && contentId && !partyState) {
      broadcastState({
        contentId,
        contentType,
        season: seasonParam,
        episode: episodeParam,
        status: "waiting", // Start in lobby
      });
    }
  }, [isHost, connected, contentId, partyState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput);
    setChatInput("");
  };

  const handleStartParty = () => {
    if (isHost) {
      broadcastState({ ...partyState!, status: "playing" });
    }
  };

  const activeContent = partyState || {
    contentId, contentType,
    season: seasonParam, episode: episodeParam,
    status: "waiting" as const,
  };

  let playerSrc = `https://player.videasy.net/${activeContent.contentType}/${activeContent.contentId}`;
  if (activeContent.contentType === "tv" && activeContent.season && activeContent.episode) {
    playerSrc += `/${activeContent.season}/${activeContent.episode}`;
  }
  playerSrc += "?color=E11D48&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true&autoplay=true";

  const backdrop = detail ? img(detail.backdrop_path, "w1280") : null;

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden font-sans text-white">
      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-10 absolute top-0 left-0 right-0 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={() => navigate(-1)} className="p-2.5 glass rounded-full hover:bg-white/20 transition-all group backdrop-blur-md">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          {detail && (
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/5">
              <span className="font-semibold tracking-wide text-sm">{getTitle(detail)}</span>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-xs uppercase tracking-widest text-[#E11D48] font-bold">Watch Party</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 glass backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all border border-white/5"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Link2 size={16} />}
            {copied ? "Link Copied" : "Invite Friends"}
          </button>
          
          <button
            onClick={() => setChatOpen(c => !c)}
            className={`p-2.5 rounded-full transition-all backdrop-blur-md border border-white/5 relative ${chatOpen ? 'bg-white text-black' : 'glass hover:bg-white/20'}`}
          >
            <MessageSquare size={20} />
            {messages.length > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E11D48] rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {messages.length > 9 ? '9+' : messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Entrance Gate - guarantees browser autoplay policies are satisfied */}
        <AnimatePresence>
          {!hasJoined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
            >
              <div className="flex flex-col items-center text-center p-8 max-w-sm glass-strong rounded-3xl border border-white/10 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-[#E11D48]/20 flex items-center justify-center mb-6">
                  <Play size={24} className="text-[#E11D48] ml-1" />
                </div>
                <h2 className="text-2xl font-bold mb-3 tracking-tight">Join Watch Party</h2>
                <p className="text-white/50 text-sm mb-8 leading-relaxed">
                  Enter the room to sync your player with the host. Make sure your volume is on!
                </p>
                <button
                  onClick={() => setHasJoined(true)}
                  className="w-full py-3.5 bg-[#E11D48] hover:bg-[#E11D48]/90 text-white rounded-2xl font-bold tracking-wide transition-all active:scale-95 shadow-[0_0_30px_-10px_#E11D48]"
                >
                  Enter Room
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Video / Lobby Area */}
        <div className="flex-1 relative flex flex-col bg-black">
          <AnimatePresence mode="wait">
            {activeContent.status === "waiting" || !hasJoined ? (
              <motion.div 
                key="lobby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Lobby Background Blur */}
                {backdrop && (
                  <div className="absolute inset-0">
                    <img src={backdrop} className="w-full h-full object-cover opacity-30 scale-105 blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black" />
                  </div>
                )}
                
                <div className="relative z-10 flex flex-col items-center text-center max-w-lg p-8 glass-strong rounded-3xl border border-white/10 shadow-2xl">
                  {detail && img(detail.poster_path, "w500") && (
                    <img src={img(detail.poster_path, "w500")!} className="w-32 rounded-lg shadow-2xl mb-6 ring-2 ring-white/10" />
                  )}
                  <h2 className="text-3xl font-bold mb-2">{detail ? getTitle(detail) : "Loading..."}</h2>
                  <p className="text-white/50 mb-8 max-w-sm">
                    {isHost 
                      ? "You are the host. When everyone is ready, click Start to perfectly sync the movie for all viewers." 
                      : "Waiting for the host to start the watch party..."}
                  </p>
                  
                  <div className="flex flex-col items-center gap-4 w-full">
                    {isHost ? (
                      <button 
                        onClick={handleStartParty}
                        disabled={!connected}
                        className="w-full py-4 bg-[#E11D48] hover:bg-[#E11D48]/90 text-white rounded-2xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_#E11D48]"
                      >
                        <Play size={20} fill="currentColor" />
                        Start Synchronized Playback
                      </button>
                    ) : (
                      <div className="w-full py-4 glass text-white/50 rounded-2xl font-medium flex items-center justify-center gap-3">
                        <Loader2 size={18} className="animate-spin" />
                        Waiting for host...
                      </div>
                    )}
                    <span className="text-xs text-white/40 font-mono tracking-widest mt-2">{members.length} USERS CONNECTED</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="player"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 w-full h-full bg-black"
              >
                <iframe
                  key={playerSrc}
                  src={playerSrc}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="encrypted-media; fullscreen; autoplay"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Sidebar Overlay Slide-in */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-[380px] h-full bg-black/80 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.5)] z-20"
            >
              {/* Members Header */}
              <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users size={18} className="text-[#E11D48]" /> 
                    Party Members
                  </h3>
                  <div className="px-2.5 py-1 rounded-full bg-[#E11D48]/20 text-[#E11D48] text-xs font-bold border border-[#E11D48]/30">
                    {members.length} Online
                  </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {members.map((m, i) => (
                    <div key={m.userId} className="flex flex-col items-center gap-1 min-w-[60px]">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg 
                          ${m.userId === userId ? 'bg-gradient-to-tr from-[#E11D48] to-orange-500 text-white' : 'bg-white/10 text-white/80'}`}>
                          {m.displayName.charAt(0).toUpperCase()}
                        </div>
                        {i === 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-black">
                            <Crown size={10} className="text-black" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/60 truncate w-14 text-center">
                        {m.userId === userId ? "You" : m.displayName.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-3">
                    <MessageSquare size={40} className="opacity-20" />
                    <p className="text-sm">No messages yet. Say hi!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.userId === userId;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={msg.id} 
                        className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-md
                          ${isMe ? "bg-[#E11D48] text-white" : "bg-white/10 text-white/80"}`}>
                          {msg.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <span className="text-[10px] text-white/40 mb-1 px-1">{isMe ? "You" : msg.displayName}</span>
                          <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm
                            ${isMe ? "bg-gradient-to-tr from-[#E11D48] to-orange-600 text-white rounded-tr-sm" 
                                  : "glass text-white/90 rounded-tl-sm border border-white/5"}`}>
                            {msg.text}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-black/50 border-t border-white/5 backdrop-blur-md">
                <form onSubmit={handleSendChat} className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-[#E11D48]/50 focus-within:bg-white/10 transition-all">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none min-w-0"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2.5 rounded-xl bg-[#E11D48] text-white hover:bg-[#E11D48]/90 transition-all disabled:opacity-30 disabled:hover:bg-[#E11D48]"
                  >
                    <Send size={16} className="-ml-0.5 mt-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WatchParty;
