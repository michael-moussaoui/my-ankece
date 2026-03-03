import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface UserIconButtonProps {
  color?: string;
  size?: number;
}

export function UserIconButton({ color = '#fff', size = 28 }: UserIconButtonProps) {
  const router = useRouter();
  const segments = useSegments();
  
  // Don't show on settings screen
  // (tabs)/settings or settings
  const isSettingsScreen = (segments as string[]).includes('settings');
  
  if (isSettingsScreen) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push('/(tabs)/settings')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="person-circle" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});
