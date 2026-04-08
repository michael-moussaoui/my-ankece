import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { RadarChart } from './RadarChart';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlayerMetric } from '@/services/sessionReportService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressDashboardProps {
  metrics: PlayerMetric[];
  playerStats?: any;
  onRefresh?: () => void;
}

export const ProgressDashboard = ({ metrics, onRefresh }: ProgressDashboardProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textSecondary = isDark ? '#888' : '#666';

  // Sample data for Radar Chart (derived from metrics or passed as prop)
  const skillData = [
    { label: t('analytics.dashboard.shooting'), value: 75 },
    { label: t('analytics.dashboard.physical'), value: 85 },
    { label: t('analytics.dashboard.tactical'), value: 60 },
    { label: t('analytics.dashboard.game'), value: 70 },
    { label: 'Defense', value: 80 },
  ];

  const renderMetricCard = (title: string, value: string | number, subValue: string, icon: any, color: string, index: number) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)} 
      key={`metric-${index}`}
      style={[styles.metricCard, { backgroundColor: cardBg }]}
    >
      <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.metricInfo}>
        <Text style={[styles.metricLabel, { color: textSecondary }]}>{title}</Text>
        <ThemedText style={styles.metricValue}>{value}</ThemedText>
        <Text style={[styles.metricSubValue, { color: color }]}>{subValue}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>{t('analytics.dashboard.metrics')}</ThemedText>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Radar Chart Section */}
      <Animated.View entering={FadeInDown} style={[styles.radarSection, { backgroundColor: cardBg }]}>
        <ThemedText style={styles.sectionSubtitle}>Profil de Joueur</ThemedText>
        <RadarChart data={skillData} size={280} color={tintColor} />
      </Animated.View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {renderMetricCard(
            t('analytics.dashboard.shooting'), 
            '48%', 
            '+5% sync monthly', 
            'basketball', 
            '#FF9F0A', 
            1
        )}
        {renderMetricCard(
            'Points/Match', 
            '18.4', 
            '+2.1 pts vs prev', 
            'podium', 
            '#32D74B', 
            2
        )}
        {renderMetricCard(
            'Jump Height', 
            '72cm', 
            'Elite Level', 
            'trending-up', 
            '#AF52DE', 
            3
        )}
        {renderMetricCard(
            'Dribble Speed', 
            '8.2m/s', 
            'Stable', 
            'flash', 
            '#5AC8FA', 
            4
        )}
      </View>

      {/* Evolution Mini-Chart Placeholder */}
      <Animated.View entering={FadeInDown.delay(400)} style={[styles.evolutionSection, { backgroundColor: cardBg }]}>
        <View style={styles.evolutionHeader}>
            <ThemedText style={styles.sectionSubtitle}>{t('analytics.dashboard.evolution')}</ThemedText>
            <View style={styles.evolutionBadge}>
                <Text style={styles.evolutionBadgeText}>Sniper Level</Text>
            </View>
        </View>
        
        {/* Placeholder for a simple line chart */}
        <View style={styles.chartPlaceholder}>
            {/* We could use Skia here again for a sparkline */}
            <Ionicons name="stats-chart" size={48} color={tintColor + '40'} />
            <Text style={{ color: textSecondary, marginTop: 10, fontSize: 12 }}>Visualisation de la progression en cours...</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900' },
  
  radarSection: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionSubtitle: { fontSize: 16, fontWeight: '800' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metricCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  metricInfo: { gap: 2 },
  metricLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { fontSize: 22, fontWeight: '900' },
  metricSubValue: { fontSize: 10, fontWeight: '600' },

  evolutionSection: {
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  evolutionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  evolutionBadge: { backgroundColor: '#FFD60A20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  evolutionBadgeText: { color: '#FFD60A', fontSize: 11, fontWeight: '800' },
  chartPlaceholder: { height: 120, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#8884', borderRadius: 16 },
});
