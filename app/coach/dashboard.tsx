import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachByUserId } from '@/services/coachService';
import { Coach } from '@/types/coach';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── MOCK DATA (replaced by Firestore later) ──────────────────────────────────
const MOCK_REVENUE = {
  current: 3240,
  previous: 2750,
  sparkline: [820, 1100, 900, 1400, 1200, 1800, 2100, 1900, 2400, 2800, 3100, 3240],
};

const MOCK_SESSIONS = [
  { id: '1', playerName: 'Kevin Martin', playerInitials: 'KM', type: 'Tir & Shoot', date: "Auj. 18h00", color: '#FF4500' },
  { id: '2', playerName: 'Lisa Torres', playerInitials: 'LT', type: 'Physique', date: 'Dem. 10h30', color: '#FFD700' },
  { id: '3', playerName: 'Amine Diallo', playerInitials: 'AD', type: 'Technique', date: 'Jeu. 16h00', color: '#00E5FF' },
  { id: '4', playerName: 'Sarah Benali', playerInitials: 'SB', type: 'Mental', date: 'Ven. 09h00', color: '#A855F7' },
];

const MOCK_PLAYERS = [
  { id: '1', name: 'Kevin Martin', initials: 'KM', position: 'PG', progress: 82, color: '#FF4500' },
  { id: '2', name: 'Lisa Torres', initials: 'LT', position: 'SG', progress: 71, color: '#FFD700' },
  { id: '3', name: 'Amine Diallo', initials: 'AD', position: 'PF', progress: 55, color: '#00E5FF' },
  { id: '4', name: 'Sarah Benali', initials: 'SB', position: 'C', progress: 44, color: '#A855F7' },
  { id: '5', name: 'Hugo Leroy', initials: 'HL', position: 'SF', progress: 38, color: '#22C55E' },
];

const QUICK_STATS = [
  { label: 'séances', value: '14', icon: 'basketball-outline' as const },
  { label: 'planning', value: '91%', icon: 'calendar-outline' as const },
  { label: 'note moy.', value: '4.8★', icon: 'star-outline' as const },
];
// ─────────────────────────────────────────────────────────────────────────────

// Sparkline mini chart component
function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = 50;
  const step = chartWidth / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: chartHeight - ((v - min) / range) * chartHeight,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={{ height: chartHeight, marginTop: 8 }}>
      <Svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
        <Defs>
          <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={`${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`} fill="url(#sparkGrad)" />
        <Path d={pathD} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} />
      </Svg>
    </View>
  );
}

// Animated revenue counter
function RevenueCounter({ value, color }: { value: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayed(value);
        clearInterval(intervalRef.current);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(intervalRef.current);
  }, [value]);

  return (
    <Text style={[styles.revenueAmount, { color }]}>
      {displayed.toLocaleString('fr-FR')} €
    </Text>
  );
}

// Progress bar with spring animation
function AnimatedProgressBar({ progress, color, delay }: { progress: number; color: string; delay: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      width.value = withSpring(progress, { damping: 20, stiffness: 90 });
    }, delay);
  }, [progress, delay]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle, { backgroundColor: color }]} />
    </View>
  );
}

