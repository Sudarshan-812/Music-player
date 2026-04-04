import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import TrackPlayer, {
  useProgress,
  usePlaybackState,
  State,
} from 'react-native-track-player';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  MoreHorizontal,
  RotateCcw,
  RotateCw,
  ChevronUp,
  ListMusic,
  Shuffle,
  ListPlus,
  Mic2,
  Timer,
  X,
  Plus,
  Check,
} from 'lucide-react-native';

import { usePlayerStore, Playlist } from '../store/usePlayerStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

const hitSlopLarge = { top: 20, bottom: 20, left: 20, right: 20 };
const hitSlopMedium = { top: 15, bottom: 15, left: 15, right: 15 };

const formatTime = (seconds: number): string => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// ─── LRC lyrics parser ────────────────────────────────────────────────────────

interface LyricsLine {
  time: number; // seconds
  text: string;
}

function parseLRC(lrc: string): LyricsLine[] {
  const result: LyricsLine[] = [];
  const timeRe = /\[(\d{2}):(\d{2})[.:'](\d{2,3})\]/;
  for (const raw of lrc.split('\n')) {
    const m = timeRe.exec(raw);
    if (!m) continue;
    const time = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + parseInt(m[3].padEnd(3, '0'), 10) / 1000;
    const text = raw.replace(timeRe, '').trim();
    if (text) result.push({ time, text });
  }
  return result;
}

// ─── Equalizer ───────────────────────────────────────────────────────────────

const EqBar = ({ isPlaying, duration, delay }: { isPlaying: boolean; duration: number; delay: number }) => {
  const scaleY = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1, duration, delay, useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.2, duration, useNativeDriver: true }),
        ])
      );
      animation.start();
    } else {
      Animated.timing(scaleY, { toValue: 0.2, duration: 300, useNativeDriver: true }).start();
    }
    return () => { if (animation) animation.stop(); };
  }, [isPlaying, duration, delay, scaleY]);

  return <Animated.View style={[styles.eqBar, { transform: [{ scaleY }] }]} />;
};

const Equalizer = ({ isPlaying }: { isPlaying: boolean }) => (
  <View style={styles.eqContainer}>
    <EqBar isPlaying={isPlaying} duration={300} delay={0} />
    <EqBar isPlaying={isPlaying} duration={400} delay={100} />
    <EqBar isPlaying={isPlaying} duration={250} delay={50} />
    <EqBar isPlaying={isPlaying} duration={450} delay={150} />
    <EqBar isPlaying={isPlaying} duration={350} delay={0} />
  </View>
);

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

interface SheetRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

const SheetRow = ({ icon, label, onPress }: SheetRowProps) => (
  <TouchableOpacity style={styles.sheetRow} onPress={onPress} activeOpacity={0.65}>
    <View style={styles.sheetRowIcon}>{icon}</View>
    <Text style={styles.sheetRowLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Animated sheet helper ───────────────────────────────────────────────────

function useSheetAnim(visible: boolean) {
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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

  return { translateY, backdropOpacity };
}

// ─── Playlist Picker Sheet ────────────────────────────────────────────────────

interface PlaylistPickerProps {
  visible: boolean;
  track: any;
  onClose: () => void;
}

const PlaylistPickerSheet = ({ visible, track, onClose }: PlaylistPickerProps) => {
  const { translateY, backdropOpacity } = useSheetAnim(visible);
  const { playlists, createPlaylist, addToPlaylist } = usePlayerStore();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const handleAdd = (pl: Playlist) => {
    addToPlaylist(pl.id, track);
    setAddedIds((prev) => [...prev, pl.id]);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName);
    addToPlaylist(id, track);
    setNewName('');
    setCreating(false);
    setAddedIds((prev) => [...prev, id]);
  };

  if (!track) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add to Playlist</Text>
          <TouchableOpacity onPress={onClose} hitSlop={hitSlopLarge}>
            <X color="#52525B" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.sheetDivider} />

        {/* New playlist row */}
        {creating ? (
          <View style={styles.newPlaylistRow}>
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
          </View>
        ) : (
          <TouchableOpacity style={styles.sheetRow} onPress={() => setCreating(true)} activeOpacity={0.65}>
            <View style={[styles.sheetRowIcon, { backgroundColor: '#8B5CF6' }]}>
              <Plus color="#FFFFFF" size={18} />
            </View>
            <Text style={styles.sheetRowLabel}>New Playlist</Text>
          </TouchableOpacity>
        )}

        {playlists.length > 0 && <View style={styles.sheetDivider} />}

        {playlists.map((pl) => {
          const added = addedIds.includes(pl.id);
          return (
            <TouchableOpacity
              key={pl.id}
              style={styles.sheetRow}
              onPress={() => !added && handleAdd(pl)}
              activeOpacity={0.65}
            >
              <View style={styles.playlistPickerThumb}>
                {pl.songs[0]?.artwork ? (
                  <Image source={{ uri: pl.songs[0].artwork }} style={styles.playlistPickerImg} />
                ) : (
                  <ListMusic color="#52525B" size={18} />
                )}
              </View>
              <View style={styles.playlistPickerInfo}>
                <Text style={styles.sheetRowLabel} numberOfLines={1}>{pl.name}</Text>
                <Text style={styles.playlistPickerCount}>{pl.songs.length} songs</Text>
              </View>
              {added && <Check color="#8B5CF6" size={18} />}
            </TouchableOpacity>
          );
        })}

        <View style={styles.sheetBottomSpacer} />
      </Animated.View>
    </Modal>
  );
};

