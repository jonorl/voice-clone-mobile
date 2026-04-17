import { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { styles } from '@/styles/shared'
import StatusPill from '@/components/StatusPill';
import StepTabs from '@/components/StepTabs';
import useAudioPlayback from '@/hooks/useAudioPlayback'
import useGenerateSpeech from '@/hooks/useGenerate';

type Step = 'write' | 'tune' | 'listen';

export default function AppContent() {
  const [step, setStep] = useState<Step>('write');

  const { player } = useAudioPlayback();
  const { spaceStatus } = useGenerateSpeech(
    player,              
    () => setStep('listen')
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[styles.root]}>
        <StatusPill spaceStatus={spaceStatus} />
        <StepTabs />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}