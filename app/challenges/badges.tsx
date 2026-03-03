import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserIconButton } from '@/components/UserIconButton';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackerService } from '@/services/trackerService';
import { ChallengeBadge, UserStats } from '@/types/tracker';

const CHALLENGE_BADGES: { id: ChallengeBadge; title: string; description: string; threshold: number; icon: any }[] = [
  { id: 'Challenger', title: 'Challenger', description: 'Gagnez 100 points via les challenges', threshold: 100, icon: 'medal' },
  { id: 'Master Challenger', title: 'Maître Challenger', description: 'Gagnez 500 points via les challenges', threshold: 500, icon: 'trophy' },
  { id: 'Legend Challenger', title: 'Légende Challenger', description: 'Gagnez 2000 points via les challenges', threshold: 2000, icon: 'sparkles' },
];

export default function ChallengeBadgesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await trackerService.getUserStats(user!.uid);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPoints = stats?.challengePoints || 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <UserIconButton color={colorScheme === 'dark' ? '#FFF' : '#000'} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.pointsHero, { backgroundColor: accentColor }]}>
          <ThemedText 
            style={styles.heroPointsValue} 
            numberOfLines={1} 
            adjustsFontSizeToFit
          >
            {currentPoints}
          </ThemedText>
          <ThemedText style={styles.heroPointsLabel}>Points Challenges</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Progression des Badges</ThemedText>
          {CHALLENGE_BADGES.map((badge) => {
            const isUnlocked = currentPoints >= badge.threshold;
            const progress = Math.min(1, currentPoints / badge.threshold);
            
            return (
              <View 
                key={badge.id} 
                style={[
                  styles.badgeCard, 
                  { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' },
                  !isUnlocked && styles.lockedBadge
                ]}
              >
                <View style={[styles.badgeIconBox, { backgroundColor: isUnlocked ? accentColor : '#8E8E93' }]}>
                  <Ionicons name={badge.icon} size={32} color="#FFF" />
                </View>
                <View style={styles.badgeInfo}>
                  <View style={styles.badgeHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.badgeTitle}>{badge.title}</ThemedText>
                    {isUnlocked && <Ionicons name="checkmark-circle" size={20} color={accentColor} />}
                  </View>
                  <ThemedText style={styles.badgeLabel}>{badge.description}</ThemedText>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
                    </View>
                    <ThemedText style={styles.progressText}>{currentPoints} / {badge.threshold} pts</ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#8E8E93" />
          <ThemedText style={styles.infoText}>
            Relève des défis ou crée tes propres challenges pour gagner des points et débloquer ces badges prestigieux !
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    gap: 32,
  },
  pointsHero: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPointsValue: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 60,
  },
  heroPointsLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  badgeCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    gap: 16,
    alignItems: 'center',
  },
  lockedBadge: {
    opacity: 0.7,
  },
  badgeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 18,
  },
  badgeLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 12,
  },
  progressContainer: {
    gap: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    opacity: 0.5,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(150,150,150,0.05)',
    borderRadius: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    opacity: 0.5,
    lineHeight: 18,
  },
});
