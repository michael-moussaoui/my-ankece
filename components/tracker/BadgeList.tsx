import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const ALL_BADGES = [
  { id: '1000_shots', label: '1K Shooter', icon: 'medal', desc: '1000 tirs inscrits' },
  { id: '10000_shots', label: 'Sharpshooter', icon: 'trophy', desc: '10 000 tirs inscrits' },
  { id: '30_days_streak', label: 'Constant', icon: 'flame', desc: 'Série de 30 jours' },
  { id: 'free_throw_master', label: 'FT Master', icon: 'rocket', desc: '90% aux lancers francs' },
];

interface BadgeListProps {
  unlockedIds: string[];
}

export const BadgeList = ({ unlockedIds }: BadgeListProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;

  return (
    <View style={styles.container}>
      {ALL_BADGES.map((badge) => {
        const isUnlocked = unlockedIds.includes(badge.id);
        return (
          <View key={badge.id} style={[
            styles.badgeCard, 
            { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' },
            !isUnlocked && { opacity: 0.3 }
          ]}>
            <View style={[
              styles.iconWrapper, 
              { backgroundColor: isUnlocked ? tintColor : 'rgba(150,150,150,0.2)' }
            ]}>
              <Ionicons name={badge.icon as any} size={24} color={isUnlocked ? '#fff' : '#888'} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.badgeLabel}>{badge.label}</ThemedText>
            {isUnlocked && <ThemedText style={styles.badgeDesc}>{badge.desc}</ThemedText>}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: (Dimensions.get('window').width - 72) / 3,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 4,
  }
});

import { Dimensions } from 'react-native';
