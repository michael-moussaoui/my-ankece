import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ActivityCardProps {
  activity: any;
  onPress?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const { accentColor } = useAppTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = accentColor;

  const getIcon = () => {
    switch (activity.activityType) {
      case 'shooting': return 'basketball';
      case 'dribble': return 'flash';
      case 'ai': 
        if (activity.type === 'shot') return 'body';
        if (activity.type === 'session') return 'analytics';
        return 'finger-print';
      default: return 'analytics';
    }
  };

  const getTitle = () => {
    switch (activity.activityType) {
      case 'shooting': return 'Session de Tir';
      case 'dribble': return 'Workout Dribble';
      case 'ai': 
        if (activity.type === 'shot') return 'Analyse Posture IA';
        if (activity.type === 'session') return 'Comptage Session IA';
        return 'Analyse Dribble IA';
      default: return 'Activité';
    }
  };

  const getSubtitle = () => {
    if (activity.activityType === 'shooting') {
      return `${activity.totalMade}/${activity.totalShots} tirs réussis`;
    }
    if (activity.activityType === 'dribble') {
      return `${activity.repetitions} répétitions • ${activity.comboType}`;
    }
    if (activity.activityType === 'ai') {
        if (activity.type === 'shot') return `Score: ${activity.results?.elbow_score || 85}/100`;
        if (activity.type === 'session') {
            const res = activity.results?.analysis || activity.results;
            return `${res?.makes || 0}/${res?.total_shots || 0} tirs détectés`;
        }
        if (activity.type === 'dribble') {
            const res = activity.results?.analysis || activity.results;
            return `${res?.dribble_count || 0} dribbles détectés`;
        }
    }
    return '';
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: tintColor + '15' }]}>
        <Ionicons name={getIcon() as any} size={24} color={tintColor} />
      </View>
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>{getTitle()}</ThemedText>
        <ThemedText style={styles.subtitle}>{getSubtitle()}</ThemedText>
        <ThemedText style={styles.date}>{formatDate(activity.date)}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    opacity: 0.4,
    marginTop: 4,
  }
});
