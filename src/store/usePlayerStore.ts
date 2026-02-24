import { create } from 'zustand';

interface PlayerState {
  currentTrack: any | null;
  isPlaying: boolean;
  setCurrentTrack: (track: any) => void;
  setPlaying: (state: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setPlaying: (state) => set({ isPlaying: state }),
}));