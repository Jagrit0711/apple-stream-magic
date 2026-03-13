import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WatchPartyMember {
  userId: string;
  displayName: string;
  joinedAt: number;
}

export interface WatchPartyState {
  contentId: number;
  contentType: "movie" | "tv";
  season?: number;
  episode?: number;
  status: "waiting" | "playing";
  updatedBy: string;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
}

const generateUserId = () => "user_" + Math.random().toString(36).substring(2, 10);

export const useWatchParty = (roomId: string) => {
  const [members, setMembers] = useState<WatchPartyMember[]>([]);
  const [partyState, setPartyState] = useState<WatchPartyState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);

  const userId = useRef(generateUserId());
  const displayName = useRef("Guest " + Math.floor(Math.random() * 9000 + 1000));
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`watch-party:${roomId}`, {
      config: { presence: { key: userId.current } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<WatchPartyMember>();
        const memberList: WatchPartyMember[] = Object.values(state).flat() as WatchPartyMember[];
        setMembers(memberList);
        // First person to join is host
        if (memberList.length > 0) {
          const oldest = memberList.reduce((a, b) => a.joinedAt < b.joinedAt ? a : b);
          setIsHost(oldest.userId === userId.current);
        }
      })
      .on("broadcast", { event: "party_state" }, ({ payload }) => {
        setPartyState(payload as WatchPartyState);
      })
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setMessages(prev => [...prev, payload as ChatMessage].slice(-100));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({
            userId: userId.current,
            displayName: displayName.current,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      setConnected(false);
    };
  }, [roomId]);

  const broadcastState = useCallback((state: Omit<WatchPartyState, "updatedBy" | "updatedAt">) => {
    if (!channelRef.current) return;
    const fullState: WatchPartyState = {
      ...state,
      updatedBy: userId.current,
      updatedAt: Date.now(),
    };
    channelRef.current.send({ type: "broadcast", event: "party_state", payload: fullState });
    setPartyState(fullState);
  }, []);

  const sendChat = useCallback((text: string) => {
    if (!channelRef.current || !text.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      userId: userId.current,
      displayName: displayName.current,
      text: text.trim(),
      timestamp: Date.now(),
    };
    channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
    setMessages(prev => [...prev, msg].slice(-100));
  }, []);

  return {
    userId: userId.current,
    displayName: displayName.current,
    members,
    partyState,
    messages,
    isHost,
    connected,
    broadcastState,
    sendChat,
  };
};
