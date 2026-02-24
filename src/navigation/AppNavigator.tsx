import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Heart, Library, Settings } from 'lucide-react-native';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import QueueScreen from '../screens/QueueScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- THE BOTTOM TAB BAR ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#181A20', // Matches your dark theme
          borderTopColor: '#282A30',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FF8216', // The signature Figma Orange
        tabBarInactiveTintColor: '#A0A0A0', // Grey for unselected
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Playlists" 
        component={PlaylistsScreen} 
        options={{
          tabBarLabel: 'Playlists',
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
}

// --- THE ROOT STACK ---
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 1. Main UI (The Tabs) */}
      <Stack.Screen name="Main" component={MainTabs} />
      
      {/* 2. Modals (Player & Queue pop over the tabs) */}
      <Stack.Screen 
        name="Player" 
        component={PlayerScreen} 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="Queue" 
        component={QueueScreen} 
        options={{ presentation: 'modal' }} 
      />
    </Stack.Navigator>
  );
}