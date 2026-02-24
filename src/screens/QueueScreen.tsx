import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, GripVertical, Trash2 } from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';

export default function QueueScreen() {
  const navigation = useNavigation();
  const { queue, reorderQueue, removeFromQueue } = usePlayerStore();

  const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.rowItem,
            { backgroundColor: isActive ? '#282A30' : 'transparent' },
          ]}
        >
          {/* Drag Handle */}
          <TouchableOpacity onLongPress={drag} delayLongPress={100} style={styles.dragHandle}>
            <GripVertical color="#A0A0A0" size={24} />
          </TouchableOpacity>

          <Image source={{ uri: item.artwork }} style={styles.artwork} />

          <View style={styles.songInfo}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
          </View>

          {/* Remove Button */}
          <TouchableOpacity 
            onPress={() => removeFromQueue(item.id)} 
            style={styles.deleteButton}
            hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
          >
            <Trash2 color="#FF4444" size={20} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <ArrowLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue</Text>
        <View style={{ width: 28 }} />
      </View>

      {queue.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your queue is empty.</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={queue}
          onDragEnd={({ data }) => reorderQueue(data)}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
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
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#A0A0A0', fontSize: 16 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282A30',
  },
  dragHandle: { paddingRight: 12, justifyContent: 'center' },
  artwork: { width: 48, height: 48, borderRadius: 8 },
  songInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  title: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  artist: { color: '#A0A0A0', fontSize: 14 },
  deleteButton: { padding: 8 },
});