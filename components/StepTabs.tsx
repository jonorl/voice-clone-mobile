import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '@/styles/shared'
import useGenerateSpeech from '@/hooks/useGenerate';
import useAudioPlayback from '@/hooks/useAudioPlayback';
import * as Sharing from 'expo-sharing';
import Write from './WriteStep';
import Tune from './TuneStep';
import Listen from './ListenStep';

type Step = 'write' | 'tune' | 'listen';

export default function StepTabs() {
  const [step, setStep] = useState<Step>('write');
  const [text, setText] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(50);
  const [topP, setTopP] = useState(0.85);
  const [seed, setSeed] = useState(42);

  const { player, playing, togglePlayback } = useAudioPlayback();

  const { generate, loading, audioUri, error, spaceStatus } = useGenerateSpeech(
    player,
    () => setStep('listen')
  );

  const handleGenerate = () => {
    generate({ text, temperature, topK, topP, seed });
  };

  const handleShare = async () => {
    if (!audioUri) return;
    await Sharing.shareAsync(audioUri, {
      mimeType: 'audio/wav',
      UTI: 'public.audio',
    });
  };

  return (
    <>
      <View style={styles.tabs}>
        {(['write', 'tune', 'listen'] as Step[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, step === s && styles.tabActive]}
            onPress={() => setStep(s)}
          >
            <Text style={[styles.tabText, step === s && styles.tabTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {step === 'write' && (
        <Write
          text={text}
          setText={setText}
          handleGenerate={handleGenerate}
          loading={loading}
          spaceStatus={spaceStatus}
          error={error}
        />
      )}

      {step === 'tune' && (
        <Tune
          text={text}
          temperature={temperature}
          loading={loading}
          spaceStatus={spaceStatus}
          setTemperature={setTemperature}
          topK={topK}
          setTopK={setTopK}
          topP={topK}
          setTopP={setTopP}
          seed={seed}
          setSeed={setSeed}
          handleGenerate={handleGenerate}
        />
      )}

      {step === 'listen' && (
        <Listen
          playing={playing}
          audioUri={audioUri}
          loading={loading}
          togglePlayback={togglePlayback}
          handleShare={handleShare}
        />
      )}
    </>
  )
}