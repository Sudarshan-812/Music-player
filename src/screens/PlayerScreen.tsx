import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import TrackPlayer, { useProgress, usePlaybackState, State } from 'react-native-track-player';
import { 
  Play, Pause, SkipBack, SkipForward, ArrowLeft, 
  MoreVertical, RotateCcw, RotateCw, ChevronUp, ListMusic, Shuffle
} from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';

const { width } = Dimensions.get('window');

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function PlayerScreen() {
  const navigation = useNavigation();
  
  const { currentTrack, isShuffle, toggleShuffle, playNext, playPrevious } = usePlayerStore();
  
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

  const jumpForward = async () => {
    const pos = await TrackPlayer.getProgress().then(p => p.position);
    await TrackPlayer.seekTo(pos + 10);
  };
  
  const jumpBackward = async () => {
    const pos = await TrackPlayer.getProgress().then(p => p.position);
    await TrackPlayer.seekTo(Math.max(0, pos - 10));
  };

  if (!currentTrack) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <ArrowLeft color="white" size={28} />
        </TouchableOpacity>
        
        {/* Right side now ONLY has the options menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
            <MoreVertical color="white" size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Album Art */}
      <View style={styles.artworkContainer}>
        <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
      </View>

      {/* Info Row (Shuffle - Title/Artist - Queue) */}
      <View style={styles.infoRowContainer}>
        {/* Left: Shuffle */}
        <TouchableOpacity onPress={toggleShuffle} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          <Shuffle color={isShuffle ? "#FF8216" : "#A0A0A0"} size={24} />
        </TouchableOpacity>

        {/* Center: Info */}
        <View style={styles.infoTextContainer}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        {/* Right: Queue */}
        <TouchableOpacity onPress={() => navigation.navigate('Queue' as never)} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          <ListMusic color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration || currentTrack.duration || 100}
          value={progress.position || 0}
          minimumTrackTintColor="#FF8216"
          maximumTrackTintColor="#404040"
          thumbTintColor="#FF8216"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>{formatTime(progress.duration || currentTrack.duration)}</Text>
        </View>
      </View>

      {/* Main Playback Controls (Restored to 5 symmetrical buttons) */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={playPrevious}>
          <SkipBack color="white" size={32} fill="white" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={jumpBackward}>
          <RotateCcw color="white" size={28} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
          {isPlaying ? (
            <Pause color="white" size={32} fill="white" />
          ) : (
            <Play color="white" size={32} fill="white" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={jumpForward}>
          <RotateCw color="white" size={28} />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext}>
          <SkipForward color="white" size={32} fill="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.lyricsContainer}>
        <ChevronUp color="#A0A0A0" size={20} />
        <Text style={styles.lyricsText}>Lyrics</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181A20' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 10 },
  artworkContainer: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  artwork: { width: width - 48, height: width - 48, borderRadius: 24 },
  
  // NEW INFO ROW STYLES
  infoRowContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 32, 
    marginBottom: 30 
  },
  infoTextContainer: { 
    flex: 1, // Takes up available middle space, pushing buttons to edges
    alignItems: 'center', 
    paddingHorizontal: 16 
  },
  title: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  artist: { color: '#A0A0A0', fontSize: 16, textAlign: 'center' },
  
  progressContainer: { paddingHorizontal: 24, marginBottom: 20 },
  slider: { width: '100%', height: 40 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: -10 },
  timeText: { color: '#A0A0A0', fontSize: 12 },
  
  // Restored symmetrical padding
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, marginTop: 10 },
  playButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF8216', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF8216', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  lyricsContainer: { alignItems: 'center', position: 'absolute', bottom: 20, width: '100%' },
  lyricsText: { color: 'white', fontSize: 14, fontWeight: '600', marginTop: 4 }
});