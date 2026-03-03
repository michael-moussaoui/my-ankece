import { PlaygroundMap } from '@/components/map/PlaygroundMap';
import { UserIconButton } from '@/components/UserIconButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <View style={styles.container}>
      <PlaygroundMap />
      <View style={[styles.topUserButton, { top: insets.top + 10 }]}>
        <UserIconButton color={Colors[colorScheme].text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topUserButton: {
    position: 'absolute',
    right: 15,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 2,
  }
});
