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
import { ArrowLeft, GripVertical, Trash2 } from 'lucide-react-native';

import { usePlayerStore } from '../store/usePlayerStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

/**
 * Track type inferred from Zustand queue state.
 * Keeps it consistent with store structure.
 */
type QueueTrack = ReturnType<
  typeof usePlayerStore.getState
>['queue'][number];

const hitSlopLarge = { top: 20, bottom: 20, left: 20, right: 20 };
const hitSlopMedium = { top: 15, bottom: 15, left: 15, right: 15 };

export default function QueueScreen(): JSX.Element {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();

  const { queue, reorderQueue, removeFromQueue } =
    usePlayerStore();

  /**
   * Renders a draggable queue item.
   * Drag behavior and removal logic remain unchanged.
   */
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
            {
              backgroundColor: isActive
                ? '#282A30'
                : 'transparent',
            },
          ]}
        >
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={100}
            style={styles.dragHandle}
          >
            <GripVertical color="#A0A0A0" size={24} />
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
            <Trash2 color="#FF4444" size={20} />
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
        >
          <ArrowLeft color="white" size={28} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Queue</Text>

        <View style={styles.headerSpacer} />
      </View>

      {queue.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Your queue is empty.
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          data={queue}
          onDragEnd={handleDragEnd}
          keyExtractor={(item, index) =>
            `${item.id}-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181A20' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282A30',
  },

  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  headerSpacer: { width: 28 },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    color: '#A0A0A0',
    fontSize: 16,
  },

  listContainer: { paddingBottom: 40 },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282A30',
  },

  dragHandle: {
    paddingRight: 12,
    justifyContent: 'center',
  },

  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },

  songInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },

  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  artist: {
    color: '#A0A0A0',
    fontSize: 14,
  },

  deleteButton: { padding: 8 },
});