export default function CoachDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor } = useAppTheme();
  const { user } = useAuth();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  const pctChange = Math.round(((MOCK_REVENUE.current - MOCK_REVENUE.previous) / MOCK_REVENUE.previous) * 100);
  const isPositive = pctChange >= 0;

  // Pulsing dot animation for live indicator
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.4, { duration: 800 }), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getCoachByUserId(user.uid)
      .then(setCoach)
      .finally(() => setLoading(false));
  }, [user]);

  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0A0A0A' : '#F0F2F5';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const cardBorder = isDark ? '#222' : '#E5E7EB';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#888' : '#666';

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <ThemedText style={[styles.headerGreeting, { color: textSecondary }]}>
              {t('coach.dashboard.greeting', { name: coach?.name?.split(' ')[0] || 'Coach' })}
            </ThemedText>
            <ThemedText style={[styles.headerTitle, { color: textPrimary }]}>
              Dashboard
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Animated.View style={[styles.liveDot, pulseStyle, { backgroundColor: '#22C55E' }]} />
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: accentColor }]}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── REVENUE CARD ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/coach/revenue' as any)}
              style={[styles.revenueCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={styles.revenueHeader}>
                <View style={[styles.revenueIconBg, { backgroundColor: accentColor + '22' }]}>
                  <Ionicons name="wallet-outline" size={20} color={accentColor} />
                </View>
                <ThemedText style={[styles.revenueLabel, { color: textSecondary }]}>
                  {t('coach.dashboard.monthlyRevenue', 'Revenus du mois')}
                </ThemedText>
                <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#22C55E22' : '#EF444422' }]}>
                  <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={14} color={isPositive ? '#22C55E' : '#EF4444'} />
                  <Text style={[styles.changeText, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
                    {isPositive ? '+' : ''}{pctChange}%
                  </Text>
                </View>
              </View>

              <RevenueCounter value={MOCK_REVENUE.current} color={accentColor} />
              <Text style={[styles.revenueSubtitle, { color: textSecondary }]}>
                vs {MOCK_REVENUE.previous.toLocaleString('fr-FR')} € le mois dernier
              </Text>

              <SparklineChart data={MOCK_REVENUE.sparkline} color={accentColor} />
            </TouchableOpacity>
          </Animated.View>

          {/* ── QUICK STATS ──────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.quickStatsRow}>
            {QUICK_STATS.map((stat, i) => (
              <View key={i} style={[styles.quickStatCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name={stat.icon} size={20} color={accentColor} style={{ marginBottom: 6 }} />
                <Text style={[styles.quickStatValue, { color: textPrimary }]}>{stat.value}</Text>
                <Text style={[styles.quickStatLabel, { color: textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ── UPCOMING SESSIONS ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
                {t('coach.dashboard.upcomingSessions', 'Prochaines séances')}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/coach/agenda' as any)}>
                <Text style={[styles.sectionLink, { color: accentColor }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionScroll}>
              {MOCK_SESSIONS.map((session, i) => (
                <Animated.View
                  key={session.id}
                  entering={FadeInRight.delay(300 + i * 60).springify()}
                  style={[styles.sessionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: session.color, borderLeftWidth: 4 }]}
                >
                  <View style={[styles.sessionAvatar, { backgroundColor: session.color + '22' }]}>
                    <Text style={[styles.sessionAvatarText, { color: session.color }]}>{session.playerInitials}</Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionPlayer, { color: textPrimary }]} numberOfLines={1}>{session.playerName}</Text>
                    <Text style={[styles.sessionType, { color: textSecondary }]} numberOfLines={1}>{session.type}</Text>
                    <View style={styles.sessionDateRow}>
                      <Ionicons name="time-outline" size={12} color={session.color} />
                      <Text style={[styles.sessionDate, { color: session.color }]}>{session.date}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── ACTIVE PLAYERS ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
                {t('coach.dashboard.activePlayers', 'Joueurs les plus actifs')}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/coach/students' as any)}>
                <Text style={[styles.sectionLink, { color: accentColor }]}>
                  {t('coach.dashboard.seeAll', 'Voir tous')} ({MOCK_PLAYERS.length + 7})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.playersCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {MOCK_PLAYERS.map((player, i) => (
                <Animated.View
                  key={player.id}
                  entering={FadeInLeft.delay(400 + i * 70).springify()}
                  style={[styles.playerRow, i < MOCK_PLAYERS.length - 1 && { borderBottomColor: cardBorder, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.playerAvatar, { backgroundColor: player.color + '22' }]}>
                    <Text style={[styles.playerAvatarText, { color: player.color }]}>{player.initials}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerNameRow}>
                      <Text style={[styles.playerName, { color: textPrimary }]}>{player.name}</Text>
                      <Text style={[styles.playerPosition, { color: textSecondary }]}>{player.position}</Text>
                    </View>
                    <View style={styles.progressRow}>
                      <AnimatedProgressBar progress={player.progress} color={player.color} delay={400 + i * 100} />
                      <Text style={[styles.progressPct, { color: player.color }]}>{player.progress}%</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── ACADEMY SECTION ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(420).springify()}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/coach/content')}
              style={[styles.programCard, { backgroundColor: '#000', borderColor: '#FF4500', borderWidth: 2 }]}
            >
              <View style={[styles.programIconBg, { backgroundColor: '#FF4500' + '22' }]}>
                <Ionicons name="flash" size={24} color="#FF4500" />
              </View>
              <View style={styles.programTextContainer}>
                <ThemedText style={[styles.programCardTitle, { color: '#FF4500' }]}>
                  {t('academy.lab').toUpperCase()}
                </ThemedText>
                <Text style={[styles.programCardSubtitle, { color: '#888' }]}>
                  {t('academy.title').toUpperCase()} - Gère ton contenu
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FF4500" />
            </TouchableOpacity>
          </Animated.View>

          {/* ── QUICK ACTIONS ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: accentColor }]}
              onPress={() => router.push('/coach/agenda' as any)}
            >
              <Ionicons name="calendar" size={20} color="#FFF" />
              <Text style={styles.quickActionText}>Planning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1 }]}
              onPress={() => router.push('/coach/students' as any)}
            >
              <Ionicons name="people-outline" size={20} color={textPrimary} />
              <Text style={[styles.quickActionText, { color: textPrimary }]}>Joueurs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1 }]}
              onPress={() => router.push('/coach/programs')}
            >
              <Ionicons name="clipboard-outline" size={20} color={textPrimary} />
              <Text style={[styles.quickActionText, { color: textPrimary }]}>{t('coach.dashboard.programs')}</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerGreeting: { fontSize: 13, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  // Revenue card
  revenueCard: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  revenueIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  revenueLabel: { flex: 1, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  changeText: { fontSize: 13, fontWeight: '700' },
  revenueAmount: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  revenueSubtitle: { fontSize: 12, marginTop: 4 },

  // Quick stats
  quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickStatCard: {
    flex: 1, borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickStatValue: { fontSize: 18, fontWeight: '900' },
  quickStatLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, textAlign: 'center' },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionLink: { fontSize: 13, fontWeight: '600' },

  // Sessions
  sessionScroll: { marginBottom: 24 },
  sessionCard: {
    width: 160, borderRadius: 16, padding: 14, marginRight: 12,
    borderWidth: 1, flexDirection: 'column', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sessionAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sessionAvatarText: { fontSize: 16, fontWeight: '800' },
  sessionInfo: { gap: 3 },
  sessionPlayer: { fontSize: 14, fontWeight: '700' },
  sessionType: { fontSize: 12 },
  sessionDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sessionDate: { fontSize: 11, fontWeight: '700' },

  // Players
  playersCard: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  playerAvatar: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { fontSize: 14, fontWeight: '800' },
  playerInfo: { flex: 1, gap: 6 },
  playerNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerName: { fontSize: 15, fontWeight: '700' },
  playerPosition: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#9993', overflow: 'hidden' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#9993', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '800', width: 36, textAlign: 'right' },

  // Quick actions
  quickActionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  quickActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  quickActionText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Program Card
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    gap: 16,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  programIconBg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  programTextContainer: {
    flex: 1,
  },
  programCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  programCardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
