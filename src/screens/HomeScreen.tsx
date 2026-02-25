import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, PlusCircle } from 'lucide-react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import TrackPlayer from 'react-native-track-player';

import { searchSongs, Song } from '../api/musicApi';
import { usePlayerStore } from '../store/usePlayerStore';
import MiniPlayer from '../components/MiniPlayer';
import type { RootStackParamList } from '../navigation/AppNavigator';

const defaultArtwork =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80';

const hitSlop = { top: 15, bottom: 15, left: 15, right: 15 };

export default function HomeScreen(): JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [query, setQuery] = useState<string>('');

  // Search State
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Dashboard State
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Song[]>([]);
  const [loadingHome, setLoadingHome] = useState<boolean>(true);

  const { setCurrentTrack, setPlaying, addToQueue } = usePlayerStore();

  /**
   * Boot-up dashboard fetch.
   * Loads recommended, recent, and artist sections in parallel.
   */
  useEffect(() => {
    const fetchHomeDashboard = async (): Promise<void> => {
      setLoadingHome(true);

      try {
        const [recData, recentData, artistData] = await Promise.all([
          searchSongs('top hits', 1),
          searchSongs('latest trending', 1),
          searchSongs('best of', 1),
        ]);

        const uniqueArtists = Array.from(
          new Set(artistData.map((a) => a.artist))
        )
          .map((name) => artistData.find((a) => a.artist === name))
          .filter(Boolean) as Song[];

        setRecommended(recData);
        setRecentlyPlayed(recentData);
        setArtists(uniqueArtists);
      } catch {
        // Silent fail (preserves behavior)
      }

      setLoadingHome(false);
    };

    fetchHomeDashboard();
  }, []);

  /**
   * Executes a fresh search (page = 1).
   */
  const handleSearch = useCallback(async (): Promise<void> => {
    if (!query.trim()) return;

    setIsSearching(true);
    setPage(1);

    const results = await searchSongs(query, 1);
    setSearchResults(results);

    setIsSearching(false);
  }, [query]);

  /**
   * Infinite scroll loader.
   * Loads next page and appends results.
   */
  const loadMoreSongs = useCallback(async (): Promise<void> => {
    if (
      loadingMore ||
      isSearching ||
      searchResults.length === 0 ||
      !query.trim()
    ) {
      return;
    }

    setLoadingMore(true);

    const nextPage = page + 1;
    const newResults = await searchSongs(query, nextPage);

    if (newResults.length > 0) {
      setSearchResults((prev) => [...prev, ...newResults]);
      setPage(nextPage);
    }

    setLoadingMore(false);
  }, [loadingMore, isSearching, searchResults, query, page]);

  /**
   * Resets player and plays selected track.
   * Preserves queue + background playback logic.
   */
  const handlePlaySong = useCallback(
    async (song: Song): Promise<void> => {
      try {
        if (!song.url) {
          alert(
            `Sorry! The API didn't provide an audio link for "${song.title}".`
          );
          return;
        }

        const track = {
          id: song.id,
          url: song.url,
          title: song.title,
          artist: song.artist,
          artwork: song.artwork || defaultArtwork,
        };

        await TrackPlayer.reset();
        await TrackPlayer.add([track]);
        await TrackPlayer.play();

        setCurrentTrack(track);
        setPlaying(true);

        navigation.navigate('Player');
      } catch {
        // Silent fail to preserve behavior
      }
    },
    [navigation, setCurrentTrack, setPlaying]
  );

  const renderSquareCard: ListRenderItem<Song> = ({ item }) => (
    <TouchableOpacity
      style={styles.squareCard}
      onPress={() => handlePlaySong(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.artwork }} style={styles.squareImage} />
      <Text style={styles.squareTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.squareSubtitle} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  const renderCircleCard: ListRenderItem<Song> = ({ item }) => (
    <TouchableOpacity
      style={styles.circleCard}
      onPress={() => handlePlaySong(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.artwork }} style={styles.circleImage} />
      <Text style={styles.circleTitle} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  const renderSearchResult: ListRenderItem<Song> = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handlePlaySong(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.artwork }} style={styles.artwork} />

      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.moreButton}
        hitSlop={hitSlop}
        onPress={() => {
          addToQueue(item);
          alert(`Added "${item.title}" to Queue!`);
        }}
      >
        <PlusCircle color="#A0A0A0" size={24} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.greetingText}>👋 Welcome back!</Text>
        <Text style={styles.subGreeting}>
          What do you want to listen to?
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#A0A0A0" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs..."
          placeholderTextColor="#A0A0A0"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!text) setSearchResults([]);
          }}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {query.trim().length === 0 ? (
        loadingHome ? (
          <ActivityIndicator
            size="large"
            color="#FF8216"
            style={styles.loaderLarge}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dashboardContainer}
          >
            <Text style={styles.sectionTitle}>
              Recommended For You
            </Text>
            <FlatList
              horizontal
              data={recommended}
              keyExtractor={(item, index) =>
                `rec-${item.id}-${index}`
              }
              renderItem={renderSquareCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />

            <Text style={styles.sectionTitle}>
              Recently Played
            </Text>
            <FlatList
              horizontal
              data={recentlyPlayed}
              keyExtractor={(item, index) =>
                `recent-${item.id}-${index}`
              }
              renderItem={renderSquareCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />

            <Text style={styles.sectionTitle}>
              Trending Artists
            </Text>
            <FlatList
              horizontal
              data={artists}
              keyExtractor={(item, index) =>
                `artist-${item.id}-${index}`
              }
              renderItem={renderCircleCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </ScrollView>
        )
      ) : isSearching && page === 1 ? (
        <ActivityIndicator
          size="large"
          color="#FF8216"
          style={styles.loaderLarge}
        />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) =>
            `search-${item.id}-${index}`
          }
          renderItem={renderSearchResult}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreSongs}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#FF8216"
                style={styles.loaderSmall}
              />
            ) : null
          }
        />
      )}

      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181A20' },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greetingText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subGreeting: {
    color: '#A0A0A0',
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282A30',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  squareCard: { width: 130, marginRight: 16, marginBottom: 16 },
  squareImage: {
    width: 130,
    height: 130,
    borderRadius: 12,
    marginBottom: 8,
  },
  squareTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  squareSubtitle: { color: '#A0A0A0', fontSize: 12 },
  circleCard: {
    width: 110,
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 16,
  },
  circleImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  circleTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  artwork: { width: 64, height: 64, borderRadius: 12 },
  songInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: { color: '#A0A0A0', fontSize: 14 },
  moreButton: { padding: 8 },
  dashboardContainer: { paddingBottom: 120 },
  horizontalList: { paddingHorizontal: 16 },
  loaderLarge: { marginTop: 40 },
  loaderSmall: { marginVertical: 20 },
});