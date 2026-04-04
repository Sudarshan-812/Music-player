import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  User,
  Shuffle,
  Volume2,
  Clock,
  Shield,
  Info,
  Code2,
  Music2,
  Trash2,
} from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import MiniPlayer from '../components/MiniPlayer';

interface RowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  rightLabel?: string;
  danger?: boolean;
}

const Row = ({ icon, title, subtitle, value, onToggle, onPress, rightLabel, danger }: RowProps) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.65 : 1}
    disabled={!onPress && !onToggle}
  >
    {/* Removed iconBg and background styling from the wrapper */}
    <View style={styles.iconWrap}>
      {icon}
    </View>

    <View style={styles.rowText}>
      <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
    </View>

    {onToggle !== undefined ? (
      <Switch
        trackColor={{ false: '#3F3F46', true: '#8B5CF6' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#3F3F46"
        onValueChange={onToggle}
        value={value ?? false}
      />
    ) : rightLabel ? (
      <Text style={styles.rightLabel}>{rightLabel}</Text>
    ) : onPress ? (
      <ChevronRight color="#52525B" size={18} />
    ) : null}
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

export default function SettingsScreen(): React.JSX.Element {
  const {
    isShuffle, toggleShuffle,
    history, clearHistory,
    gapless, setGapless,
    normalizeVolume, setNormalizeVolume,
  } = usePlayerStore();

  const iconColor = '#A1A1AA';
  const iconSize = 20;

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will remove all recently played songs.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.pageTitle}>Settings</Text>

        {/* PROFILE CARD */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <User color="#FFFFFF" size={24} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Sudarshan</Text>
            <Text style={styles.profileSub}>View account</Text>
          </View>
          <ChevronRight color="#52525B" size={20} />
        </TouchableOpacity>

        {/* PLAYBACK */}
        <Text style={styles.sectionLabel}>Playback</Text>
        <View style={styles.group}>
          <Row
            icon={<Shuffle color={iconColor} size={iconSize} />}
            title="Shuffle"
            subtitle="Randomise play order"
            value={isShuffle}
            onToggle={toggleShuffle}
          />
          <Divider />
          <Row
            icon={<Music2 color={iconColor} size={iconSize} />}
            title="Gapless Playback"
            subtitle="No silence between tracks"
            value={gapless}
            onToggle={(v) => setGapless(v)}
          />
          <Divider />
          <Row
            icon={<Volume2 color={iconColor} size={iconSize} />}
            title="Normalize Volume"
            subtitle="Equalise loudness across songs"
            value={normalizeVolume}
            onToggle={(v) => setNormalizeVolume(v)}
          />
        </View>

        {/* DATA */}
        <Text style={styles.sectionLabel}>Data & Storage</Text>
        <View style={styles.group}>
          <Row
            icon={<Clock color={iconColor} size={iconSize} />}
            title="Listening History"
            subtitle={`${history.length} song${history.length !== 1 ? 's' : ''} played`}
            rightLabel={`${history.length}`}
          />
          <Divider />
          <Row
            icon={<Trash2 color="#EF4444" size={iconSize} />} // Keep danger icon red for UX
            title="Clear History"
            onPress={handleClearHistory}
            danger
          />
        </View>

        {/* PRIVACY */}
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.group}>
          <Row
            icon={<Shield color={iconColor} size={iconSize} />}
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        {/* ABOUT */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <Row
            icon={<Code2 color={iconColor} size={iconSize} />}
            title="Source Code"
            onPress={() => {}}
          />
          <Divider />
          <Row
            icon={<Info color={iconColor} size={iconSize} />}
            title="Version"
            rightLabel="1.0.0"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingBottom: 120,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27272A', // Zinc-800
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  profileSub: {
    color: '#71717A',
    fontSize: 13,
    marginTop: 2,
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  group: {
    marginHorizontal: 16,
    marginBottom: 28,
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1C1C1E',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 58,
  },
  iconWrap: {
    width: 28, // Reduced width since we don't have boxes anymore
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  rowTitleDanger: {
    color: '#EF4444',
  },
  rowSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  rightLabel: {
    color: '#71717A',
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1C1C1E',
    marginLeft: 54, // Adjusted to line up with text after icon resize
  },
  bottomSpacer: {
    height: 20,
  },
});