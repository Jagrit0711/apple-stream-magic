import { useState, useEffect } from "react";

export const usePersistentMute = () => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem("player_muted");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    localStorage.setItem("player_muted", JSON.stringify(newVal));
  };

  const setMute = (val: boolean) => {
    setIsMuted(val);
    localStorage.setItem("player_muted", JSON.stringify(val));
  };

  return { isMuted, toggleMute, setMute };
};
