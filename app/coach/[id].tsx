import { UserIconButton as AnkeceTopProfileButton } from '@/components/UserIconButton';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RejectionModal } from '@/components/admin/RejectionModal';
import { CoachAgenda } from '@/components/coach/CoachAgenda';
import { ContactModal } from '@/components/coach/ContactModal';
import { ReviewModal } from '@/components/coach/ReviewModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachById, updateCoachBadge, updateCoachStatus } from '@/services/coachService';
import { notificationService } from '@/services/notificationService';
import { addReview } from '@/services/reviewService';
import { Coach } from '@/types/coach';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 350;

export default function CoachProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const scrollY = useSharedValue(0);
  const { user, profile } = useAuth();
  
  const activeBadge = coach?.badge || 
    (coach?.requestedBadge ? coach.requestedBadge : 
    ((coach?.studentCount || 0) > 5 ? 'elite' as const : 
    ((coach?.rating || 0) >= 4 ? 'top_rated' as const : null)));

  const isPending = !coach?.badge && !!coach?.requestedBadge;

  const handleAction = async (action: 'active' | 'rejected', reason?: string) => {
    if (!coach) return;
    
    setActionLoading(true);
    try {
      await updateCoachStatus(coach.id, user!.uid, action, reason);
      
      setCoach(prev => {
          if (!prev) return null;
          const updated = { ...prev, status: action, rejectionReason: reason };
          if (action === 'active' && prev.requestedBadge) {
              updated.badge = prev.requestedBadge;
              updated.requestedBadge = null;
          }
          return updated;
      });
      
      setRejectionModalVisible(false);
      Alert.alert(t('common.success'), action === 'active' ? t('coach.admin.status_updated') : t('coach.admin.status_updated'));
      if (action === 'rejected') router.back();
    } catch (error) {
      Alert.alert(t('common.error'), t('coach.admin.status_error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBadgeAssignment = async (badge: Coach['badge']) => {
    if (!coach) return;
    try {
      setActionLoading(true);
      await updateCoachBadge(coach.id, badge);
      setCoach(prev => prev ? { ...prev, badge, requestedBadge: null } : null);
      Alert.alert(t('common.success'), 'Badge mis à jour');
    } catch (error) {
      Alert.alert(t('common.error'), 'Erreur lors de la mise à jour du badge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContact = async (message: string) => {
    if (!coach || !user) return;
    
    await notificationService.sendToUser(
      coach.userId,
      user.uid,
      t('coach.contact.reservation_request', { name: profile?.displayName || t('common.a_student') }),
      message,
      'info'
    );
  };

  const handleReview = async (rating: number, comment: string) => {
    if (!coach || !user) return;
    
    await addReview({
      coachId: coach.id,
      userId: user.uid,
      userName: profile?.displayName || 'Anonyme',
      userPhoto: profile?.avatarUrl,
      rating,
      comment,
      createdAt: Date.now(),
    });
    
    // Refresh coach data to show new rating
    const updatedCoach = await getCoachById(coach.id);
    if (updatedCoach) setCoach(updatedCoach);
  };

  useEffect(() => {
    const fetchCoach = async () => {
      if (typeof id === 'string') {
        let data = await getCoachById(id);
        if (data && isAdmin && data.pendingUpdate) {
            // Admin sees the pending changes to validate them
            data = { ...data, ...data.pendingUpdate };
        }
        setCoach(data);
      }
      setLoading(false);
    };
    fetchCoach();
  }, [id, isAdmin]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: HEADER_HEIGHT,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [HEADER_HEIGHT / 2, 0, -HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (!coach) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>{t('coach.profile.not_found')}</ThemedText>
        <TouchableOpacity style={styles.backButtonInline} onPress={() => router.back()}>
          <ThemedText style={{ color: tintColor }}>{t('common.back')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderStat = (label: string, value: string | number, icon: any) => (
    <View style={styles.statBox}>
      <View style={[styles.statIconContainer, { backgroundColor: tintColor + '15' }]}>
        <Ionicons name={icon} size={20} color={tintColor} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View style={[styles.header, headerStyle]}>
        <Image source={coach.photoUrl} style={styles.headerImage} contentFit="cover" />
        <View style={styles.overlay} />
      </Animated.View>

      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Top Controls (User Icon + Edit for Owner) */}
      <View style={[styles.topControls, { top: insets.top + 10 }]}>
        {user?.uid === coach.userId && (
          <>
            <TouchableOpacity 
              style={[styles.headerIconButton, { marginRight: 8 }]}
              onPress={() => router.push('/coach/students')}
            >
              <Ionicons name="people-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerIconButton, { marginRight: 8 }]}
              onPress={() => router.push({ pathname: '/coach/create', params: { id: coach.id } } as any)}
            >
              <Ionicons name="create-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </>
        )}
        <View style={styles.headerIconButton}>
          <AnkeceTopProfileButton color="#FFF" size={24} />
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoContainer, { backgroundColor: Colors[colorScheme].background }]}>
          <View style={styles.mainHeader}>
            <View>
              <ThemedText type="title" style={styles.name}>{coach.name}</ThemedText>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={tintColor} />
                <ThemedText style={styles.locationText}>{coach.location.city}</ThemedText>
              </View>
              <View style={[styles.locationContainer, { marginTop: 4 }]}>
                <Ionicons name="pricetag" size={16} color={tintColor} />
                <ThemedText style={[styles.locationText, { color: tintColor, fontWeight: '700' }]}>
                  {coach.isFree ? t('coach.profile.free') : `${coach.priceRange.min}${coach.priceRange.currency} - ${coach.priceRange.max}${coach.priceRange.currency} / h`}
                </ThemedText>
              </View>
            </View>
            {activeBadge && (
              <View style={[
                  styles.badgeContainer, 
                  { backgroundColor: isPending ? 'rgba(150,150,150,0.8)' : tintColor }
              ]}>
                <ThemedText style={styles.badgeText}>
                    {t(`coach.badges.${activeBadge}`).toUpperCase()}
                    {isPending && ` (${t('common.loading').toUpperCase()})`}
                </ThemedText>
              </View>
            )}
          </View>

          {(isAdmin || user?.uid === coach.userId) && coach.requestedBadge && (
            <View style={[styles.section, styles.requestedBadgeSection]}>
              <Ionicons name="alert-circle" size={20} color={tintColor} />
              <ThemedText style={styles.requestedBadgeText}>
                {t('coach.form.request_badge')} : <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>{t(`coach.badges.${coach.requestedBadge}`)}</ThemedText>
              </ThemedText>
            </View>
          )}

          <View style={styles.statsRow}>
            {renderStat(t('coach.profile.rating'), coach.rating || 0, 'star')}
            {renderStat(t('coach.profile.students'), coach.studentCount || 0, 'people')}
            {renderStat(t('coach.profile.experience'), `${coach.experienceYears || 0} ans`, 'briefcase')}
          </View>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.profile.about')}</ThemedText>
            <ThemedText style={styles.description}>{coach.description}</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.profile.specialties')}</ThemedText>
            <View style={styles.chipGrid}>
              {coach.specialties.map(spec => (
                <View key={spec} style={[styles.chip, { backgroundColor: tintColor + '15' }]}>
                  <ThemedText style={[styles.chipText, { color: tintColor }]}>{t(`coach.specialties.${spec}`)}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {coach.philosophy && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.profile.philosophy')}</ThemedText>
              <View style={[styles.quoteContainer, { borderLeftColor: tintColor }]}>
                <ThemedText style={styles.philosophy}>"{coach.philosophy}"</ThemedText>
              </View>
            </View>
          )}

          {coach.qualifications && coach.qualifications.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.profile.qualifications')}</ThemedText>
              {coach.qualifications.map((q, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={20} color={tintColor} />
                  <ThemedText style={styles.listItemText}>{q}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {coach.pastClubs && coach.pastClubs.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.profile.past_clubs')}</ThemedText>
              <View style={styles.chipGrid}>
                {coach.pastClubs.map(club => (
                  <View key={club} style={[styles.clubChip, { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA' }]}>
                    <ThemedText style={styles.clubText}>{club}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {coach.status === 'active' && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {t('coach.profile.book_session') || 'Réserver une séance'}
              </ThemedText>
              <CoachAgenda coachId={coach.id} />
            </View>
          )}

          {coach.status === 'rejected' && coach.rejectionReason && (
            <View style={[styles.section, styles.rejectedSection]}>
              <ThemedText type="defaultSemiBold" style={{ color: '#FF3B30', marginBottom: 8 }}>{t('coach.admin.rejection_reason')}</ThemedText>
              <ThemedText style={styles.rejectedReason}>{coach.rejectionReason}</ThemedText>
            </View>
          )}

          {coach.status === 'active' && coach.pendingUpdate && user?.uid === coach.userId && (
            <View style={[styles.section, styles.updatePendingSection]}>
              <Ionicons name="time-outline" size={20} color="#FF9500" />
              <ThemedText style={styles.updatePendingText}>{t('coach.profile.update_pending_banner')}</ThemedText>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Fixed Bottom Actions - Only for Active Coaches & Not the coach themselves */}
      {coach.status === 'active' && user?.uid !== coach.userId && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <TouchableOpacity 
            style={[styles.evalButton, { borderColor: tintColor }]}
            onPress={() => setReviewModalVisible(true)}
          >
            <ThemedText style={{ color: tintColor, fontWeight: '700' }}>{t('coach.profile.rate')}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: tintColor }]}
            onPress={() => setContactModalVisible(true)}
          >
            <ThemedText style={styles.bookButtonText}>{t('coach.profile.book')}</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin Review Banner if New Profile or Pending Update */}
      {(coach.status === 'pending' || (isAdmin && coach.pendingUpdate)) && (
        <View style={[styles.reviewBanner, { paddingBottom: insets.bottom + 10, backgroundColor: '#FF9500' }]}>
          <Ionicons name="information-circle" size={24} color="#FFF" />
          <ThemedText style={styles.reviewBannerText}>
            {coach.status === 'pending' ? t('coach.profile.pending_banner') : "Examen d'une mise à jour"}
          </ThemedText>
        </View>
      )}

      <RejectionModal 
        visible={rejectionModalVisible}
        onClose={() => setRejectionModalVisible(false)}
        onConfirm={(reason) => handleAction('rejected', reason)}
        loading={actionLoading}
      />

      <ContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        onSend={handleContact}
        coachName={coach.name}
      />

      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleReview}
        coachName={coach.name}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: width,
    zIndex: 0,
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInline: {
    marginTop: 20,
    padding: 10,
  },
  headerIconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT - 30,
  },
  infoContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
    minHeight: height,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quoteContainer: {
    paddingLeft: 16,
    borderLeftWidth: 4,
    marginTop: 8,
  },
  philosophy: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    opacity: 0.9,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  listItemText: {
    fontSize: 15,
    flex: 1,
  },
  clubChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clubText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CCC5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  evalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  bookButton: {
    flex: 2,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectedSection: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  rejectedReason: {
    fontSize: 15,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  updatePendingSection: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  updatePendingText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
    flex: 1,
  },
  reviewBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  reviewBannerText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  adminBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
    gap: 6,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  requestedBadgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  requestedBadgeText: {
    fontSize: 14,
    opacity: 0.8,
  },
  adminBadgeSection: {
    marginBottom: 8,
  },
  badgeSectionSubTitle: {
    fontSize: 10,
    opacity: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  approveBadgeAction: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBadgeActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
