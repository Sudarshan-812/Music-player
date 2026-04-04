import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Platform, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

interface Props {
  onFinish: () => void;
}

// App branding name for the reveal (optional)
const APP_NAME = 'Aura'; 

export default function SplashVideoScreen({ onFinish }: Props) {
  // Animating both opacity and a slight scale-in for more dynamism
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const called = useRef(false);

  const finish = useCallback(() => {
    if (called.current) return;
    called.current = true;
    
    // Animate opacity down and scale up slightly on fade-out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [fadeAnim, scaleAnim, onFinish]);

  const player = useVideoPlayer(
    require('../../assets/SS_video.mp4'),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.play();
    },
  );

  useEffect(() => {
    // Trigger fade-out when video ends
    const sub = player.addListener('playToEnd', finish);
    
    // Hard cap at 2.5s (slightly longer for video to breath) so the app never gets stuck
    const timer = setTimeout(finish, 2500);
    
    // Slight initial entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [player, finish, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }] // Added scale animation
        }
      ]}
    >
      {/* 1. Styled Video Container (The "Frame") */}
      <View style={styles.videoCard}>
        <VideoView
          player={player}
          // Remove StyleSheet.absoluteFill!
          style={styles.video} 
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
        
        {/* Subtle loading state if video asset takes time to mount */}
        {Platform.OS === 'android' && (
           <View style={styles.loaderPlaceholder} />
        )}
      </View>

      {/* 2. Branded Text Reveal */}
      <Animated.Text style={styles.appNameText}>
        {APP_NAME}
      </Animated.Text>
    </Animated.View>
  );
}

// Define sizes for the "Small Video" approach
const VIDEO_SIZE = 160; 

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999,
    // THE KEY FIX: Center the small video
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // -- The video frame/card --
  videoCard: {
    width: VIDEO_SIZE,
    height: VIDEO_SIZE,
    borderRadius: 24, // Clean rounded corners
    overflow: 'hidden',
    backgroundColor: '#161618', // Fallback color while video loads
    // Premium shadow glow using the app's purple accent
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#27272A', // Zinc-700 subtle border
  },
  video: {
    width: '100%',
    height: '100%',
  },
  
  // -- Branding Text --
  appNameText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 32, // Space below the video
    letterSpacing: -1,
  },

  // Android specific fallback during load
  loaderPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161618',
    zIndex: -1,
  }
});