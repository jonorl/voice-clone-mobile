import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/styles/shared'

import type { SpaceStatus } from '@/api/gradioClient';

interface StatusPillProps {
  spaceStatus: SpaceStatus;
}

export default function StatusPill({ spaceStatus }: StatusPillProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VoiceClone</Text>
        <View
          style={[
            styles.statusPill,
            spaceStatus === 'ready' && styles.statusPillReady,
            spaceStatus === 'error' && styles.statusPillError,
          ]}
        >
          <Text style={styles.statusPillText}>
            {spaceStatus === 'ready'
              ? '● Ready'
              : spaceStatus === 'checking'
                ? '◌ Checking…'
                : '✕ Error'}
          </Text>
        </View>
      </View>
    </>
  )
}