import React, { useEffect, useRef } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { Audio, Video, ResizeMode } from 'expo-av';
import { StyleSheet } from 'react-native';

type LionChromaVideoProps = {
  source: number;
};

const lionGreenVideo = require('../assets/lion-gift-green.mp4');
const lionTransparent = require('../assets/lion-gift-transparent-final.webp');
const lionSound = require('../assets/lion-gift-sound.m4a');

export function LionChromaVideo({
  source,
}: LionChromaVideoProps) {
  const isLion = source === lionGreenVideo;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!isLion) return;

    let mounted = true;

    const playLionSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          lionSound,
          { shouldPlay: true, volume: 1.0 }
        );

        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('Lion sound error:', error);
      }
    };

    playLionSound();

    return () => {
      mounted = false;

      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [isLion]);

  if (isLion) {
    return (
      <ExpoImage
        source={lionTransparent}
        style={styles.video}
        contentFit="contain"
        autoplay
      />
    );
  }

  return (
    <Video
      source={source}
      style={styles.video}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay
      isLooping={false}
      isMuted={false}
      useNativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
