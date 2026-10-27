import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/styles/shared'

import type { SpaceStatus } from '@/api/gradioClient';

const LABELS: Record<SpaceStatus, string> = { ready: 'Ready', checking: 'Checking…', error: 'Error' };
// Read out as "black circle" and so on, so they stay out of the accessibility label.
const SYMBOLS: Record<SpaceStatus, string> = { ready: '●', checking: '◌', error: '✕' };

interface StatusPillProps {
  spaceStatus: SpaceStatus;
}

export default function StatusPill({ spaceStatus }: StatusPillProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">VoiceClone</Text>
        <View
          style={[
            styles.statusPill,
            spaceStatus === 'ready' && styles.statusPillReady,
            spaceStatus === 'error' && styles.statusPillError,
          ]}
          accessible
          accessibilityLabel={`Server status: ${LABELS[spaceStatus]}`}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.statusPillText}>
            {SYMBOLS[spaceStatus]} {LABELS[spaceStatus]}
          </Text>
        </View>
      </View>
    </>
  )
}