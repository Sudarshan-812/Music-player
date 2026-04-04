import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  ListRenderItem,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import TrackPlayer from 'react-native-track-player';
import { Bell, Settings } from 'lucide-react-native';

import { searchSongs, Song } from '../api/musicApi';
import { usePlayerStore } from '../store/usePlayerStore';
import MiniPlayer from '../components/MiniPlayer';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const defaultArtwork = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [focusFlow, setFocusFlow] = useState<Song[]>([]);
  const [localTrending, setLocalTrending] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Song[]>([]);
  const [loadingHome, setLoadingHome] = useState<boolean>(true);

  const { setCurrentTrack, setPlaying, addToHistory } = usePlayerStore();

  useEffect(() => {
    const fetchHomeDashboard = async (): Promise<void> => {
      setLoadingHome(true);
      try {
        const [quickData, focusData, localData] = await Promise.all([
          searchSongs('bansuri flute instrumental relaxing', 1),
          searchSongs('deep focus lofi coding', 1),
          searchSongs('kannada chartbusters', 1),
        ]);

        const combinedForArtists = [...quickData, ...focusData, ...localData];
        const uniqueArtists = Array.from(
          new Set(combinedForArtists.map((a) => a.artist))
        )
          .map((name) => combinedForArtists.find((a) => a.artist === name))
          .filter(Boolean) as Song[];

        setQuickPicks(quickData.slice(0, 6));
        setFocusFlow(focusData);
        setLocalTrending(localData);
        setArtists(uniqueArtists.slice(0, 10));
      } catch {
        // silent fail
      } finally {
        setLoadingHome(false);
      }
    };

    fetchHomeDashboard();
  }, []);

  const handlePlaySong = useCallback(
    async (song: Song): Promise<void> => {
      if (!song.url) return;

      const track = {
        id: song.id,
        url: song.url,
        title: song.title,
        artist: song.artist,
        artwork: song.artwork || defaultArtwork,
      };

      setCurrentTrack(track);
      addToHistory(track);
      navigation.navigate('Player');

      try {
        await TrackPlayer.reset();
        await TrackPlayer.add([track]);
        await TrackPlayer.play();
        setPlaying(true);
      } catch {}
    },
    [navigation, setCurrentTrack, setPlaying, addToHistory]
  );

  const renderQuickPick = (item: Song, index: number) => (
    <TouchableOpacity
      key={`quick-${item.id}-${index}`}
      style={styles.quickPickCard}
      onPress={() => handlePlaySong(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.artwork }} style={styles.quickPickImage} />
      <Text style={styles.quickPickTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderSquareCard: ListRenderItem<Song> = ({ item }) => (
    <TouchableOpacity
      style={styles.squareCard}
      onPress={() => handlePlaySong(item)}
      activeOpacity={0.7}
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
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.artwork }} style={styles.circleImage} />
      <Text style={styles.circleTitle} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Bell color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Settings color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {loadingHome ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Curating your vibe...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.dashboardContainer}
        >
          <View style={styles.quickPicksContainer}>
            {quickPicks.map((item, index) => renderQuickPick(item, index))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Deep Focus</Text>
          </View>
          <FlatList
            horizontal
            data={focusFlow}
            keyExtractor={(item, index) => `focus-${item.id}-${index}`}
            renderItem={renderSquareCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending in Karnataka</Text>
          </View>
          <FlatList
            horizontal
            data={localTrending}
            keyExtractor={(item, index) => `local-${item.id}-${index}`}
            renderItem={renderSquareCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artists For You</Text>
          </View>
          <FlatList
            horizontal
            data={artists}
            keyExtractor={(item, index) => `artist-${item.id}-${index}`}
            renderItem={renderCircleCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </ScrollView>
      )}

      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  dashboardContainer: {
    paddingBottom: 140,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickPicksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  quickPickCard: {
    width: (width - 40) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 6,
    overflow: 'hidden',
  },
  quickPickImage: {
    width: 56,
    height: 56,
  },
  quickPickTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  squareCard: {
    width: 140,
    marginRight: 16,
  },
  squareImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#27272A',
  },
  squareTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  squareSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '400',
  },
  circleCard: {
    width: 104,
    alignItems: 'center',
    marginRight: 16,
  },
  circleImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 10,
    backgroundColor: '#27272A',
  },
  circleTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
