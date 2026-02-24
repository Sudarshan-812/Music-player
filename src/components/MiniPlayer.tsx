import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import { usePlayerStore } from '../store/usePlayerStore';

export default function MiniPlayer() {
  const navigation = useNavigation<any>();
  const { currentTrack } = usePlayerStore();
  const playbackState = usePlaybackState();
  
  const isPlaying = playbackState.state === State.Playing;

  // If no song is loaded, don't show the Mini Player at all!
  if (!currentTrack) return null;

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const skipNext = async () => {
    await TrackPlayer.skipToNext();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.95}
      onPress={() => navigation.navigate('Player')} // Tap to open Full Player
    >
      <View style={styles.innerContainer}>
        <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        <TouchableOpacity onPress={togglePlayback} style={styles.controlButton} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          {isPlaying ? (
            <Pause color="white" size={26} fill="white" />
          ) : (
            <Play color="white" size={26} fill="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={skipNext} style={styles.controlButton} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          <SkipForward color="white" size={26} fill="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16, // Floats slightly above the bottom of the screen
    left: 16,
    right: 16,
    backgroundColor: '#282A30', // Matches the Figma Search Bar background
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
  }
});