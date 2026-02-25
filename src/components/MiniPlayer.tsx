import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import TrackPlayer, {
  usePlaybackState,
  State,
} from 'react-native-track-player';
import { usePlayerStore } from '../store/usePlayerStore';

/**
 * Define navigation routes used by this component.
 * Extend this if you add more screens later.
 */
type RootStackParamList = {
  Player: undefined;
};

export default function MiniPlayer(): JSX.Element | null {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { currentTrack } = usePlayerStore();
  const playbackState = usePlaybackState();

  const isPlaying = playbackState.state === State.Playing;

  // Do not render if no track is loaded
  if (!currentTrack) return null;

  /**
   * Toggles playback between play and pause.
   * Preserves existing playback behavior.
   */
  const togglePlayback = useCallback(
    async (_event: GestureResponderEvent): Promise<void> => {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    },
    [isPlaying]
  );

  /**
   * Skips to the next track in queue.
   * Does not modify queue logic.
   */
  const skipNext = useCallback(async (): Promise<void> => {
    await TrackPlayer.skipToNext();
  }, []);

  const handleOpenPlayer = useCallback((): void => {
    navigation.navigate('Player');
  }, [navigation]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={handleOpenPlayer}
    >
      <View style={styles.innerContainer}>
        <Image
          source={{ uri: currentTrack.artwork }}
          style={styles.artwork}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <TouchableOpacity
          onPress={togglePlayback}
          style={styles.controlButton}
          hitSlop={hitSlop}
        >
          {isPlaying ? (
            <Pause color="white" size={26} fill="white" />
          ) : (
            <Play color="white" size={26} fill="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={skipNext}
          style={styles.controlButton}
          hitSlop={hitSlop}
        >
          <SkipForward color="white" size={26} fill="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const hitSlop = { top: 15, bottom: 15, left: 15, right: 15 };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#282A30',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  artist: {
    color: '#A0A0A0',
    fontSize: 13,
    marginTop: 2,
  },
  controlButton: {
    padding: 8,
    marginLeft: 4,
  },
});