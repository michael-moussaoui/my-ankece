import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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
import { ActivityCard } from '@/components/tracker/ActivityCard';
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
  const [recentShooting, setRecentShooting] = useState<{ volume: number[]; accuracy: number[] }>({ volume: [], accuracy: [] });
  const [metric, setMetric] = useState<'volume' | 'accuracy'>('volume');
  const [timeframe, setTimeframe] = useState<'D' | 'W' | 'M' | 'Y'>('D');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
      const [statsData, aggregatedData, activityData] = await Promise.all([
        trackerService.getUserStats(user.uid),
        trackerService.getAggregatedStats(user.uid, timeframe),
        trackerService.getUnifiedActivity(user.uid, 50) // Fetch more for better analysis
      ]);
      
      setStats(statsData);
      setActivities(activityData);
      setRecentShooting(aggregatedData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const radarData = React.useMemo(() => {
    if (!stats) return [
      { label: 'SHOOT', value: 0 },
      { label: 'DRIBBLE', value: 0 },
      { label: 'FITNESS', value: 0 },
      { label: 'VARIETY', value: 0 },
      { label: 'IQ', value: 0 },
    ];

    // 1. SHOOT: Combine Accuracy (70%) and Experience/Volume (30%)
    const accuracy = stats.totalShotsLifetime > 0 
      ? stats.totalMadeLifetime / stats.totalShotsLifetime 
      : 0;
    const shootValue = (accuracy * 0.7) + (Math.min(stats.totalMadeLifetime / 5000, 1) * 0.3);

    // 2. DRIBBLE: Frequency of dribble sessions in the last 50 activities
    const dribbleSessions = activities.filter(a => a.activityType === 'dribble').length;
    const dribbleValue = Math.min(dribbleSessions / 10, 1); // 10 sessions = 1.0

    // 3. FITNESS: Consistency (Streak + Frequency)
    const activeDaysInBatch = new Set(activities.map(a => 
        a.date?.toDate ? a.date.toDate().toDateString() : (a.date?.seconds ? new Date(a.date.seconds * 1000).toDateString() : new Date().toDateString())
    )).size;
    const fitnessValue = (Math.min((stats.dailyStreak || 0) / 7, 1) * 0.5) + (Math.min(activeDaysInBatch / 20, 1) * 0.5);

    // 4. VARIETY: Unique shot types explored
    const varietyCount = stats.shotTypeStats ? Object.keys(stats.shotTypeStats).length : 0;
    const varietyValue = varietyCount / 7; // out of total 7 standard shot types

    // 5. IQ: Level progression / EXP milestones
    const iqValue = Math.min((stats.exp || 0) / 10000, 1);

    return [
      { label: 'SHOOT', value: Math.max(0.1, shootValue) },
      { label: 'DRIBBLE', value: Math.max(0.1, dribbleValue) },
      { label: 'FITNESS', value: Math.max(0.1, fitnessValue) },
      { label: 'VARIETY', value: Math.max(0.1, varietyValue) },
      { label: 'IQ', value: Math.max(0.1, iqValue) },
    ];
  }, [stats, activities]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <AnkeceLogo style={{ width: 60, height: 60 }} />
      </ThemedView>
    );
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
          <TouchableOpacity onPress={() => setShowHelpModal(true)} style={styles.iconButton}>
            <Ionicons name="help-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
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

        {/* Coaching Section */}
        <View style={[styles.sectionTitleRow, { marginTop: 20 }]}>
          <Ionicons name="medal" size={20} color={tintColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Coaching</ThemedText>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: tintColor + '10', borderColor: tintColor, borderWidth: 1 }]}
            onPress={() => router.push('/player/progression' as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="analytics" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>{t('analytics.title')}</ThemedText>
            <ThemedText style={styles.cardDesc}>Vos rapports & dashboard</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: tintColor + '10', borderColor: tintColor, borderWidth: 1 }]}
            onPress={() => router.push('/player/academy' as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="flash" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>{t('academy.title').toUpperCase()}</ThemedText>
            <ThemedText style={styles.cardDesc}>{t('academy.store')}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleRow}>
          <Ionicons name="barbell" size={20} color={tintColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>{t('tracker.training')}</ThemedText>
        </View>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/tracker/shooting')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="basketball" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>{t('tracker.shooting_session')}</ThemedText>
            <ThemedText style={styles.cardDesc}>{t('tracker.shooting_desc')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/tracker/dribble')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="fitness" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>{t('tracker.dribble_workout')}</ThemedText>
            <ThemedText style={styles.cardDesc}>{t('tracker.dribble_desc')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/dribble-touch')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="game-controller" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>{t('tracker.dribble_touch')}</ThemedText>
            <ThemedText style={styles.cardDesc}>{t('tracker.dribble_touch_desc')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
            onPress={() => router.push('/analysis')}
          >
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
              <Ionicons name="sparkles" size={32} color={tintColor} />
            </View>
            <ThemedText style={styles.cardTitle}>{t('tracker.shoot_analysis')}</ThemedText>
            <ThemedText style={styles.cardDesc}>{t('tracker.shoot_analysis_desc')}</ThemedText>
          </TouchableOpacity>

          {/* Decision IQ Trainer */}
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: '#1A0A2E', borderColor: '#7C3AED', borderWidth: 1.5 }]}
            onPress={() => router.push('/decision-iq' as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#7C3AED22', borderColor: '#7C3AED44' }]}>
              <Ionicons name="flash" size={32} color="#A78BFA" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: '#A78BFA' }]}>Decision IQ</ThemedText>
            <ThemedText style={styles.cardDesc}>Lecture du jeu & mental</ThemedText>
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
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {metric === 'volume' ? 'Paniers Marqués' : 'Précision de Tir'}
              </ThemedText>
            </View>
            <View style={styles.metricToggle}>
              <TouchableOpacity
                onPress={() => setMetric('volume')}
                style={[styles.metricBtn, metric === 'volume' && { backgroundColor: tintColor }]}
              >
                <ThemedText style={[styles.metricBtnText, metric === 'volume' && { color: '#fff' }]}>#</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMetric('accuracy')}
                style={[styles.metricBtn, metric === 'accuracy' && { backgroundColor: tintColor }]}
              >
                <ThemedText style={[styles.metricBtnText, metric === 'accuracy' && { color: '#fff' }]}>%</ThemedText>
              </TouchableOpacity>
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
          {recentShooting[metric].length >= 2 ? (
            <ProgressLineChart 
              data={recentShooting[metric]} 
              max={metric === 'accuracy' ? 100 : undefined} 
              unit={metric === 'accuracy' ? '%' : ''}
            />
          ) : (
            <View style={[styles.emptyChart, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
               <Ionicons name="stats-chart" size={32} color={tintColor + '40'} />
               <ThemedText style={styles.emptyChartText}>Enregistrez au moins 2 sessions pour voir votre graphique de progression.</ThemedText>
            </View>
          )}
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

        {/* Unified Activity Summary */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time" size={20} color={tintColor} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Dernières Activités</ThemedText>
            </View>
            {activities.slice(0, 5).map((activity) => (
              <ActivityCard 
                key={activity.id} 
                activity={activity} 
                onPress={() => router.push('/analysis')}
              />
            ))}
          </View>
        )}

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

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">Ankece Tracker 🏀</ThemedText>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close-circle" size={32} color={tintColor} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.helpSection}>
                <View style={[styles.helpIconBg, { backgroundColor: tintColor + '15' }]}>
                  <Ionicons name="basketball" size={24} color={tintColor} />
                </View>
                <View style={styles.helpTextContainer}>
                  <ThemedText type="defaultSemiBold">Sessions de Tir</ThemedText>
                  <Text style={[styles.helpDesc, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                    Enregistrez manuellement vos paniers réussis et ratés. Le tracker calcule votre précision et vos points d'expérience.
                  </Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <View style={[styles.helpIconBg, { backgroundColor: '#AF52DE15' }]}>
                  <Ionicons name="sparkles" size={24} color="#AF52DE" />
                </View>
                <View style={styles.helpTextContainer}>
                  <ThemedText type="defaultSemiBold">AI Hub (IA)</ThemedText>
                  <Text style={[styles.helpDesc, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                    L'IA analyse votre posture de tir ou compte vos paniers automatiquement via la caméra. Un coach virtuel dans votre poche.
                  </Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <View style={[styles.helpIconBg, { backgroundColor: '#FF2D5515' }]}>
                  <Ionicons name="stats-chart" size={24} color="#FF2D55" />
                </View>
                <View style={styles.helpTextContainer}>
                  <ThemedText type="defaultSemiBold">Graphiques de Progression</ThemedText>
                  <Text style={[styles.helpDesc, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                    Basculez entre le Volume (#) pour voir la quantité, et la Précision (%) pour voir votre efficacité au fil du temps.
                  </Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <View style={[styles.helpIconBg, { backgroundColor: '#32D74B15' }]}>
                  <Ionicons name="cellular" size={24} color="#32D74B" />
                </View>
                <View style={styles.helpTextContainer}>
                  <ThemedText type="defaultSemiBold">Analyse Profil (Radar)</ThemedText>
                  <Text style={[styles.helpDesc, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                    Votre ADN de basket sur 5 axes : Tir, Dribble, Fitness, Variété et IQ. Atteignez l'équilibre parfait pour devenir une légende.
                  </Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <View style={[styles.helpIconBg, { backgroundColor: '#5AC8FA15' }]}>
                  <Ionicons name="trophy" size={24} color="#5AC8FA" />
                </View>
                <View style={styles.helpTextContainer}>
                  <ThemedText type="defaultSemiBold">Niveaux & Badges</ThemedText>
                  <Text style={[styles.helpDesc, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                    Gagnez de l'EXP à chaque tir. Débloquez des badges exclusifs et grimpez les échelons : Rookie, Sniper, Legend.
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.closeBtn, { backgroundColor: tintColor }]}
                onPress={() => setShowHelpModal(false)}
              >
                <Text style={styles.closeBtnText}>J'AI COMPRIS !</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    alignSelf: 'center',
    marginTop: 8,
  },
  metricToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 10,
    padding: 2,
    marginRight: 8,
  },
  metricBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalScroll: {
    gap: 20,
  },
  helpSection: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  helpIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTextContainer: {
    flex: 1,
  },
  helpDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    marginTop: 10,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  detailPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  emptyChart: {
    height: 150,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(150,150,150,0.2)',
  },
  emptyChartText: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 8,
  },
  activityList: {
    gap: 0,
  }
});
