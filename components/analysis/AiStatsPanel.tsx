import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressLineChart } from '@/components/tracker/ProgressLineChart';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface AiStatsPanelProps {
  accuracyData: number[]; // From 'session' ai activities
  postureData: number[]; // Derived from 'shot' ai activities
  lastAccuracy?: number;
  lastPosture?: number;
}

export const AiStatsPanel = ({ accuracyData, postureData, lastAccuracy, lastPosture }: AiStatsPanelProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const colors = Colors[colorScheme];

  const hasData = accuracyData.length >= 2 || postureData.length >= 2;

  if (!hasData) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
        <Ionicons name="analytics" size={32} color={accentColor + '50'} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Réalisez au moins 2 analyses pour débloquer vos graphiques de progression.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Accuracy Chart */}
      {accuracyData.length >= 2 && (
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Précision au Tir (%)</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Evolution des dernières sessions</Text>
            </View>
            {lastAccuracy !== undefined && (
              <View style={[styles.percentageBadge, { backgroundColor: '#34C75915' }]}>
                <Text style={[styles.percentageText, { color: '#34C759' }]}>{lastAccuracy}%</Text>
              </View>
            )}
          </View>
          <ProgressLineChart data={accuracyData} height={120} />
        </View>
      )}

      {/* Posture Chart */}
      {postureData.length >= 2 && (
        <View style={[styles.chartCard, { backgroundColor: colors.card, marginTop: 16 }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Score Posture AI</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Qualité biomécanique</Text>
            </View>
            {lastPosture !== undefined && (
              <View style={[styles.percentageBadge, { backgroundColor: accentColor + '15' }]}>
                <Text style={[styles.percentageText, { color: accentColor }]}>{lastPosture}/100</Text>
              </View>
            )}
          </View>
          <ProgressLineChart data={postureData} height={120} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  chartCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});
