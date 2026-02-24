import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import TrackPlayer, { useProgress, usePlaybackState, State } from 'react-native-track-player';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Shuffle, Repeat } from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';

const { width } = Dimensions.get('window');

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function PlayerScreen() {
  const navigation = useNavigation();
  const { currentTrack } = usePlayerStore();
  
  const progress = useProgress();
  const playbackState = usePlaybackState();
  
  const isPlaying = playbackState.state === State.Playing;

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const handleSeek = async (value: number) => {
    await TrackPlayer.seekTo(value);
  };

  const handleNext = async () => {
    await TrackPlayer.skipToNext();
  };

  const handlePrevious = async () => {
    await TrackPlayer.skipToPrevious();
  };

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No track selected</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronDown color="white" size={32} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.artworkContainer}>
        <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration || currentTrack.duration || 100}
          value={progress.position || 0}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#404040"
          thumbTintColor="#1DB954"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>
            {formatTime((progress.duration || currentTrack.duration) - progress.position)}
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity>
          <Shuffle color="#B3B3B3" size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handlePrevious}>
          <SkipBack color="white" size={36} fill="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
          {isPlaying ? (
            <Pause color="black" size={32} fill="black" />
          ) : (
            <Play color="black" size={32} fill="black" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext}>
          <SkipForward color="white" size={36} fill="white" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Repeat color="#B3B3B3" size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  artwork: {
    width: width - 64,
    height: width - 64,
    borderRadius: 12,
  },
  infoContainer: { paddingHorizontal: 32, marginBottom: 30 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  artist: { color: '#B3B3B3', fontSize: 18 },
  progressContainer: { paddingHorizontal: 24, marginBottom: 20 },
  slider: { width: '100%', height: 40 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: -10 },
  timeText: { color: '#B3B3B3', fontSize: 12 },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 10,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: 'white' }
});