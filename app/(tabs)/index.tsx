import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetch } from 'expo/fetch';
import { generateSpeech, checkSpace } from './gradioClient';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'write' | 'tune' | 'listen';
type SpaceStatus = 'checking' | 'ready' | 'sleeping' | 'error';

const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN ?? '';

const EXAMPLES = [
  'Hola, soy Pedro. Bienvenidos a mi demostración de clonación de voz.',
  'La inteligencia artificial ha avanzado mucho en los últimos años.',
  '¿Cómo va todo? Espero que estés teniendo un excelente día.',
  'A todo el mundo le gusta el jarabe para la tos.',
];

// ─── Waveform Orb ─────────────────────────────────────────────────────────────
function WaveformOrb({ active }: { active: boolean }) {
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

// ─── Param Row ────────────────────────────────────────────────────────────────
function ParamRow({
  label,
  value,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.paramRow}>
      <Text style={styles.paramLabel}>{label}</Text>
      <Text style={styles.paramValue}>{value}</Text>
      {/* <Slider minimumValue={min} maximumValue={max} step={step} value={value} onValueChange={onChange} /> */}
    </View>
  );
}

// ─── Inner App ────────────────────────────────────────────────────────────────
function AppContent() {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('write');
  const [text, setText] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(50);
  const [topP, setTopP] = useState(0.85);
  const [seed, setSeed] = useState(42);
  const [loading, setLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [spaceStatus, setSpaceStatus] = useState<SpaceStatus>('checking');

  // ── expo-audio: hook called unconditionally at top level ──────────────────
  // Pass null initially; we call player.replace() once we have a URI.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Derive playing state from the reactive status object
  const playing = status.playing;

  // ── Configure audio session once ─────────────────────────────────────────
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // ── Detect playback finishing and reset state ─────────────────────────────
  useEffect(() => {
    if (status.didJustFinish) {
      // Seek back to start so the play button works again
      player.seekTo(0);
    }
  }, [status.didJustFinish]);

  // ── Check space status on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const result = await checkSpace(HF_TOKEN);
      setSpaceStatus(result);
    })();
  }, []);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    setAudioUri(null);

    try {
      const rawUrl = await generateSpeech(
        { text, temperature, top_p: topP, top_k: topK, seed },
        HF_TOKEN
      );

      const audioResponse = await fetch(rawUrl, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
      });
      if (!audioResponse.ok) throw new Error('Failed to fetch audio file');

      const outputFile = new File(Paths.cache, 'voice_clone_output.wav');
      if (outputFile.exists) outputFile.delete();
      outputFile.create();
      outputFile.write(await audioResponse.bytes());

      const uri = outputFile.uri;
      setAudioUri(uri);

      // Load the new file into the player immediately
      player.replace({ uri });

      setSpaceStatus('ready');
      setStep('listen');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setSpaceStatus('sleeping');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [text, temperature, topK, topP, seed, player]);

  // ── Playback toggle ───────────────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    if (!audioUri) return;

    if (playing) {
      player.pause();
    } else {
      // If finished, seek back to start before replaying
      if (status.didJustFinish || status.currentTime >= (status.duration ?? 0)) {
        player.seekTo(0);
      }
      player.play();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [audioUri, playing, player, status]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!audioUri) return;
    await Sharing.shareAsync(audioUri, {
      mimeType: 'audio/wav',
      UTI: 'public.audio',
    });
  };

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
        {/* Header */}
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

        {/* Step tabs */}
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

        {/* ── WRITE step ── */}
        {step === 'write' && (
          <ScrollView contentContainerStyle={styles.stepContent}>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Type the text to synthesise…"
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
            />

            <Text style={styles.sectionLabel}>Examples</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
            >
              {EXAMPLES.map((ex, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => setText(ex)}
                >
                  <Text style={styles.chipText} numberOfLines={2}>
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!text.trim() || loading || spaceStatus !== 'ready') &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={!text.trim() || loading || spaceStatus !== 'ready'}
              onPress={handleGenerate}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Generating…' : '✦  Generate Voice'}
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>
        )}

        {/* ── TUNE step ── */}
        {step === 'tune' && (
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
                setStep('write');
                handleGenerate();
              }}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Generating…' : '✦  Generate with these params'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── LISTEN step ── */}
        {step === 'listen' && (
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
              onPress={togglePlayback}
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
        )}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f',
  surface: '#12121a',
  border: '#1e1e2e',
  accent: '#7c6af7',
  accentDim: '#3d3578',
  text: '#e2e2f0',
  muted: '#555570',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: 1 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusPillReady: { borderColor: '#2d6a2d' },
  statusPillSleeping: { borderColor: '#7a6a1a' },
  statusPillError: { borderColor: '#6a2d2d' },
  statusPillText: { fontSize: 11, color: C.muted },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: C.accentDim },
  tabText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.text },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  textArea: {
    width: '100%',
    minHeight: 160,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipsRow: { marginBottom: 24 },
  chip: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    maxWidth: 200,
  },
  chipText: { color: C.text, fontSize: 12, lineHeight: 17 },
  primaryButton: {
    width: '100%',
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  errorText: { color: '#f87171', marginTop: 16, fontSize: 13 },
  paramRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  paramLabel: { color: C.text, fontSize: 14 },
  paramValue: { color: C.accent, fontSize: 14 },
  orb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    shadowColor: C.accent,
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  orbInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playButtonText: { fontSize: 28, color: '#fff' },
  shareButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.accent,
  },
  shareButtonText: { color: C.accent, fontWeight: '600' },
  hintText: { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 20 },
});