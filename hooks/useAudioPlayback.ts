import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export default function useAudioPlayback() {

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const playing = status.playing;

  // Configure audio session once on mount
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Seek back to start when playback finishes
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
    }
  }, [status.didJustFinish]);

  const togglePlayback = useCallback((audioUri: string | null) => {
    if (!audioUri) return;

    if (playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= (status.duration ?? 0)) {
        player.seekTo(0);
      }
      player.play();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playing, player, status]);
  return { player, playing, status, togglePlayback }
}