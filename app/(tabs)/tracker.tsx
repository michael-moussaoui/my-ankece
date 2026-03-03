import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackerService } from '@/services/trackerService';
import { UserStats } from '@/types/tracker';

import { AnkeceLogo } from '@/components/AnkeceLogo';
import { BadgeList } from '@/components/tracker/BadgeList';
import { ProgressLineChart } from '@/components/tracker/ProgressLineChart';
import { RadarChart } from '@/components/tracker/RadarChart';
import { UserIconButton } from '@/components/UserIconButton';
import { notificationService } from '@/services/notificationService';
import { getDynamicTip } from '@/utils/tipUtils';

const SHOT_TYPE_LABELS: Record<string, string> = {
  '3pt': '3 Points',
  'ft': 'Lancers Francs',
  'mid': 'Mi-Dist.',
  'catch_shoot': 'Catch & Shoot',
  'pull_up': 'Pull-up',
  'step_back': 'Step Back',
  'fadeaway': 'Fadeaway'
};

const { width } = Dimensions.get('window');

export default function TrackerScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentShooting, setRecentShooting] = useState<number[]>([]);
  const [timeframe, setTimeframe] = useState<'D' | 'W' | 'M' | 'Y'>('D');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const dynamicTip = React.useMemo(() => getDynamicTip(stats), [stats]);

  useEffect(() => {
    if (user) {
      loadStats();
      const unsubscribe = notificationService.subscribeToUserNotifications(user.uid, (notifs) => {
        const unread = notifs.filter(n => !n.readBy.includes(user.uid) && !n.archivedBy.includes(user.uid)).length;
        setUnreadCount(unread);
      });
      return () => unsubscribe();
    }
  }, [user, timeframe]);

  const loadStats = async () => {
    if (!user) return;
    try {
      const [statsData, aggregatedData] = await Promise.all([
        trackerService.getUserStats(user.uid),
        trackerService.getAggregatedStats(user.uid, timeframe)
      ]);
      
      setStats(statsData);
      
      // Use aggregated data or dummy for premium look if empty
      if (aggregatedData.length < 2) {
        // Dummy data based on timeframe to show "something" beautiful
        const dummy = timeframe === 'D' ? [5, 12, 8, 15, 10, 20, 18] : 
                      timeframe === 'W' ? [40, 65, 50, 80, 70, 95, 110] :
                      [150, 220, 180, 250, 310, 280, 350];
        setRecentShooting(dummy);
      } else {
        setRecentShooting(aggregatedData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const radarData = [
    { label: 'SHOOT', value: 0.8 },
    { label: 'DRIBBLE', value: 0.6 },
    { label: 'DEFENSE', value: 0.4 },
    { label: 'FITNESS', value: 0.7 },
    { label: 'IQ', value: 0.5 },
  ];

  if (loading) {
// ... existing loader ...
  }

  return (
    <ThemedView style={styles.container}>
      {/* Hero Header */}
      <Animated.View entering={FadeInDown.duration(1000)} style={styles.heroContainer}>
        <Image
          source={require('@/assets/images/tracker_hero_bg.png')}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />

        {/* Logo top-left */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(800)}
          style={[styles.heroLogoTopLeft, { top: insets.top + 12 }]}
        >
          <AnkeceLogo
            style={styles.heroLogo}
          />
        </Animated.View>

        {/* Title centered at bottom of hero */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(800)}
          style={styles.heroTitleContainer}
        >
          <ThemedText
            style={[
              styles.heroTitle,
              { textShadowColor: tintColor }
            ]}
          >
            Ankece Tracker
          </ThemedText>
        </Animated.View>

        {/* Header Icons top-right */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(800)}
          style={[styles.headerIconsContainer, { top: insets.top + 12 }]}
        >
          {user && unreadCount > 0 && (
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
              <Ionicons name="notifications" size={26} color="#fff" />
              <View style={[styles.notifBadge, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.notifBadgeText}>{unreadCount}</ThemedText>
              </View>
            </TouchableOpacity>
          )}
          <UserIconButton color="#fff" size={30} />
        </Animated.View>
      </Animated.View>

      {/* Wave spanning hero and content */}
      <Svg
        viewBox="0 0 1440 80"
        style={styles.transitionWave}
        preserveAspectRatio="none"
      >
        <Path
          d="M0,10 C360,80 1080,0 1440,60 L1440,80 L0,80 Z"
          fill={colorScheme === 'dark' ? '#151718' : '#fff'}
        />
      </Svg>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Card */}
        {/* ... existing level card ... */}

        {/* Action Grid */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="barbell" size={20} color={tintColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Entraînements</ThemedText>
        </View>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/tracker/shooting')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="basketball" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>Shooting Session</ThemedText>
            <ThemedText style={styles.cardDesc}>Enregistrez vos tirs</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/tracker/dribble')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="fitness" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>Dribble Workout</ThemedText>
            <ThemedText style={styles.cardDesc}>Maîtrisez le ballon</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/analysis')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="sparkles" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>Shoot Analyse</ThemedText>
            <ThemedText style={styles.cardDesc}>Analyse IA de tir</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Challenge Section */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="trophy" size={20} color={tintColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Social & Défis</ThemedText>
        </View>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7', borderColor: tintColor, borderWidth: 1 }]}
            onPress={() => router.push('/challenges')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="people" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>Challenges</ThemedText>
            <ThemedText style={styles.cardDesc}>Défiez la communauté</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7', borderColor: tintColor, borderWidth: 1 }]}
            onPress={() => router.push('/challenges/badges')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="medal" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>Mes Badges</ThemedText>
            <ThemedText style={styles.cardDesc}>Points & Succès</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Charts Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="basketball" size={20} color={tintColor} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Paniers Marqués</ThemedText>
            </View>
            <View style={styles.timeframeSelector}>
              {(['D', 'W', 'M', 'Y'] as const).map((tf) => (
                <TouchableOpacity
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  style={[
                    styles.tfBtn,
                    timeframe === tf && { backgroundColor: tintColor }
                  ]}
                >
                  <ThemedText style={[
                    styles.tfBtnText,
                    timeframe === tf && { color: '#fff', fontWeight: 'bold' }
                  ]}>
                    {tf}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <ProgressLineChart data={recentShooting} />
        </Animated.View>

        {/* Radar Analysis */}
        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cellular" size={20} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Analyse Profil</ThemedText>
          </View>
          <View style={styles.radarContainer}>
            <RadarChart data={radarData} size={width - 80} />
          </View>
        </Animated.View>

        {/* Badges Section */}
        <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy" size={20} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Badges</ThemedText>
          </View>
          <BadgeList unlockedIds={stats?.badges || []} />
        </Animated.View>

        {/* Global Stats Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="stats-chart" size={20} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Statistiques Globales</ThemedText>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
              <ThemedText type="title" style={styles.statValue}>{stats?.totalShotsLifetime || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Tirs Totaux</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
              <ThemedText type="title" style={styles.statValue}>
                {stats?.totalShotsLifetime ? Math.round((stats.totalMadeLifetime / stats.totalShotsLifetime) * 100) : 0}%
              </ThemedText>
              <ThemedText style={styles.statLabel}>Précision</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7', borderColor: tintColor, borderWidth: 1 }]}>
              <ThemedText type="title" style={[styles.statValue, { color: tintColor }]}>{stats?.challengePoints || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Points Défis</ThemedText>
            </View>
          </View>
        </View>

        {/* Shot Type Details */}
        {stats?.shotTypeStats && Object.keys(stats.shotTypeStats).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list" size={20} color={tintColor} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Détails par Type</ThemedText>
            </View>
            <View style={styles.detailsGrid}>
              {Object.entries(stats.shotTypeStats).map(([type, data]: [string, any]) => (
                <View 
                  key={type} 
                  style={[styles.detailCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
                >
                  <ThemedText style={styles.detailLabel}>{SHOT_TYPE_LABELS[type] || type}</ThemedText>
                  <ThemedText style={styles.detailValue}>{data.made} / {data.attempts}</ThemedText>
                  <View style={styles.detailProgressContainer}>
                    <View 
                      style={[
                        styles.detailProgress, 
                        { 
                          width: `${data.attempts > 0 ? (data.made / data.attempts) * 100 : 0}%`,
                          backgroundColor: tintColor 
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.detailPercent}>
                    {data.attempts > 0 ? Math.round((data.made / data.attempts) * 100) : 0}%
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insight Preview */}
        <View style={[styles.insightCard, { borderColor: tintColor }]}>
          <Ionicons name="bulb" size={24} color={tintColor} />
          <View style={styles.insightTextContainer}>
            <ThemedText type="defaultSemiBold">Conseil du jour</ThemedText>
            <ThemedText style={styles.insightText}>
              "{dynamicTip}"
            </ThemedText>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: "45%",
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerIconsContainer: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 16,
    textAlign: 'center',
  },
  transitionWave: {
    width: '100%',
    height: 60,
    marginTop: -30,
    marginBottom: -30,
    zIndex: 10,
  },
  heroLogoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -36,
    paddingVertical: 14,
    zIndex: 10,
  },
  heroLogoTopLeft: {
    position: 'absolute',
    left: 16,
  },
  heroLogo: {
    width: 80,
    height: 80,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
    lineHeight: 42,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollContent: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '900',
  },
  subText: {
    opacity: 0.6,
    fontSize: 16,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 18,
  },
  levelCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 20,
  },
  expText: {
    opacity: 0.6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(150,150,150,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  levelSubText: {
    fontSize: 12,
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    marginTop: 5,
  },
  gridCard: {
    width: (width - 48 - 12) / 2, // Consistent with detailsGrid
    padding: 15,
    borderRadius: 24,
    justifyContent: 'center',
    minHeight: 160,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    opacity: 0.6,
    fontSize: 12,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop:10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 12,
    padding: 2,
  },
  tfBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tfBtnText: {
    fontSize: 12,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    alignItems: 'center',
  },
  insightTextContainer: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    width: (width - 48 - 12) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  detailProgressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  detailProgress: {
    height: '100%',
    borderRadius: 2,
  },
  detailPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.8,
  }
});
