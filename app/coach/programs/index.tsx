import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { programService, CoachingProgram } from '@/services/programService';
import { getCoachByUserId } from '@/services/coachService';
import { contentService, TrainingProgram } from '@/services/contentService';

export default function ProgramsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFF' : '#111';
  const textSecondary = isDark ? '#888' : '#666';

  const [programs, setPrograms] = useState<CoachingProgram[]>([]);
  const [academyPrograms, setAcademyPrograms] = useState<TrainingProgram[]>([]);
  const [activeTab, setActiveTab] = useState<'coaching' | 'academy'>('coaching');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const coachProfile = await getCoachByUserId(user.uid);
      if (coachProfile) {
        if (activeTab === 'coaching') {
          const data = await programService.getCoachPrograms(coachProfile.id);
          setPrograms(data);
        } else {
          const data = await contentService.getCoachPrograms(user.uid);
          setAcademyPrograms(data);
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user, activeTab])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      'Supprimer ce programme ?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            await programService.deleteProgram(id);
            setPrograms(programs.filter(p => p.id !== id));
          }
        }
      ]
    );
  };

  const handleDeleteAcademy = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      'Supprimer ce programme de l\'Academy ?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await contentService.deleteProgram(id);
              setAcademyPrograms(prev => prev.filter(p => p.id !== id));
            } catch (error) {
              console.error('Error deleting academy program:', error);
              Alert.alert(t('common.error'), "Erreur lors de la suppression");
            }
          }
        }
      ]
    );
  };

  const renderProgram = ({ item, index }: { item: CoachingProgram, index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 100)} layout={Layout.springify()}>
      <TouchableOpacity 
        style={[styles.programCard, { backgroundColor: cardBg }]}
        onPress={() => router.push(`/coach/programs/${item.id}`)}
      >
        <View style={[styles.levelBadge, { backgroundColor: accentColor + '20' }]}>
          <Text style={{ color: accentColor, fontWeight: '800', fontSize: 10, textTransform: 'uppercase' }}>
            {item.level}
          </Text>
        </View>

        <View style={styles.programInfo}>
          <ThemedText style={styles.programTitle}>{item.title}</ThemedText>
          <Text style={[styles.programMeta, { color: textSecondary }]}>
            {item.durationWeeks} semaines • {item.sessions.length} séances
          </Text>
          <ThemedText style={styles.programPrice}>{item.price}€</ThemedText>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleDelete(item.id!)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{t('coach.programs.title')}</ThemedText>
          <TouchableOpacity 
            onPress={() => router.push(activeTab === 'coaching' ? '/coach/programs/create' : '/coach/content/create-program')} 
            style={[styles.addBtn, { backgroundColor: accentColor }]}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => setActiveTab('coaching')}
            style={[styles.tab, activeTab === 'coaching' && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'coaching' ? textPrimary : textSecondary }]}>
              COACHING
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('academy')}
            style={[styles.tab, activeTab === 'academy' && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'academy' ? textPrimary : textSecondary }]}>
              ACADEMY
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : (
          <FlatList<any>
            data={activeTab === 'coaching' ? programs : academyPrograms}
            keyExtractor={(item) => item.id!}
            renderItem={activeTab === 'coaching' ? renderProgram : (({ item, index }) => (
              <Animated.View entering={FadeInRight.delay(index * 100)} layout={Layout.springify()}>
                <TouchableOpacity 
                  style={[styles.programCard, { backgroundColor: cardBg }]}
                  onPress={() => router.push(`/coach/content/programs/${item.id}`)}
                >
                  <View style={[styles.typeBadge, { backgroundColor: '#FF4500' + '20' }]}>
                    <Text style={{ color: '#FF4500', fontWeight: '800', fontSize: 10 }}>STORE</Text>
                  </View>
                  <View style={styles.programInfo}>
                    <ThemedText style={styles.programTitle}>{item.title}</ThemedText>
                    <Text style={[styles.programMeta, { color: textSecondary }]}>
                      {item.weeksCount} semaines • {item.drills.length} drills
                    </Text>
                    <ThemedText style={[styles.programPrice, { color: '#FF4500' }]}>{item.price}€</ThemedText>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleDeleteAcademy(item.id!)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color={textSecondary} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="library-outline" size={64} color="#8884" />
                <ThemedText style={styles.emptyText}>{t('coach.programs.empty')}</ThemedText>
                <TouchableOpacity 
                  style={[styles.createBtn, { backgroundColor: accentColor + '20' }]}
                  onPress={() => router.push(activeTab === 'coaching' ? '/coach/programs/create' : '/coach/content/create-program')}
                >
                  <Text style={{ color: accentColor, fontWeight: '700' }}>{t('coach.programs.create')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#8882', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#8882' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  
  programCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 16 },
  levelBadge: { position: 'absolute', top: -8, left: 16, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadge: { position: 'absolute', top: -8, left: 16, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  programInfo: { flex: 1 },
  programTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  programMeta: { fontSize: 13, fontWeight: '600' },
  programPrice: { fontSize: 16, fontWeight: '900', marginTop: 8 },
  
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 8 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16, marginBottom: 24 },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
