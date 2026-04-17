import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import ParamRow from '@/components/ParamRow';
import { styles } from '@/styles/shared'

interface TuneProps {
  text: string;
  temperature: number;
  setTemperature: (v: number) => void;
  topK: number;
  setTopK: (v: number) => void;
  topP: number;
  setTopP: (v: number) => void;
  seed: number;
  setSeed: (v:number) => void;
  loading: boolean;
  handleGenerate: () => void;
  spaceStatus: string;
}

export default function Tune({
  text,
  temperature,
  loading,
  spaceStatus,
  setTemperature,
  topK,
  setTopK,
  topP,
  setTopP,
  seed,
  setSeed,
  handleGenerate
}: TuneProps) {
  return (
    <>
      <ScrollView contentContainerStyle={styles.stepContent}>
        <Text style={styles.sectionLabel}>Generation Parameters</Text>
        <ParamRow
          label="Temperature"
          value={temperature}
          min={0.1}
          max={1.5}
          step={0.05}
          onChange={setTemperature}
        />
        <ParamRow
          label="Top-K"
          value={topK}
          min={1}
          max={200}
          step={1}
          onChange={setTopK}
        />
        <ParamRow
          label="Top-P"
          value={topP}
          min={0.1}
          max={1}
          step={0.05}
          onChange={setTopP}
        />
        <ParamRow
          label="Seed"
          value={seed}
          min={0}
          max={999}
          step={1}
          onChange={setSeed}
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!text.trim() || loading || spaceStatus !== 'ready') &&
            styles.primaryButtonDisabled,
          ]}
          disabled={!text.trim() || loading || spaceStatus !== 'ready'}
          onPress={() => {
            handleGenerate;
          }}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Generating…' : '✦  Generate with these params'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  )
}