import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TrackPlayer, { Capability } from 'react-native-track-player';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

export default function App() {
  const isPlayerReady = useRef(false);

  useEffect(() => {
    if (isPlayerReady.current) return;

    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer({
          minBuffer: 15,
          maxBuffer: 50,
          playBuffer: 2.5,
          backBuffer: 10,
          maxCacheSize: 102400,
          autoHandleInterruptions: true,
        });
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
        });
        isPlayerReady.current = true;
      } catch (e) {
        console.log('TrackPlayer setup:', e);
        isPlayerReady.current = true;
      }
    };

    setupPlayer();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
