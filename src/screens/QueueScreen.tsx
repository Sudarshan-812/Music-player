import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  useNavigation,
  NavigationProp,
} from '@react-navigation/native';
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react-native';

import { usePlayerStore } from '../store/usePlayerStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

type QueueTrack = ReturnType<
  typeof usePlayerStore.getState
>['queue'][number];

const hitSlopLarge = { top: 20, bottom: 20, left: 20, right: 20 };
const hitSlopMedium = { top: 15, bottom: 15, left: 15, right: 15 };

export default function QueueScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();

  const { queue, reorderQueue, removeFromQueue } = usePlayerStore();

  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive,
    }: RenderItemParams<QueueTrack>) => (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.rowItem,
            isActive && styles.rowItemActive,
          ]}
        >
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={100}
            style={styles.dragHandle}
          >
            <GripVertical color="#3F3F46" size={22} />
          </TouchableOpacity>

          <Image
            source={{ uri: item.artwork }}
            style={styles.artwork}
          />

          <View style={styles.songInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => removeFromQueue(item.id)}
            style={styles.deleteButton}
            hitSlop={hitSlopMedium}
          >
            <Trash2 color="#FF453A" size={18} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    ),
    [removeFromQueue]
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: QueueTrack[] }) => {
      reorderQueue(data);
    },
    [reorderQueue]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={navigation.goBack}
          hitSlop={hitSlopLarge}
          style={styles.headerBackBtn}
        >
          <ChevronDown color="#FFFFFF" size={28} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Up Next</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.trackCount}>
        <Text style={styles.trackCountText}>
          {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
        </Text>
      </View>

      {queue.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Queue is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add songs to start building your queue
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          data={queue}
          onDragEnd={handleDragEnd}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },

  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  headerSpacer: {
    width: 40,
  },

  trackCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  trackCountText: {
    color: '#52525B',
    fontSize: 13,
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptySubtitle: {
    color: '#52525B',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },

  listContainer: {
    paddingBottom: 48,
  },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },

  rowItemActive: {
    backgroundColor: '#1C1C1E',
  },

  dragHandle: {
    paddingRight: 14,
    justifyContent: 'center',
  },

  artwork: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },

  songInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  artist: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '400',
  },

  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
