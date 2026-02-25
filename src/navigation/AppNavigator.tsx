import React from 'react';
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { Home, Heart, Library, Settings } from 'lucide-react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import QueueScreen from '../screens/QueueScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';

/**
 * Root stack navigation param definitions.
 */
export type RootStackParamList = {
  Main: undefined;
  Player: undefined;
  Queue: undefined;
};

/**
 * Bottom tab navigation param definitions.
 */
export type MainTabParamList = {
  HomeTab: undefined;
  Favorites: undefined;
  Playlists: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Bottom tab navigator containing main app sections.
 * UI and behavior remain unchanged.
 */
function MainTabs(): JSX.Element {
  const screenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: '#181A20',
      borderTopColor: '#282A30',
      height: 65,
      paddingBottom: 10,
      paddingTop: 10,
    },
    tabBarActiveTintColor: '#FF8216',
    tabBarInactiveTintColor: '#A0A0A0',
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Heart color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Playlists"
        component={PlaylistsScreen}
        options={{
          tabBarLabel: 'Playlists',
          tabBarIcon: ({ color, size }) => (
            <Library color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root navigator for the app.
 * Contains:
 * 1. Main Tabs (Primary UI)
 * 2. Modal screens (Player & Queue)
 */
export default function AppNavigator(): JSX.Element {
  const stackOptions: StackNavigationOptions = {
    headerShown: false,
  };

  return (
    <Stack.Navigator screenOptions={stackOptions}>
      {/* Main Application Tabs */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Modal Screens */}
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