import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { Home, Search, Library, Settings } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import QueueScreen from '../screens/QueueScreen';
import SearchScreen from '../screens/SearchScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Main: undefined;
  Player: undefined;
  Queue: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  LibraryTab: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// --- CUSTOM ANIMATED TAB BUTTON ---
const AnimatedTabButton = (props: any) => {
  const { children, accessibilityState, onPress } = props;
  const focused = accessibilityState.selected;

  // Animation Values
  const scale = useRef(new Animated.Value(focused ? 0.85 : 1)).current;
  const translateY = useRef(new Animated.Value(focused ? -4 : 0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Handle Focus Animation (Shrink & Float Up)
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 0.85 : 1,
        useNativeDriver: true,
        friction: 5, // Lower friction = more bounce
        tension: 100,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -6 : 0, // Float up by 6 pixels
        useNativeDriver: true,
        friction: 5,
        tension: 100,
      }),
    ]).start();
  }, [focused, scale, translateY]);

  // Handle Press Animation (The Shake)
  const handlePress = (e: any) => {
    // Quick sequence to wobble left and right
    Animated.sequence([
      Animated.timing(rotate, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: -1, duration: 40, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();

    // Trigger the actual navigation
    if (onPress) onPress(e);
  };

  // Interpolate rotation value into degrees
  const rotation = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.tabButtonContainer}>
        <Animated.View
          style={{
            transform: [
              { scale },
              { translateY },
              { rotate: rotation }
            ],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};
// ----------------------------------

function MainTabs(): React.JSX.Element {
  const screenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: '#000000',
      borderTopWidth: 0, // Removed border for a sleeker look
      elevation: 0, // Remove shadow on Android
      height: Platform.OS === 'ios' ? 88 : 68, // Extra height for the "float up" animation
      paddingBottom: Platform.OS === 'ios' ? 24 : 10,
      paddingTop: 10,
    },
    tabBarActiveTintColor: '#FFFFFF', // White when active stands out better
    tabBarInactiveTintColor: '#52525B', // Zinc-600
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: 4,
    },
    // Apply our custom animated button to all tabs
    tabBarButton: (props) => <AnimatedTabButton {...props} />,
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />

      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />

      <Tab.Screen
        name="LibraryTab"
        component={PlaylistsScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Library color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  const stackOptions: StackNavigationOptions = {
    headerShown: false,
    // Add smooth cross-fade transitions for stack screens
    animationEnabled: true,
    cardStyleInterpolator: ({ current: { progress } }) => ({
      cardStyle: {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    }),
  };

  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Main" component={MainTabs} />

      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ 
          presentation: 'modal',
          // Modals natively slide up from the bottom on iOS/Android
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="Queue"
        component={QueueScreen}
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});