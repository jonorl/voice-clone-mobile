import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '@/styles/shared'
import StatusPill from '@/components/StatusPill';
import StepTabs from '@/components/StepTabs';
import useAudioPlayback from '@/hooks/useAudioPlayback'
import useGenerateSpeech from '@/hooks/useGenerate';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'write' | 'tune' | 'listen';

// ─── Inner App ────────────────────────────────────────────────────────────────
function AppContent() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('write');

  // 1. Audio Logic
  const { player } = useAudioPlayback();

  // 2. Generation Logic
  // index.tsx inside AppContent
  const { spaceStatus } = useGenerateSpeech(
    player,               // First argument
    () => setStep('listen') // Second argument
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <StatusPill spaceStatus={spaceStatus} />
        <StepTabs />


      </View>
    </GestureHandlerRootView>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}