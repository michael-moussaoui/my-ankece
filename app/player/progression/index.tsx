import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

import { ProgressDashboard } from '@/components/analytics/ProgressDashboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlayerMetric, SessionReport, sessionReportService } from '@/services/sessionReportService';
import { trackerService } from '@/services/trackerService';
import { ShootingSession, ShotType } from '@/types/tracker';
import { ActivityCard } from '@/components/tracker/ActivityCard';

const SHOT_TYPES: { key: ShotType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: '3pt', label: '3 Points' },
  { key: 'ft', label: 'Lancer Franc' },
  { key: 'mid', label: 'Mid-Range' },
  { key: 'catch_shoot', label: 'Catch & Shoot' },
  { key: 'pull_up', label: 'Pull-up' },
  { key: 'step_back', label: 'Step-back' },
  { key: 'fadeaway', label: 'Fadeaway' },
];

export default function PlayerProgressionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFF' : '#111';
  const textSecondary = isDark ? '#888' : '#666';

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [shootingSessions, setShootingSessions] = useState<ShootingSession[]>([]);
  const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  const [filter, setFilter] = useState<'all' | 'coach' | 'shooting'>('all');
  const [shotTypeFilter, setShotTypeFilter] = useState<ShotType | 'all'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SessionReport | null>(null);
  
  // Player Log Form
  const [playerNotes, setPlayerNotes] = useState('');
  const [rpe, setRpe] = useState(5);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [reportsData, metricsData, shootingData] = await Promise.all([
        sessionReportService.getPlayerReports(user.uid),
        sessionReportService.getPlayerMetrics(user.uid),
        trackerService.getAllShootingSessions(user.uid)
      ]);
      setReports(reportsData);
      setMetrics(metricsData);
      setShootingSessions(shootingData);
    } catch (error) {
      console.error('Error loading progression data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayData = React.useMemo(() => {
    let combined: any[] = [];

    if (filter === 'all' || filter === 'coach') {
      combined = [...combined, ...reports.map(r => ({ ...r, type: 'coach' }))];
    }

    if (filter === 'all' || filter === 'shooting') {
      let shooting = shootingSessions;
      
      if (shotTypeFilter !== 'all') {
        shooting = shooting.filter((sess: ShootingSession) => sess.shots.some((shot: any) => shot.shotType === shotTypeFilter));
      }
      
      // If specific shooting filter, limit to 5
      if (filter === 'shooting') {
        shooting = shooting.slice(0, 5);
      } else if (filter === 'all') {
         // Optionally limit in 'all' too if requested, but user said 'all selected shots'
         // usually refers to the 'shooting' filter view.
      }

      combined = [...combined, ...shooting.map(s => ({ ...s, type: 'shooting', activityType: 'shooting', date: s.date }))];
    }

    // Sort by date desc
    return combined.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.date?.toDate ? a.date.toDate() : new Date(a.createdAt || a.date));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.date?.toDate ? b.date.toDate() : new Date(b.createdAt || b.date));
      return dateB - dateA;
    });
  }, [reports, shootingSessions, filter, shotTypeFilter]);

  const handleOpenLog = (report: SessionReport) => {
    setSelectedReport(report);
    setPlayerNotes(report.playerNotes || '');
    setRpe(report.rpe || 5);
    setShowLogModal(true);
  };

  const handleUpdateLog = async () => {
    if (!selectedReport?.id) return;
    try {
      await sessionReportService.updatePlayerNotes(selectedReport.id, playerNotes, rpe);
      setShowLogModal(false);
      loadData();
    } catch (error) {
        console.error('Error updating player log:', error);
    }
  };

  const renderHistoryItem = ({ item, index }: { item: any, index: number }) => {
    if (item.type === 'coach') {
      return (
        <Animated.View entering={FadeInRight.delay(index * 100)} layout={Layout.springify()}>
          <TouchableOpacity 
            style={[styles.reportCard, { backgroundColor: cardBg }]}
            onPress={() => handleOpenLog(item)}
          >
            <View style={styles.reportHeader}>
              <View style={styles.reportScore}>
                <Text style={styles.scoreValue}>{item.rating}</Text>
                <Text style={styles.scoreLabel}>/10</Text>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.reportDate}>{new Date(item.createdAt?.toDate()).toLocaleDateString()}</ThemedText>
                <Text style={{ color: textSecondary, fontSize: 12 }}>{t('analytics.report.coach_log')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textSecondary} />
            </View>

            <View style={styles.tagList}>
              {item.strengths.slice(0, 3).map((s: string) => (
                <View key={s} style={[styles.tag, { backgroundColor: tintColor + '10' }]}>
                  <Text style={[styles.tagText, { color: tintColor }]}>{s}</Text>
                </View>
              ))}
            </View>
            
            {item.playerNotes ? (
              <View style={styles.logIndicator}>
                <Ionicons name="checkmark-circle" size={14} color="#32D74B" />
                <Text style={styles.logIndicatorText}>{t('analytics.report.added_notes')}</Text>
              </View>
            ) : (
              <View style={styles.logIndicator}>
                <Ionicons name="alert-circle" size={14} color="#FF9F0A" />
                <Text style={[styles.logIndicatorText, { color: '#FF9F0A' }]}>{t('analytics.report.add_notes')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    } else {
        // Shooting Activity
        const shotData = shotTypeFilter !== 'all' 
            ? item.shots.find((s: any) => s.shotType === shotTypeFilter)
            : null;
        
        const activity = {
            ...item,
            activityType: 'shooting',
            totalMade: shotData ? shotData.made : item.totalMade,
            totalShots: shotData ? shotData.attempts : item.totalShots,
        };

        return (
            <Animated.View entering={FadeInRight.delay(index * 100)} layout={Layout.springify()} style={{ marginHorizontal: 20 }}>
                <ActivityCard activity={activity} onPress={() => {}} />
            </Animated.View>
        );
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{t('analytics.title')}</ThemedText>
          <TouchableOpacity onPress={() => {/* Future: Export PDF */}}>
            <Ionicons name="share-outline" size={24} color={textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          ListHeaderComponent={
            <View>
              <ProgressDashboard metrics={metrics} onRefresh={loadData} />
              
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: tintColor + '15' }]}
                    onPress={() => router.push('/player/progression/monthly-report' as any)}
                >
                    <Ionicons name="sparkles" size={24} color={tintColor} />
                    <Text style={[styles.actionText, { color: tintColor }]}>{t('analytics.monthly.title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: cardBg }]}
                    onPress={() => router.push('/player/progression/integrations' as any)}
                >
                    <Ionicons name="link" size={24} color={textPrimary} />
                    <Text style={[styles.actionText, { color: textPrimary }]}>{t('analytics.monthly.integrations')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reportsHeader}>
                <ThemedText style={styles.sectionTitle}>{t('analytics.report.history')}</ThemedText>
                
                {/* Category Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity 
                    onPress={() => setFilter('all')} 
                    style={[styles.filterChip, filter === 'all' && { backgroundColor: tintColor }]}
                  >
                    <Text style={[styles.filterChipText, filter === 'all' && { color: '#fff' }]}>Tous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setFilter('coach')} 
                    style={[styles.filterChip, filter === 'coach' && { backgroundColor: tintColor }]}
                  >
                    <Text style={[styles.filterChipText, filter === 'coach' && { color: '#fff' }]}>Coach</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setFilter('shooting')} 
                    style={[styles.filterChip, filter === 'shooting' && { backgroundColor: tintColor }]}
                  >
                    <Text style={[styles.filterChipText, filter === 'shooting' && { color: '#fff' }]}>Séances de Tir</Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Sub-filter for Shot Types */}
                {(filter === 'shooting' || filter === 'all') && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { marginTop: 8 }]}>
                    {SHOT_TYPES.map(st => (
                      <TouchableOpacity 
                        key={st.key}
                        onPress={() => setShotTypeFilter(st.key as any)} 
                        style={[styles.subFilterChip, shotTypeFilter === st.key && { borderColor: tintColor, backgroundColor: tintColor + '10' }]}
                      >
                        <Text style={[styles.subFilterChipText, { color: shotTypeFilter === st.key ? tintColor : textSecondary }]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          }
          data={displayData}
          keyExtractor={(item) => item.id! + (item.type || '')}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Player Log Modal */}
        <Modal visible={showLogModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('analytics.report.player_notes')}</ThemedText>
                <TouchableOpacity onPress={() => setShowLogModal(false)}>
                  <Ionicons name="close" size={24} color={textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ marginBottom: 20 }}>
                {/* Review Coach Comment first */}
                <View style={[styles.coachCommentBox, { backgroundColor: cardBg }]}>
                  <Text style={[styles.label, { color: tintColor }]}>{t('analytics.report.comment')} : {selectedReport?.rating}/10</Text>
                  <Text style={{ color: textPrimary, marginTop: 8 }}>{selectedReport?.coachComment}</Text>
                </View>

                <ThemedText style={styles.label}>{t('analytics.report.intensity')}</ThemedText>
                <View style={styles.rpeGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <TouchableOpacity 
                        key={val} 
                        onPress={() => setRpe(val)}
                        style={[styles.rpeBtn, { backgroundColor: rpe === val ? tintColor : cardBg }]}
                    >
                        <Text style={{ color: rpe === val ? '#FFF' : textPrimary, fontWeight: 'bold' }}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ThemedText style={styles.label}>{t('analytics.report.player_question')}</ThemedText>
                <TextInput
                  style={[styles.textArea, { backgroundColor: cardBg, color: textPrimary }]}
                  multiline
                  placeholder={t('analytics.report.player_notes_placeholder')}
                  placeholderTextColor={textSecondary}
                  value={playerNotes}
                  onChangeText={setPlayerNotes}
                />

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: tintColor }]}
                  onPress={handleUpdateLog}
                >
                  <Text style={styles.saveBtnText}>{t('analytics.report.save_log')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '900' },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },

  listContent: { paddingBottom: 100 },
  reportsHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },

  quickActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 32 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  actionText: { fontSize: 12, fontWeight: '800' },
  
  filterScroll: { paddingHorizontal: 0, marginBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(150,150,150,0.1)', marginRight: 8 },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#888' },
  
  subFilterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)', marginRight: 6 },
  subFilterChipText: { fontSize: 11, fontWeight: '600' },

  reportCard: { marginHorizontal: 20, padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reportScore: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  scoreValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  scoreLabel: { color: '#FFF', fontSize: 10, opacity: 0.7, marginBottom: -4 },
  reportDate: { fontSize: 16, fontWeight: '700' },

  tagList: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700' },

  logIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logIndicatorText: { fontSize: 12, fontWeight: '600', color: '#32D74B' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900' },

  coachCommentBox: { padding: 16, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '800', marginBottom: 12, marginTop: 8 },
  
  rpeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  rpeBtn: { width: (SCREEN_WIDTH - 84) / 5, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  textArea: { padding: 16, borderRadius: 16, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 24 },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
});