// ─── Main Bottom Sheet ────────────────────────────────────────────────────────

interface BottomSheetProps {
  visible: boolean;
  track: any;
  onClose: () => void;
  onAddToPlaylist: () => void;
  onAddToQueue: () => void;
  queueAdded: boolean;
}

const BottomSheet = ({ visible, track, onClose, onAddToPlaylist, onAddToQueue, queueAdded }: BottomSheetProps) => {
  const { translateY, backdropOpacity } = useSheetAnim(visible);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Listening to "${track?.title}" by ${track?.artist} on Lokal Music 🎵` });
    } catch {}
    onClose();
  };

  if (!track) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetTrackInfo}>
          <Image source={{ uri: track.artwork }} style={styles.sheetArtwork} />
          <View style={styles.sheetTrackText}>
            <Text style={styles.sheetTrackTitle} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.sheetTrackArtist} numberOfLines={1}>{track.artist}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={hitSlopLarge}>
            <X color="#52525B" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.sheetDivider} />

        <SheetRow
          icon={<ListPlus color="#FFFFFF" size={20} />}
          label="Add to Playlist"
          onPress={() => { onClose(); onAddToPlaylist(); }}
        />
        <SheetRow
          icon={
            queueAdded
              ? <Check color="#8B5CF6" size={20} />
              : <ListMusic color="#FFFFFF" size={20} />
          }
          label={queueAdded ? 'Added to Queue' : 'Add to Queue'}
          onPress={onAddToQueue}
        />
        <SheetRow
          icon={<Mic2 color="#FFFFFF" size={20} />}
          label="View Artist"
          onPress={onClose}
        />
        <SheetRow
          icon={<Timer color="#FFFFFF" size={20} />}
          label="Sleep Timer"
          onPress={onClose}
        />
        <SheetRow
          icon={<SkipForward color="#FFFFFF" size={20} />}
          label="Share"
          onPress={handleShare}
        />

        <View style={styles.sheetBottomSpacer} />
      </Animated.View>
    </Modal>
  );
};

// ─── PlayerScreen ─────────────────────────────────────────────────────────────

export default function PlayerScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);

  const { currentTrack, isShuffle, toggleShuffle, playNext, playPrevious, appendToQueue } = usePlayerStore();
  const [queueAdded, setQueueAdded] = useState(false);

  // ── Lyrics ──────────────────────────────────────────────────────────────────
  const [syncedLines, setSyncedLines] = useState<LyricsLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const lastFetchedId = useRef<string | null>(null);
  const lyricsScrollRef = useRef<ScrollView>(null);
  const lineOffsets = useRef<number[]>([]);
  const userScrollingLyrics = useRef(false);

  const fetchLyrics = useCallback(async (artist: string, title: string, id: string) => {
    if (lastFetchedId.current === id) return;
    lastFetchedId.current = id;
    setLyricsLoading(true);
    setLyricsError(false);
    setSyncedLines([]);
    setPlainLyrics(null);
    try {
      const res = await fetch(
        `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
      );
      if (!res.ok) { setLyricsError(true); return; }
      const data = await res.json();
      if (data.syncedLyrics) {
        setSyncedLines(parseLRC(data.syncedLyrics));
      } else if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics);
      } else {
        setLyricsError(true);
      }
    } catch {
      setLyricsError(true);
    } finally {
      setLyricsLoading(false);
    }
  }, []);

  // Auto-fetch when track changes
  useEffect(() => {
    if (!currentTrack) return;
    lastFetchedId.current = null;
    lineOffsets.current = [];
    setSyncedLines([]);
    setPlainLyrics(null);
    setLyricsError(false);
    setLyricsExpanded(false);
    fetchLyrics(currentTrack.artist, currentTrack.title, currentTrack.id);
  }, [currentTrack?.id, fetchLyrics]);
  // ────────────────────────────────────────────────────────────────────────────

  const progress = useProgress();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  // ── Seek slider (local value while dragging so progress doesn't fight) ──────
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  // Current highlighted line index
  const currentLineIndex = useMemo(() => {
    if (!syncedLines.length) return -1;
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].time <= progress.position) idx = i;
      else break;
    }
    return idx;
  }, [syncedLines, progress.position]);

  // Auto-scroll lyrics to active line
  useEffect(() => {
    if (!lyricsExpanded || currentLineIndex < 0 || userScrollingLyrics.current) return;
    const lineY = lineOffsets.current[currentLineIndex];
    if (lineY === undefined) return;
    lyricsScrollRef.current?.scrollTo({ y: Math.max(0, lineY - 140), animated: true });
  }, [currentLineIndex, lyricsExpanded]);

  const handleAddToQueue = useCallback(async () => {
    if (!currentTrack) return;
    await appendToQueue([currentTrack]);
    setQueueAdded(true);
    setTimeout(() => setQueueAdded(false), 800);
  }, [currentTrack, appendToQueue]);

  const togglePlayback = useCallback(async (): Promise<void> => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback(async (value: number): Promise<void> => {
    await TrackPlayer.seekTo(value);
  }, []);

  const jumpForward = useCallback(async (): Promise<void> => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(position + 10);
  }, []);

  const jumpBackward = useCallback(async (): Promise<void> => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, position - 10));
  }, []);

  if (!currentTrack) {
    return (
      <View style={styles.mainContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={navigation.goBack} hitSlop={hitSlopLarge} style={styles.headerIconBtn}>
              <ChevronDown color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Image
        source={{ uri: currentTrack.artwork }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={60}
      />
      <View style={styles.darkOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack} hitSlop={hitSlopLarge} style={styles.headerIconBtn}>
            <ChevronDown color="#FFFFFF" size={22} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>Now Playing</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSheetVisible(true)}
            hitSlop={hitSlopLarge}
            style={styles.headerIconBtn}
          >
            <MoreHorizontal color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* TOP SECTION — artwork OR lyrics (Spotify-style swap) */}
        <View style={styles.topSection}>
          {lyricsExpanded ? (
            /* ── LYRICS VIEW ── */
            <View style={styles.lyricsContainer}>
              {/* Close bar */}
              <TouchableOpacity
                style={styles.lyricsCloseRow}
                onPress={() => setLyricsExpanded(false)}
                activeOpacity={0.7}
              >
                <View style={styles.lyricsCloseChip}>
                  <ChevronDown color="#FFFFFF" size={16} />
                  <Text style={styles.lyricsCloseLabel}>Close Lyrics</Text>
                </View>
              </TouchableOpacity>

              {lyricsLoading && (
                <View style={styles.lyricsCenterState}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}

              {lyricsError && !lyricsLoading && (
                <View style={styles.lyricsCenterState}>
                  <Text style={styles.lyricsErrorText}>
                    Looks like we don't have the lyrics for this song.
                  </Text>
                </View>
              )}

              {(syncedLines.length > 0 || (plainLyrics && !lyricsLoading)) && (
                <ScrollView
                  ref={lyricsScrollRef}
                  style={styles.lyricsScroll}
                  contentContainerStyle={styles.lyricsContent}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScrollBeginDrag={() => { userScrollingLyrics.current = true; }}
                  onScrollEndDrag={() => { setTimeout(() => { userScrollingLyrics.current = false; }, 2500); }}
                >
                  {syncedLines.map((line, i) => (
                    <View
                      key={`${currentTrack.id}-${i}`}
                      onLayout={(e) => { lineOffsets.current[i] = e.nativeEvent.layout.y; }}
                    >
                      <Text style={[
                        styles.lyricsLine,
                        i === currentLineIndex ? styles.lyricsLineActive : styles.lyricsLineInactive,
                      ]}>
                        {line.text}
                      </Text>
                    </View>
                  ))}
                  {!syncedLines.length && plainLyrics && (
                    <Text style={styles.lyricsPlain}>{plainLyrics}</Text>
                  )}
                  <View style={{ height: 60 }} />
                </ScrollView>
              )}
            </View>
          ) : (
            /* ── ARTWORK VIEW ── */
            <>
              <View style={styles.artworkContainer}>
                <View style={styles.artworkShadow}>
                  <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
                </View>
              </View>
              <Equalizer isPlaying={isPlaying} />
            </>
          )}
        </View>

        {/* BOTTOM CONTROLS */}
        <View style={styles.bottomSection}>
          <View style={styles.infoRowContainer}>
            <TouchableOpacity onPress={toggleShuffle} hitSlop={hitSlopMedium} style={styles.infoSideBtn}>
              <Shuffle color={isShuffle ? '#8B5CF6' : '#FFFFFF'} size={18} />
            </TouchableOpacity>

            <View style={styles.infoTextContainer}>
              <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Queue')} hitSlop={hitSlopMedium} style={styles.infoSideBtn}>
              <ListMusic color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={progress.duration || currentTrack.duration || 100}
              value={isSeeking ? seekValue : (progress.position || 0)}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor="#FFFFFF"
              onValueChange={(v) => { setIsSeeking(true); setSeekValue(v); }}
              onSlidingComplete={async (v) => {
                setIsSeeking(false);
                await TrackPlayer.seekTo(v);
              }}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(isSeeking ? seekValue : progress.position)}</Text>
              <Text style={styles.timeText}>{formatTime(progress.duration || currentTrack.duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={playPrevious} hitSlop={hitSlopMedium} style={styles.controlBtn}>
              <SkipBack color="#FFFFFF" size={28} fill="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={jumpBackward} hitSlop={hitSlopMedium} style={styles.controlBtn}>
              <RotateCcw color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayback} style={styles.playButton} activeOpacity={0.85}>
              {isPlaying ? (
                <Pause color="#000000" size={28} fill="#000000" />
              ) : (
                <Play color="#000000" size={28} fill="#000000" style={styles.playIconOffset} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={jumpForward} hitSlop={hitSlopMedium} style={styles.controlBtn}>
              <RotateCw color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <TouchableOpacity onPress={playNext} hitSlop={hitSlopMedium} style={styles.controlBtn}>
              <SkipForward color="#FFFFFF" size={28} fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* LYRICS HANDLE — only shown in artwork view */}
        {!lyricsExpanded && (
          <TouchableOpacity style={styles.lyricsHandle} onPress={() => setLyricsExpanded(true)}>
            <ChevronUp color="#FFFFFF" size={18} />
            <Text style={styles.lyricsText}>Lyrics</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <BottomSheet
        visible={sheetVisible}
        track={currentTrack}
        onClose={() => setSheetVisible(false)}
        onAddToPlaylist={() => setPlaylistPickerVisible(true)}
        onAddToQueue={handleAddToQueue}
        queueAdded={queueAdded}
      />
      <PlaylistPickerSheet
        visible={playlistPickerVisible}
        track={currentTrack}
        onClose={() => setPlaylistPickerVisible(false)}
      />
    </View>
  );
}

const ARTWORK_SIZE = width - 88;

const textShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.6)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 6,
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    ...textShadow,
  },

  // Top section (artwork or lyrics)
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  artworkShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 24,
    borderRadius: 24,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 24,
  },

  // Equalizer
  eqContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 22,
    gap: 3,
    marginTop: 32,
  },
  eqBar: {
    width: 3,
    height: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transformOrigin: 'bottom',
  },

  // Controls
  bottomSection: {
    paddingBottom: 20,
  },
  infoRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  infoSideBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
    ...textShadow,
  },
  trackArtist: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    ...textShadow,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: -8,
  },
  timeText: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 12,
    fontWeight: '600',
    ...textShadow,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  playIconOffset: {
    marginLeft: 3,
  },

  // Lyrics
  lyricsHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  lyricsText: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
    ...textShadow,
  },

  // ── Bottom Sheet ──────────────────────────────────────────────────────────
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTrackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetArtwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  sheetTrackText: {
    flex: 1,
    marginLeft: 12,
  },
  sheetTrackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetTrackArtist: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 2,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#27272A',
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sheetRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sheetRowLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  sheetBottomSpacer: {
    height: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  newPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  newPlaylistInput: {
    flex: 1,
    backgroundColor: '#27272A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  newPlaylistConfirm: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistPickerThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  playlistPickerImg: {
    width: 44,
    height: 44,
  },
  playlistPickerInfo: {
    flex: 1,
  },
  playlistPickerCount: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },

  // ── Lyrics ───────────────────────────────────────────────────────────────────
  lyricsContainer: {
    flex: 1,
    width: '100%',
  },
  lyricsCloseRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
  },
  lyricsCloseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  lyricsCloseLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 28,
  },
  lyricsCenterState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  lyricsErrorText: {
    color: '#71717A',
    fontSize: 15,
    textAlign: 'left',
    lineHeight: 22,
  },
  lyricsLine: {
    marginBottom: 18,
    lineHeight: 38,
  },
  lyricsLineActive: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    opacity: 1,
  },
  lyricsLineInactive: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    opacity: 0.25,
  },
  lyricsPlain: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 30,
    opacity: 0.85,
  },
});
