import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, X } from 'lucide-react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import TrackPlayer from 'react-native-track-player';

import { searchSongs, Song } from '../api/musicApi';
import { usePlayerStore } from '../store/usePlayerStore';
import MiniPlayer from '../components/MiniPlayer';
import type { RootStackParamList } from '../navigation/AppNavigator';

const defaultArtwork = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80';

export default function SearchScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setCurrentTrack, setPlaying, addToQueue, addToHistory, history } = usePlayerStore();

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchSongs(query, 1);
        setSearchResults(results);
      } catch {
        // silent fail
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  const handlePlaySong = useCallback(async (song: Song) => {
    if (!song.url) return;
    const track = { ...song, artwork: song.artwork || defaultArtwork };
    setCurrentTrack(track);
    addToHistory(track);
    navigation.navigate('Player');
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();
      setPlaying(true);
    } catch {}
  }, [navigation, setCurrentTrack, setPlaying, addToHistory]);

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => handlePlaySong(item)}>
      <Image source={{ uri: item.artwork }} style={styles.songArtwork} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitleText} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtistText} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity onPress={() => addToQueue(item)} style={styles.actionBtn}>
        <Plus color="#A1A1AA" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Search color="#A1A1AA" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Artists, songs, or podcasts"
            placeholderTextColor="#71717A"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X color="#A1A1AA" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.listWrapper}>
        {isSearching ? (
          <ActivityIndicator color="#8B5CF6" style={styles.loader} />
        ) : (
          <FlatList
            data={query.trim() ? searchResults : history}
            renderItem={renderSongItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              !query.trim() && history.length > 0 ? (
                <Text style={styles.sectionLabel}>Recently Played</Text>
              ) : null
            }
            ListEmptyComponent={
              !query.trim() ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Find something new to listen to.</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No results found for "{query}"</Text>
                </View>
              )
            }
          />
        )}
      </View>

      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#121212',
    paddingBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 8,
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  songArtwork: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  songArtistText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  actionBtn: {
    padding: 8,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717A',
    fontSize: 14,
    fontWeight: '500',
  },
});
