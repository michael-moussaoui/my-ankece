import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { ThemedText } from '../themed-text';

// --- GLASSMOPHISM CONTAINER ---
export const GlassContainer = ({ children, style }: { children: React.ReactNode, style?: any }) => {
  return (
    <BlurView intensity={20} tint="dark" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
};

// --- STYLED INPUT ---
export const FormInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  keyboardType = 'default',
  maxLength,
  multiline = false,
  required = false,
  themeColor = '#FF8C00'
}: any) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.inputContainer}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={styles.required}>*</ThemedText>}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          isFocused && { borderColor: themeColor, backgroundColor: themeColor + '0D' },
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
};

// --- CUSTOM SELECTOR ---
export const FormSelector = ({ 
  label, 
  options, 
  selectedValue, 
  onSelect, 
  required = false,
  themeColor = '#FF8C00',
  themeTextColor = '#000'
}: any) => {
  return (
    <View style={styles.inputContainer}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={styles.required}>*</ThemedText>}
      </ThemedText>
      <View style={styles.selectorGrid}>
        {options.map((opt: any) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionChip,
              selectedValue === opt.value && { backgroundColor: themeColor, borderColor: themeColor }
            ]}
            onPress={() => onSelect(opt.value)}
          >
            {opt.icon && <Ionicons name={opt.icon} size={18} color={selectedValue === opt.value ? themeTextColor : "#FFF"} style={{marginRight: 8}} />}
            <ThemedText style={[
              styles.optionText,
              selectedValue === opt.value && { color: themeTextColor, fontWeight: '700' }
            ]}>
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// --- STEPPER ---
export const FormStepper = ({ currentStep, totalSteps, themeColor = '#FF8C00' }: { currentStep: number, totalSteps: number, themeColor?: string }) => {
  return (
    <View style={styles.stepperContainer}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <View style={[
            styles.stepDot,
            i + 1 <= currentStep && { backgroundColor: themeColor, borderColor: themeColor },
            i + 1 === currentStep && styles.stepDotCurrent
          ]}>
            <ThemedText style={[
              styles.stepDotText,
              i + 1 <= currentStep && { color: '#FFF' }
            ]}>
              {i + 1}
            </ThemedText>
          </View>
          {i < totalSteps - 1 && (
            <View style={[
              styles.stepLine,
              i + 1 < currentStep && { backgroundColor: themeColor }
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// --- QUOTA INDICATOR ---
export const QuotaIndicator = ({ current, max, label, themeColor = '#FF8C00' }: { current: number, max: number | null, label: string, themeColor?: string }) => {
  const isUnlimited = max === null;
  const percentage = isUnlimited ? 100 : Math.min((current / (max as number)) * 100, 100);
  
  return (
    <View style={styles.quotaContainer}>
      <View style={styles.quotaHeader}>
        <ThemedText style={styles.quotaLabel}>{label}</ThemedText>
        <ThemedText style={styles.quotaValue}>
          {current} / {isUnlimited ? '∞' : max}
        </ThemedText>
      </View>
      <View style={styles.quotaTrack}>
        <View style={[styles.quotaFill, { width: `${percentage}%`, backgroundColor: themeColor }]} />
      </View>
    </View>
  );
};

// --- ANIMATED SECTION TITLE ---
export const AnimatedTitle = ({ title }: { title: string }) => (
  <Animated.View 
    entering={FadeInRight.delay(200).duration(500)}
    layout={Layout.springify()}
  >
    <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
  </Animated.View>
);

const styles = StyleSheet.create({
  glass: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
    overflow: 'hidden',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#CCC',
  },
  required: {
    color: '#FF4D4D',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    color: '#FFF',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#FF8C00', // Deep Orange
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
  },
  inputError: {
    borderColor: '#FF4D4D',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 12,
    marginTop: 4,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  optionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  stepDotCurrent: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
  },
  stepDotTextActive: {
    color: '#FFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#FF8C00',
  },
  quotaContainer: {
    marginVertical: 10,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quotaLabel: {
    fontSize: 12,
    color: '#AAA',
  },
  quotaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  quotaTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
  }
});
