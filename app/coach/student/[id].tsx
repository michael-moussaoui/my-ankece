import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ProgressLineChart } from '@/components/tracker/ProgressLineChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachByUserId, updateStudentNotes } from '@/services/coachService';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'progression' | 'history' | 'notes';

export default function StudentDetailScreen() {
  const { t } = useTranslation();
  const { id: playerId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const tintColor = accentColor;
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBorder = isDark ? '#2A2A2A' : '#E5E7EB';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#888888' : '#666666';

  const [activeTab, setActiveTab] = useState<TabType>('progression');
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [playerId, user]);

  const fetchData = async () => {
    if (!user || !playerId) return;
    try {
      setLoading(true);
      const coachProfile = await getCoachByUserId(user.uid);
      if (!coachProfile) return;
      setCoachId(coachProfile.id);

      // 1. Fetch Student Relation Info
      const relationId = `${coachProfile.id}_${playerId}`;
      const relationRef = doc(db, 'coach_students', relationId);
      const relationSnap = await getDoc(relationRef);
      
      if (relationSnap.exists()) {
        const data = relationSnap.data();
        setStudentData(data);
        setNotes(data.notes || '');
      }

      // 2. Fetch History
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('coachId', '==', coachProfile.id),
        where('playerId', '==', playerId),
        orderBy('date', 'desc')
      );
      const historySnap = await getDocs(q);
      setHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!coachId || !playerId) return;
    try {
      setSavingNotes(true);
      await updateStudentNotes(coachId, playerId as string, notes);
      Alert.alert(t('common.success'), 'Notes enregistrées');
    } catch (error) {
      Alert.alert(t('common.error'), 'Erreur lors de la sauvegarde');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progression':
        return (
          <Animated.View entering={FadeInDown} style={styles.tabContent}>
            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <ThemedText style={styles.chartTitle}>{t('coach.students.details.stats.shooting')}</ThemedText>
              <ProgressLineChart data={[35, 42, 38, 45, 52, 48, 55]} height={120} />
              <View style={styles.chartFooter}>
                <ThemedText style={styles.chartValue}>55%</ThemedText>
                <Text style={{ color: '#22C55E', fontWeight: '700' }}>+7% vs last week</Text>
              </View>
            </View>

            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <ThemedText style={styles.chartTitle}>{t('coach.students.details.stats.physical')}</ThemedText>
              <ProgressLineChart data={[12, 15, 14, 18, 16, 20, 22]} height={120} />
              <View style={styles.chartFooter}>
                <ThemedText style={styles.chartValue}>22 pts</ThemedText>
                <Text style={{ color: '#22C55E', fontWeight: '700' }}>+12% average</Text>
              </View>
            </View>
          </Animated.View>
        );
      case 'history':
        return (
          <Animated.View entering={FadeInDown} style={styles.tabContent}>
            {history.map((session, i) => (
              <View key={session.id} style={[styles.historyItem, { borderBottomColor: cardBorder }]}>
                <View style={[styles.historyIcon, { backgroundColor: tintColor + '15' }]}>
                  <Ionicons name="basketball-outline" size={20} color={tintColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.historyDate}>{session.date}</ThemedText>
                  <Text style={{ color: textSecondary, fontSize: 13 }}>{session.startTime} — {session.endTime} • {session.location}</Text>
                </View>
                <ThemedText style={styles.historyPrice}>{session.price}€</ThemedText>
              </View>
            ))}
            {history.length === 0 && (
              <ThemedText style={styles.emptyText}>Aucune séance enregistrée</ThemedText>
            )}
          </Animated.View>
        );
      case 'notes':
        return (
          <Animated.View entering={FadeInDown} style={styles.tabContent}>
            <View style={[styles.notesContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <TextInput
                style={[styles.notesInput, { color: textPrimary }]}
                multiline
                placeholder={t('coach.students.details.notes_placeholder')}
                placeholderTextColor={textSecondary}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: tintColor }]}
              onPress={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('coach.students.details.save_notes')}</Text>}
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{studentData?.playerName || 'Détails Élève'}</ThemedText>
          <TouchableOpacity style={styles.msgBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={[styles.avatarLarge, { backgroundColor: tintColor + '15' }]}>
              <Ionicons name="person" size={50} color={tintColor} />
            </View>
            <ThemedText style={styles.studentNameLarge}>{studentData?.playerName}</ThemedText>
            <View style={styles.quickStats}>
              <View style={styles.qStat}>
                <ThemedText style={styles.qValue}>{studentData?.bookingCount || 0}</ThemedText>
                <Text style={styles.qLabel}>Séances</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.qStat}>
                <ThemedText style={styles.qValue}>4.8</ThemedText>
                <Text style={styles.qLabel}>Assiduité</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.qStat}>
                <ThemedText style={styles.qValue}>3</ThemedText>
                <Text style={styles.qLabel}>Mois</Text>
              </View>
            </View>
          </View>

          {/* Tabs Navigation */}
          <View style={styles.tabsContainer}>
            {(['progression', 'history', 'notes'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomColor: tintColor, borderBottomWidth: 3 }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === tab ? tintColor : textSecondary }
                ]}>
                  {t(`coach.students.details.${tab}`).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.contentContainer}>
            {renderTabContent()}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#8882', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  msgBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  
  hero: { alignItems: 'center', paddingVertical: 20 },
  avatarLarge: { width: 100, height: 100, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  studentNameLarge: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  quickStats: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: '#8881', padding: 16, borderRadius: 24 },
  qStat: { alignItems: 'center' },
  qValue: { fontSize: 18, fontWeight: '900' },
  qLabel: { fontSize: 12, color: '#888' },
  divider: { width: 1, height: 30, backgroundColor: '#8883' },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, borderBottomWidth: 1, borderBottomColor: '#8882' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  contentContainer: { padding: 20 },
  tabContent: { gap: 16 },
  
  chartCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  chartTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  chartValue: { fontSize: 20, fontWeight: '900' },

  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1 },
  historyIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  historyDate: { fontSize: 16, fontWeight: '700' },
  historyPrice: { fontSize: 16, fontWeight: '900' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontStyle: 'italic' },

  notesContainer: { borderRadius: 24, borderWidth: 1, padding: 16, minHeight: 250 },
  notesInput: { flex: 1, fontSize: 16, lineHeight: 24 },
  saveBtn: { height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
