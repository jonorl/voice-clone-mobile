import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { styles } from '@/styles/shared';
import { colors } from '@/constants/colors';

interface ParamRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export default function ParamRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: ParamRowProps) {
  // Whole-number settings (Top-K, Seed) read better without decimals.
  const formatted = Number.isInteger(step) ? String(Math.round(value)) : value.toFixed(2);

  return (
    <View style={styles.paramRow}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={styles.paramLabel}>{label}</Text>
          <Text style={styles.paramValue}>{formatted}</Text>
        </View>
        
        <Slider
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          onValueChange={onChange} // This sends the new value back to TuneStep
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: formatted }}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
      </View>
    </View>
  );
}