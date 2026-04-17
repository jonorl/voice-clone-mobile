import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import WaveformOrb from './WaveformOrb'
import { styles } from '@/styles/shared'

interface ListenProps {
  playing: boolean;
  loading: boolean;
  audioUri: string | null;
  togglePlayback: (uri: string | null) => void;
  handleShare: () => Promise<void>;
}

export default function Listen({
  playing,
  audioUri,
  loading,
  togglePlayback,
  handleShare,
}: ListenProps) {
  return (
    <>
      <View
        style={[
          styles.stepContent,
          { alignItems: 'center', justifyContent: 'center', flex: 1 },
        ]}
      >
        <WaveformOrb active={playing} />
        <TouchableOpacity
          style={[
            styles.playButton,
            !audioUri && styles.primaryButtonDisabled,
          ]}
          onPress={() => togglePlayback(audioUri)}
          disabled={!audioUri}
        >
          <Text style={styles.playButtonText}>{playing ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {audioUri && (
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share / Save</Text>
          </TouchableOpacity>
        )}

        {!audioUri && !loading && (
          <Text style={styles.hintText}>
            Generate audio first from the Write tab.
          </Text>
        )}
      </View>
    </>
  )
}