import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import TrackPlayer, {
  usePlaybackState,
  State,
  useProgress,
} from 'react-native-track-player';
import { usePlayerStore } from '../store/usePlayerStore';

type RootStackParamList = {
  Player: undefined;
};

const hitSlop = { top: 16, bottom: 16, left: 16, right: 16 };

export default function MiniPlayer(): React.JSX.Element | null {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { currentTrack, playNext } = usePlayerStore();
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();

  const isPlaying = playbackState.state === State.Playing;
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const togglePlayback = useCallback(async (): Promise<void> => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  const handleOpenPlayer = useCallback((): void => {
    navigation.navigate('Player');
  }, [navigation]);

  if (!currentTrack) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.outerShadowContainer,
        pressed && styles.containerPressed,
      ]}
      onPress={handleOpenPlayer}
    >
      <View style={styles.contentWrapper}>
        <Image
          source={{ uri: currentTrack.artwork }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={40}
        />
        <View style={styles.darkOverlay} />

        <View style={styles.innerContainer}>
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: currentTrack.artwork }}
              style={styles.artwork}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={togglePlayback}
              style={styles.controlBtn}
              hitSlop={hitSlop}
              activeOpacity={0.7}
            >
              {isPlaying ? (
                <Pause color="#FFFFFF" size={22} fill="#FFFFFF" />
              ) : (
                <Play color="#FFFFFF" size={22} fill="#FFFFFF" style={styles.playIconOffset} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playNext}
              style={styles.controlBtn}
              hitSlop={hitSlop}
              activeOpacity={0.7}
            >
              <SkipForward color="#FFFFFF" size={24} fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const textShadowStyle = {
  textShadowColor: 'rgba(0, 0, 0, 0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

const styles = StyleSheet.create({
  outerShadowContainer: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    backgroundColor: '#121212',
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  contentWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  artworkContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#27272A',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
    ...textShadowStyle,
  },
  artist: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 13,
    fontWeight: '500',
    ...textShadowStyle,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 4,
  },
  controlBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOffset: {
    marginLeft: 3,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
