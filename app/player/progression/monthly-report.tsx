import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MonthlyReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFF' : '#111';
  const textSecondary = isDark ? '#888' : '#666';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{t('analytics.monthly.title')}</ThemedText>
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI Header Badge */}
          <Animated.View entering={FadeInDown} style={[styles.aiBadge, { backgroundColor: tintColor + '15' }]}>
            <Ionicons name="sparkles" size={20} color={tintColor} />
            <Text style={[styles.aiBadgeText, { color: tintColor }]}>{t('analytics.monthly.ai_optimized')}</Text>
          </Animated.View>

          <ThemedText style={styles.monthTitle}>Mars 2026</ThemedText>
          
          {/* AI Executive Summary */}
          <Animated.View entering={FadeInDown.delay(200)} style={[styles.summaryCard, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.sectionSubtitle}>{t('analytics.monthly.summary')}</ThemedText>
            <Text style={[styles.summaryText, { color: textPrimary }]}>
              Ce mois-ci, tu as montré une progression exceptionnelle sur ta <Text style={{ fontWeight: 'bold', color: tintColor }}>vitesse de déclenchement</Text>. 
              Tes sessions HomeCourt indiquent une augmentation de 12% de ta réussite à 3 points. 
              Tes efforts physiques portent leurs fruits : ta détente a augmenté de 2cm. 
              {'\n\n'}Point de vigilance : Ton intensité (RPE) moyenne est de 8.5/10. Pense à bien intégrer tes jours de repos prévus.
            </Text>
          </Animated.View>

          {/* Comparison Stats */}
          <View style={styles.comparisonGrid}>
            <Animated.View entering={FadeInUp.delay(300)} style={[styles.compCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.compLabel, { color: textSecondary }]}>{t('analytics.monthly.points_per_match')}</Text>
                <ThemedText style={styles.compValue}>18.4</ThemedText>
                <Text style={styles.compTrend}>↑ +2.1 pts</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(400)} style={[styles.compCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.compLabel, { color: textSecondary }]}>{t('analytics.monthly.three_pt_rate')}</Text>
                <ThemedText style={styles.compValue}>38%</ThemedText>
                <Text style={styles.compTrend}>↑ +4%</Text>
            </Animated.View>
          </View>

          {/* Roadmap / Recommendations */}
          <Animated.View entering={FadeInDown.delay(500)} style={[styles.roadmapCard, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.sectionSubtitle}>{t('analytics.monthly.roadmap')}</ThemedText>
            
            <View style={styles.roadmapItem}>
                <View style={[styles.dot, { backgroundColor: tintColor }]} />
                <View style={styles.roadmapContent}>
                    <Text style={[styles.roadmapTitle, { color: textPrimary }]}>Focus : Mi-distance</Text>
                    <Text style={[styles.roadmapDesc, { color: textSecondary }]}>Maintenir la stabilité du coude sur les pull-ups.</Text>
                </View>
            </View>

            <View style={styles.roadmapItem}>
                <View style={[styles.dot, { backgroundColor: '#FFD60A' }]} />
                <View style={styles.roadmapContent}>
                    <Text style={[styles.roadmapTitle, { color: textPrimary }]}>Récupération Active</Text>
                    <Text style={[styles.roadmapDesc, { color: textSecondary }]}>Sommeil cible : 8h30/nuit pour optimiser la VFC.</Text>
                </View>
            </View>
          </Animated.View>

          {/* Drills suggestions */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionSubtitle}>{t('analytics.monthly.drills_suggested')}</ThemedText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.drillsScroll}>
            {[1, 2].map((i) => (
              <TouchableOpacity key={i} style={[styles.drillCard, { backgroundColor: cardBg }]}>
                <View style={styles.drillIcon}>
                    <Ionicons name="play" size={24} color="#FFF" />
                </View>
                <View style={styles.drillInfo}>
                    <Text style={[styles.drillTitle, { color: textPrimary }]}>Shooting Exit {i === 1 ? 'Corner' : 'Wing'}</Text>
                    <Text style={[styles.drillMeta, { color: textSecondary }]}>15 mins • {t('analytics.monthly.pro_intensity')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  title: { fontSize: 20, fontWeight: '900' },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  exportBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center' },

  content: { padding: 20 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  aiBadgeText: { fontSize: 13, fontWeight: '800' },
  monthTitle: { fontSize: 32, fontWeight: '900', marginBottom: 24 },

  summaryCard: { padding: 24, borderRadius: 28, marginBottom: 16 },
  sectionSubtitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  summaryText: { fontSize: 15, lineHeight: 24 },

  comparisonGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  compCard: { flex: 1, padding: 16, borderRadius: 24, justifyContent: 'center' },
  compLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  compValue: { fontSize: 24, fontWeight: '900' },
  compTrend: { fontSize: 11, fontWeight: '800', color: '#32D74B', marginTop: 4 },

  roadmapCard: { padding: 24, borderRadius: 28, marginBottom: 32 },
  roadmapItem: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  roadmapContent: { flex: 1 },
  roadmapTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  roadmapDesc: { fontSize: 13, fontWeight: '600' },

  sectionHeader: { marginBottom: 16 },
  drillsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  drillCard: { width: 260, padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 16 },
  drillIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  drillInfo: { gap: 2 },
  drillTitle: { fontSize: 15, fontWeight: '800' },
  drillMeta: { fontSize: 11, fontWeight: '600' },
});
