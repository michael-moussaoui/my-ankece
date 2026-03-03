import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export function ThemeToggle() {
  const { theme, setTheme, accentColor } = useAppTheme();
  const colorScheme = useColorScheme();
  
  const modes: { id: 'light' | 'dark' | 'system'; icon: any; label: string }[] = [
    { id: 'light', icon: 'sun.max.fill', label: 'Light' },
    { id: 'dark', icon: 'moon.fill', label: 'Dark' },
    { id: 'system', icon: 'desktopcomputer', label: 'System' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.button,
              theme === mode.id && { backgroundColor: accentColor + '20', borderColor: accentColor }
            ]}
            onPress={() => setTheme(mode.id)}
          >
            <IconSymbol 
              name={mode.icon} 
              size={18} 
              color={theme === mode.id ? accentColor : Colors[colorScheme].icon} 
            />
            <ThemedText style={[
              styles.label,
              theme === mode.id && { color: accentColor, fontWeight: '700' }
            ]}>
              {mode.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  label: {
    fontSize: 10,
  },
});
