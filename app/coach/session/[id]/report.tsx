import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSessionById } from '@/services/bookingService';
import { sessionReportService } from '@/services/sessionReportService';
import { BookingSession } from '@/types/booking';

const STRENGTH_OPTIONS = [
  { id: 'shooting', labelKey: 'analytics.report.skills.shooting' },
  { id: 'defense', labelKey: 'analytics.report.skills.defense' },
  { id: 'ball_handling', labelKey: 'analytics.report.skills.ball_handling' },
  { id: 'footwork', labelKey: 'analytics.report.skills.footwork' },
  { id: 'conditioning', labelKey: 'analytics.report.skills.conditioning' },
  { id: 'tactical', labelKey: 'analytics.report.skills.tactical' },
  { id: 'rebounding', labelKey: 'analytics.report.skills.rebounding' },
  { id: 'leadership', labelKey: 'analytics.report.skills.leadership' }
];

export default function SessionReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const inputBg = isDark ? '#000' : '#F2F2F7';
  const textPrimary = isDark ? '#FFF' : '#111';
  const textSecondary = isDark ? '#888' : '#666';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<BookingSession | null>(null);

  // Form State
  const [rating, setRating] = useState(7);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (id) loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const data = await getSessionById(id);
      if (data) {
        setSession(data);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrength = (id: string) => {
    if (strengths.includes(id)) {
      setStrengths(strengths.filter(s => s !== id));
    } else {
      setStrengths([...strengths, id]);
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    
    setSaving(true);
    try {
      await sessionReportService.createReport({
        sessionId: session.id,
        coachId: session.coachId,
        playerId: session.playerId!,
        rating,
        strengths,
        improvements: [improvements],
        recommendedDrills: [],
        coachComment: comment,
      });

      // Optionally update session status to 'completed' here if not already done
      
      Alert.alert(t('common.success'), t('analytics.report.success'), [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert(t('common.error'), t('common.error_msg'));
    } finally {
      setSaving(false);
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
            <Ionicons name="close" size={28} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>{t('analytics.report.title')}</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.playerSummary, { backgroundColor: cardBg }]}>
            <View style={[styles.avatar, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="person" size={24} color={tintColor} />
            </View>
            <View>
              <ThemedText style={styles.playerName}>{session?.playerName}</ThemedText>
              <Text style={{ color: textSecondary }}>{session?.date} • {session?.startTime}</Text>
            </View>
          </View>

          {/* Rating Slider */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('analytics.report.rating')} : {rating}/10</ThemedText>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={rating}
              onValueChange={setRating}
              minimumTrackTintColor={tintColor}
              maximumTrackTintColor={isDark ? '#333' : '#DDD'}
              thumbTintColor={tintColor}
            />
          </View>

          {/* Strengths Multi-Select */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('analytics.report.strengths')}</ThemedText>
            <View style={styles.tagGrid}>
              {STRENGTH_OPTIONS.map(opt => (
                <TouchableOpacity 
                  key={opt.id}
                  onPress={() => toggleStrength(opt.id)}
                  style={[
                    styles.tag, 
                    { backgroundColor: strengths.includes(opt.id) ? tintColor : inputBg }
                  ]}
                >
                  <Text style={[styles.tagText, { color: strengths.includes(opt.id) ? '#FFF' : textSecondary }]}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Improvements */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('analytics.report.improvements')}</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: inputBg, color: textPrimary }]}
              multiline
              numberOfLines={3}
              placeholder={t('analytics.report.player_notes_placeholder')}
              placeholderTextColor={textSecondary}
              value={improvements}
              onChangeText={setImprovements}
            />
          </View>

          {/* Coach Comment */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('analytics.report.comment')}</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: inputBg, color: textPrimary }]}
              multiline
              numberOfLines={4}
              placeholder="..."
              placeholderTextColor={textSecondary}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: tintColor }]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{t('analytics.report.submit')}</Text>}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  
  content: { flex: 1, paddingHorizontal: 20 },
  playerSummary: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 16, marginBottom: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  playerName: { fontSize: 18, fontWeight: '800' },

  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  tagText: { fontSize: 13, fontWeight: '600' },

  textArea: { padding: 16, borderRadius: 16, fontSize: 16, textAlignVertical: 'top', minHeight: 80 },
  
  submitBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
});
