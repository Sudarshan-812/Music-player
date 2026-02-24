import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FavoritesScreen() { // Change this name for Playlists and Settings
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Playlists Coming Soon!</Text> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181A20', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#A0A0A0', fontSize: 18, fontWeight: 'bold' }
});