import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  TextInput,
  Alert,
  ListRenderItem,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ListMusic, Plus, X, Play, Trash2, Check } from 'lucide-react-native';
import TrackPlayer from 'react-native-track-player';

import { usePlayerStore, Playlist } from '../store/usePlayerStore';
import MiniPlayer from '../components/MiniPlayer';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { height } = Dimensions.get('window');
const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

// ─── Playlist Detail Sheet ────────────────────────────────────────────────────

interface DetailSheetProps {
  playlist: Playlist | null;
  onClose: () => void;
}

const DetailSheet = ({ playlist, onClose }: DetailSheetProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { setCurrentTrack, setPlaying, addToHistory, removeFromPlaylist } = usePlayerStore();

  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const visible = !!playlist;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const handlePlay = useCallback(async (song: any) => {
    if (!song.url) return;
    const track = { id: song.id, url: song.url, title: song.title, artist: song.artist, artwork: song.artwork };
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

  const handleRemove = (trackId: string) => {
    if (!playlist) return;
    Alert.alert('Remove Song', 'Remove this song from the playlist?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromPlaylist(playlist.id, trackId) },
    ]);
  };

  if (!playlist) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.detailSheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderText}>
            <Text style={styles.detailTitle} numberOfLines={1}>{playlist.name}</Text>
            <Text style={styles.detailCount}>{playlist.songs.length} songs</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={hitSlop}>
            <X color="#52525B" size={20} />
          </TouchableOpacity>
        </View>

        {playlist.songs.length === 0 ? (
          <View style={styles.detailEmpty}>
            <ListMusic color="#3F3F46" size={40} />
            <Text style={styles.detailEmptyText}>No songs yet</Text>
          </View>
        ) : (
          <FlatList
            data={playlist.songs}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.songRow}
                onPress={() => handlePlay(item)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.artwork }} style={styles.songThumb} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <TouchableOpacity
                  hitSlop={hitSlop}
                  onPress={() => handleRemove(item.id)}
                >
                  <Trash2 color="#3F3F46" size={17} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── PlaylistsScreen ──────────────────────────────────────────────────────────

export default function PlaylistsScreen(): React.JSX.Element {
  const { playlists, createPlaylist, deletePlaylist } = usePlayerStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist(newName);
    setNewName('');
    setCreating(false);
  };

  const handleDelete = (pl: Playlist) => {
    Alert.alert('Delete Playlist', `Delete "${pl.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(pl.id) },
    ]);
  };

  const renderPlaylist: ListRenderItem<Playlist> = ({ item }) => {
    const thumbs = item.songs.slice(0, 4);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedPlaylist(item)}
        activeOpacity={0.75}
      >
        {/* 2×2 artwork grid or placeholder */}
        <View style={styles.artworkGrid}>
          {thumbs.length > 0 ? (
            thumbs.map((s, i) => (
              <Image key={i} source={{ uri: s.artwork }} style={styles.gridCell} />
            ))
          ) : (
            <View style={styles.artworkPlaceholder}>
              <ListMusic color="#3F3F46" size={28} />
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardCount}>{item.songs.length} songs</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            hitSlop={hitSlop}
            onPress={() => handleDelete(item)}
            style={styles.cardActionBtn}
          >
            <Trash2 color="#3F3F46" size={16} />
          </TouchableOpacity>
          <Play color="#8B5CF6" size={16} fill="#8B5CF6" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Your Library</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setCreating(true)}
          activeOpacity={0.75}
        >
          <Plus color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>

      {/* New playlist inline input */}
      {creating && (
        <View style={styles.newPlaylistBar}>
          <TextInput
            style={styles.newPlaylistInput}
            placeholder="Playlist name..."
            placeholderTextColor="#52525B"
            value={newName}
            onChangeText={setNewName}
            autoFocus
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleCreate} style={styles.newPlaylistConfirm}>
            <Check color="#8B5CF6" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setCreating(false); setNewName(''); }} style={styles.newPlaylistConfirm}>
            <X color="#52525B" size={20} />
          </TouchableOpacity>
        </View>
      )}

      {playlists.length === 0 && !creating ? (
        <View style={styles.emptyState}>
          <ListMusic color="#27272A" size={52} />
          <Text style={styles.emptyTitle}>No playlists yet</Text>
          <Text style={styles.emptySub}>Tap + to create your first playlist</Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaylist}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <DetailSheet
        playlist={selectedPlaylist}
        onClose={() => setSelectedPlaylist(null)}
      />

      <MiniPlayer />
    </SafeAreaView>
  );
}

const CARD_ART = 72;
const CELL = CARD_ART / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  pageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  newPlaylistBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },

  newPlaylistInput: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },

  newPlaylistConfirm: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    gap: 10,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },

  emptySub: {
    color: '#52525B',
    fontSize: 13,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1C1E',
    padding: 12,
  },

  artworkGrid: {
    width: CARD_ART,
    height: CARD_ART,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1C1C1E',
  },

  gridCell: {
    width: CELL,
    height: CELL,
  },

  artworkPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },

  cardName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },

  cardCount: {
    color: '#71717A',
    fontSize: 12,
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  cardActionBtn: {
    padding: 4,
  },

  // Detail sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  detailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },

  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
    alignSelf: 'center',
    marginBottom: 20,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  detailHeaderText: {
    flex: 1,
  },

  detailTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  detailCount: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },

  detailEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },

  detailEmptyText: {
    color: '#52525B',
    fontSize: 14,
  },

  detailList: {
    paddingBottom: 40,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  songThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },

  songInfo: {
    flex: 1,
    marginLeft: 12,
  },

  songTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },

  songArtist: {
    color: '#71717A',
    fontSize: 12,
  },
});
