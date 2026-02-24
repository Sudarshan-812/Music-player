import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import TrackPlayer from 'react-native-track-player';

const storage = new MMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

interface PlayerState {
  currentTrack: any | null;
  isPlaying: boolean;
  queue: any[];
  isShuffle: boolean; // <--- NEW SHUFFLE STATE
  
  setCurrentTrack: (track: any) => void;
  setPlaying: (state: boolean) => void;
  toggleShuffle: () => void; // <--- NEW SHUFFLE TOGGLE
  
  addToQueue: (track: any) => Promise<void>;
  removeFromQueue: (trackId: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  reorderQueue: (newQueue: any[]) => void;
  
  // NEW CUSTOM NAVIGATION FUNCTIONS
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      queue: [],
      isShuffle: false,

      setCurrentTrack: (track) => set({ currentTrack: track }),
      setPlaying: (state) => set({ isPlaying: state }),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

      addToQueue: async (track) => {
        const { queue } = get();
        if (queue.find(t => t.id === track.id)) return; // Prevent exact duplicates
        
        const newQueue = [...queue, track];
        set({ queue: newQueue });
        await TrackPlayer.add([track]);
      },

      removeFromQueue: async (trackId) => {
        const { queue } = get();
        const newQueue = queue.filter(t => t.id !== trackId);
        set({ queue: newQueue });
        
        // Fully resync native player
        await TrackPlayer.reset();
        await TrackPlayer.add(newQueue);
      },

      clearQueue: async () => {
        set({ queue: [] });
        await TrackPlayer.reset();
      },

      reorderQueue: (newQueue) => {
        set({ queue: newQueue });
      },

      playNext: async () => {
        const { queue, currentTrack, isShuffle, setCurrentTrack } = get();
        if (queue.length === 0) return; // Nothing in queue to skip to!

        let nextTrack;
        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);

        if (isShuffle) {
          // Pick a random song
          const randomIndex = Math.floor(Math.random() * queue.length);
          nextTrack = queue[randomIndex];
        } else {
          // Play next, or loop back to start if at the end
          const nextIndex = currentIndex + 1 >= queue.length ? 0 : currentIndex + 1;
          nextTrack = queue[nextIndex];
        }

        // Force native player to sync and play the targeted track
        await TrackPlayer.reset();
        await TrackPlayer.add(queue);
        const targetIndex = queue.findIndex(t => t.id === nextTrack.id);
        await TrackPlayer.skip(targetIndex);
        await TrackPlayer.play();

        setCurrentTrack(nextTrack);
      },

      playPrevious: async () => {
        const { queue, currentTrack, setCurrentTrack } = get();
        if (queue.length === 0) return;

        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        // Play previous, or loop to the end if at the beginning
        const prevIndex = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
        const prevTrack = queue[prevIndex];

        await TrackPlayer.reset();
        await TrackPlayer.add(queue);
        const targetIndex = queue.findIndex(t => t.id === prevTrack.id);
        await TrackPlayer.skip(targetIndex);
        await TrackPlayer.play();

        setCurrentTrack(prevTrack);
      }
    }),
    {
      name: 'lokal-music-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ queue: state.queue }), 
    }
  )
);