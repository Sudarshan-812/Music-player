import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import TrackPlayer from 'react-native-track-player';
import { searchSongs } from '../api/musicApi';

const storage = new MMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

const RANDOM_QUERIES = [
  'top hits bollywood',
  'trending english songs',
  'best hindi 2024',
  'popular pop music',
  'chill lofi beats',
  'latest kannada hits',
  'arijit singh hits',
  'top 40 charts',
];

export interface Playlist {
  id: string;
  name: string;
  songs: any[];
  createdAt: number;
}

interface PlayerState {
  currentTrack: any | null;
  isPlaying: boolean;
  queue: any[];
  originalQueue: any[];
  isShuffle: boolean;
  history: any[];
  gapless: boolean;
  normalizeVolume: boolean;
  playlists: Playlist[];

  setCurrentTrack: (track: any) => void;
  setPlaying: (state: boolean) => void;
  toggleShuffle: () => void;
  addToHistory: (track: any) => void;
  clearHistory: () => void;
  setGapless: (v: boolean) => void;
  setNormalizeVolume: (v: boolean) => Promise<void>;

  addToQueue: (track: any) => Promise<void>;
  appendToQueue: (tracks: any[]) => Promise<void>;
  removeFromQueue: (trackId: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  reorderQueue: (newQueue: any[]) => void;

  createPlaylist: (name: string) => string;
  addToPlaylist: (playlistId: string, track: any) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;

  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      queue: [],
      originalQueue: [],
      isShuffle: false,
      history: [],
      gapless: true,
      normalizeVolume: false,
      playlists: [],

      setCurrentTrack: (track) => set({ currentTrack: track }),
      setPlaying: (state) => set({ isPlaying: state }),

      toggleShuffle: () => {
        const { isShuffle, queue, originalQueue } = get();
        if (!isShuffle) {
          const shuffled = [...queue];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          set({ isShuffle: true, originalQueue: [...queue], queue: shuffled });
        } else {
          set({
            isShuffle: false,
            queue: originalQueue.length > 0 ? originalQueue : queue,
            originalQueue: [],
          });
        }
      },

      addToHistory: (track) =>
        set((state) => {
          const filtered = state.history.filter((t) => t.id !== track.id);
          return { history: [track, ...filtered].slice(0, 30) };
        }),

      clearHistory: () => set({ history: [] }),
      setGapless: (v) => set({ gapless: v }),

      setNormalizeVolume: async (v) => {
        set({ normalizeVolume: v });
        await TrackPlayer.setVolume(v ? 0.8 : 1.0);
      },

      addToQueue: async (track) => {
        const { queue } = get();
        if (queue.find((t) => t.id === track.id)) return;
        const newQueue = [...queue, track];
        set({ queue: newQueue });
        await TrackPlayer.add([track]);
      },

      appendToQueue: async (tracks) => {
        const { queue } = get();
        const fresh = tracks.filter((t) => !queue.find((q) => q.id === t.id));
        if (fresh.length === 0) return;
        set({ queue: [...queue, ...fresh] });
        await TrackPlayer.add(fresh);
      },

      removeFromQueue: async (trackId) => {
        const { queue } = get();
        const newQueue = queue.filter((t) => t.id !== trackId);
        set({ queue: newQueue });
        await TrackPlayer.reset();
        await TrackPlayer.add(newQueue);
      },

      clearQueue: async () => {
        set({ queue: [] });
        await TrackPlayer.reset();
      },

      reorderQueue: (newQueue) => set({ queue: newQueue }),

      // ── Playlists ──────────────────────────────────────────────────────────

      createPlaylist: (name) => {
        const id = `pl_${Date.now()}`;
        set((state) => ({
          playlists: [
            ...state.playlists,
            { id, name: name.trim(), songs: [], createdAt: Date.now() },
          ],
        }));
        return id;
      },

      addToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            if (pl.songs.find((s) => s.id === track.id)) return pl;
            return { ...pl, songs: [...pl.songs, track] };
          }),
        }));
      },

      removeFromPlaylist: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((pl) =>
            pl.id !== playlistId
              ? pl
              : { ...pl, songs: pl.songs.filter((s) => s.id !== trackId) }
          ),
        }));
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          playlists: state.playlists.filter((pl) => pl.id !== playlistId),
        }));
      },

      // ── Playback ───────────────────────────────────────────────────────────

      playNext: async () => {
        const { queue, currentTrack, isShuffle, setCurrentTrack } = get();

        const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
        const isAtEnd = queue.length === 0 || currentIndex + 1 >= queue.length;

        if (isAtEnd) {
          // Fetch a random song and keep playing
          try {
            const query = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
            const page = Math.floor(Math.random() * 3) + 1;
            const songs = await searchSongs(query, page);
            if (songs.length === 0) return;

            const song = songs[Math.floor(Math.random() * songs.length)];
            const track = {
              id: song.id,
              url: song.url,
              title: song.title,
              artist: song.artist,
              artwork: song.artwork,
            };

            const newQueue = [...queue, track];
            set({ queue: newQueue });

            await TrackPlayer.reset();
            await TrackPlayer.add(newQueue);
            await TrackPlayer.skip(newQueue.length - 1);
            await TrackPlayer.play();

            setCurrentTrack(track);
          } catch {}
          return;
        }

        let nextTrack;
        if (isShuffle) {
          nextTrack = queue[Math.floor(Math.random() * queue.length)];
        } else {
          nextTrack = queue[currentIndex + 1];
        }

        await TrackPlayer.reset();
        await TrackPlayer.add(queue);
        await TrackPlayer.skip(queue.findIndex((t) => t.id === nextTrack.id));
        await TrackPlayer.play();

        setCurrentTrack(nextTrack);
      },

      playPrevious: async () => {
        const { queue, currentTrack, setCurrentTrack } = get();
        if (queue.length === 0) return;

        const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
        const prevIndex = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
        const prevTrack = queue[prevIndex];

        await TrackPlayer.reset();
        await TrackPlayer.add(queue);
        await TrackPlayer.skip(prevIndex);
        await TrackPlayer.play();

        setCurrentTrack(prevTrack);
      },
    }),
    {
      name: 'lokal-music-v2',
      version: 1,
      migrate: (persisted: any) => {
        // Wipe any playlists that don't have the correct shape
        // (catches stale data from previous testing sessions)
        const rawPlaylists: any[] = persisted?.playlists ?? [];
        const validPlaylists = rawPlaylists.filter(
          (pl) =>
            pl &&
            typeof pl.id === 'string' &&
            typeof pl.name === 'string' &&
            Array.isArray(pl.songs) &&
            typeof pl.createdAt === 'number'
        );
        return { ...persisted, playlists: validPlaylists };
      },
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        queue: state.queue,
        history: state.history,
        gapless: state.gapless,
        normalizeVolume: state.normalizeVolume,
        playlists: state.playlists,
      }),
    }
  )
);
