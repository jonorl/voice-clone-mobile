import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';
import { styles } from '@/styles/shared';

export default function WaveformOrb({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.18,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.92,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scale.stopAnimation();
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [active]);

  return (
    <Animated.View style={[styles.orb, { transform: [{ scale }] }]}>
      <View style={styles.orbInner} />
    </Animated.View>
  );
}