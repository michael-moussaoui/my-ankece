import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserIconButton } from '@/components/UserIconButton';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { challengeService } from '@/services/challengeService';

export default function ChallengesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const [firebaseData, aiData] = await Promise.all([
        challengeService.getChallenges(),
        challengeService.getAiChallenges()
      ]);
      
      // Merge and tag AI challenges
      const proChallenges = aiData.map((c: any) => ({
        ...c,
        isPro: true,
        creatorName: "Ankece AI Hub",
        pointsSuccess: c.reward_xp
      }));

      setChallenges([...proChallenges, ...firebaseData]);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChallenge = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.challengeCard, 
        { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFF' },
        item.isPro && { borderColor: accentColor, borderWidth: 1 }
      ]}
      onPress={() => item.isPro ? router.push(`/camera-analysis?mode=${item.type}&challenge=${item.id}`) : router.push(`/challenges/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.isPro ? accentColor : accentColor + '15' }]}>
          <Ionicons name={item.isPro ? "sparkles" : "trophy"} size={24} color={item.isPro ? "#fff" : accentColor} />
        </View>
        <View style={styles.headerText}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <ThemedText type="defaultSemiBold" style={styles.challengeTitle}>{item.title}</ThemedText>
            {item.isPro && (
                <View style={styles.proBadge}>
                    <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
                </View>
            )}
          </View>
          <ThemedText style={styles.creatorName}>Par {item.creatorName}</ThemedText>
        </View>
        <View style={[styles.pointsBadge, { backgroundColor: item.isPro ? '#34C759' : accentColor }]}>
          <ThemedText style={styles.pointsText}>+{item.pointsSuccess}</ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.description} numberOfLines={2}>{item.description}</ThemedText>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name={item.isPro ? "flash" : "people"} size={16} color="#8E8E93" />
          <ThemedText style={styles.footerText}>
            {item.isPro ? "Challenge de Précision" : `${item.participantsCount} participants`}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <UserIconButton color={colorScheme === 'dark' ? '#FFF' : '#000'} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallenge}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#8E8E93" />
              <ThemedText style={styles.emptyText}>Aucun challenge actif pour le moment.</ThemedText>
              <TouchableOpacity 
                style={[styles.createBtn, { backgroundColor: accentColor }]}
                onPress={() => router.push('/challenges/create')}
              >
                <ThemedText style={styles.createBtnText}>En créer un</ThemedText>
              </TouchableOpacity>
            </View>
          }
          onRefresh={loadChallenges}
          refreshing={loading}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: accentColor, bottom: insets.bottom + 20 }]}
        onPress={() => router.push('/challenges/create')}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  challengeCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
  },
  creatorName: {
    fontSize: 12,
    opacity: 0.6,
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },
  proBadge: {
    marginLeft: 8,
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 40,
  },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
