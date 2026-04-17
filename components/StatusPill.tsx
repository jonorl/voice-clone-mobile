import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/styles/shared'

type SpaceStatus = 'checking' | 'ready' | 'sleeping' | 'error';

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
            spaceStatus === 'sleeping' && styles.statusPillSleeping,
            spaceStatus === 'error' && styles.statusPillError,
          ]}
        >
          <Text style={styles.statusPillText}>
            {spaceStatus === 'ready'
              ? '● Ready'
              : spaceStatus === 'checking'
                ? '◌ Checking…'
                : spaceStatus === 'sleeping'
                  ? '○ Sleeping'
                  : '✕ Error'}
          </Text>
        </View>
      </View>
    </>
  )
}