import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { searchSongs, Song } from '../api/musicApi';

// 1. ADD THESE IMPORTS
import TrackPlayer from 'react-native-track-player';
import { usePlayerStore } from '../store/usePlayerStore';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  // 2. GET STORE & NAVIGATION
  const { setCurrentTrack, setPlaying } = usePlayerStore();
  const navigation = useNavigation<any>();

  const handleSearch = async () => {
    if (query.trim().length === 0) return;
    setLoading(true);
    const results = await searchSongs(query);
    setSongs(results);
    setLoading(false);
  };

  // 3. ADD THE PLAY FUNCTION
 const handlePlaySong = async (song: Song) => {
    try {
      // 1. Check if the API actually gave us a working link
      if (!song.url) {
        alert(`Sorry! The API didn't provide an audio link for "${song.title}".`);
        return;
      }

      const track = {
        id: song.id,
        url: song.url, // Using the REAL url now
        title: song.title,
        artist: song.artist,
        artwork: song.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80',
      };

      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();

      setCurrentTrack(track);
      setPlaying(true);

      // Navigate to player
      navigation.navigate('Player');
    } catch (error) {
      console.error("TRACK PLAYER ERROR:", error);
    }
  };

  const renderSong = ({ item }: { item: Song }) => (
    // 4. ADD onPress HERE!
    <TouchableOpacity style={styles.songCard} onPress={() => handlePlaySong(item)}>
      <Image 
        source={{ uri: item.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }} 
        style={styles.artwork} 
      />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Search</Text>
      
      <View style={styles.searchContainer}>
        <Search color="#888" size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search songs, artists..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={styles.loader} />
      ) : (
        <FlatList 
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 16 },
  header: { color: 'white', fontSize: 28, fontWeight: 'bold', marginVertical: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  loader: { marginTop: 40 },
  listContainer: { paddingBottom: 100 },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  artwork: { width: 56, height: 56, borderRadius: 4 },
  songInfo: { marginLeft: 12, flex: 1 },
  songTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  songArtist: { color: '#B3B3B3', fontSize: 14, marginTop: 4 },
});