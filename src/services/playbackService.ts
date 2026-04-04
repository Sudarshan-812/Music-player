import TrackPlayer, { Event } from 'react-native-track-player';
import { usePlayerStore } from '../store/usePlayerStore';
import { searchSongs } from '../api/musicApi';

const AUTO_PLAY_QUERIES = [
  'top hits bollywood',
  'trending english songs',
  'best hindi 2024',
  'popular pop music',
  'chill lofi beats',
  'latest kannada hits',
];

export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    usePlayerStore.getState().playNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().playPrevious();
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    try {
      const query = AUTO_PLAY_QUERIES[Math.floor(Math.random() * AUTO_PLAY_QUERIES.length)];
      const songs = await searchSongs(query, 1);
      const newTracks = songs.slice(0, 5).map((s) => ({
        id: s.id,
        url: s.url,
        title: s.title,
        artist: s.artist,
        artwork: s.artwork,
      }));

      if (newTracks.length > 0) {
        await usePlayerStore.getState().appendToQueue(newTracks);
        await TrackPlayer.play();
      }
    } catch {}
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async () => {
    const { normalizeVolume } = usePlayerStore.getState();
    await TrackPlayer.setVolume(normalizeVolume ? 0.8 : 1.0);
  });
};
