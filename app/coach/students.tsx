import { UserIconButton as AnkeceTopProfileButton } from '@/components/UserIconButton';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput,
  Dimensions,
  Platform,
  Share,
  Modal,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  Layout,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachByUserId, getCoachStudents, syncExistingStudents } from '@/services/coachService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CoachStudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const tintColor = accentColor;
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBorder = isDark ? '#2A2A2A' : '#E5E7EB';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#888888' : '#666666';

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchStudents = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const coachProfile = await getCoachByUserId(user.uid);
      if (coachProfile) {
        setCoachId(coachProfile.id);
        const data = await getCoachStudents(coachProfile.id);
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => 
      s.playerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const handleShare = async () => {
    if (!coachId) return;
    try {
      const inviteLink = `ankece://coach/${coachId}`;
      await Share.share({
        message: `${t('coach.students.invite_description')}\n\nCode invitation : ${coachId.substring(0, 8).toUpperCase()}\nLien : ${inviteLink}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderStudent = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInRight.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity 
        style={[styles.studentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={() => router.push({
          pathname: '/coach/student/[id]',
          params: { id: item.playerId }
        } as any)}
      >
        <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '15' }]}>
          <Ionicons name="person" size={24} color={tintColor} />
          {item.bookingCount > 5 && (
            <View style={[styles.activeIndicator, { backgroundColor: '#22C55E' }]} />
          )}
        </View>
        
        <View style={styles.studentInfo}>
          <ThemedText style={styles.studentName}>{item.playerName}</ThemedText>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={textSecondary} />
            <Text style={[styles.metaText, { color: textSecondary }]}>
              {t('coach.students.last_booking')} : {item.lastBookingDate?.toDate().toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.sessionBadge, { backgroundColor: tintColor + '10' }]}>
              <Text style={[styles.sessionBadgeText, { color: tintColor }]}>
                {item.bookingCount || 0} {t('coach.students.sessions')}
              </Text>
            </View>
            {item.lastNote && (
              <View style={[styles.noteBadge, { backgroundColor: '#8882' }]}>
                <Ionicons name="document-text-outline" size={10} color={textSecondary} />
                <Text style={{ fontSize: 10, color: textSecondary, marginLeft: 4 }}>Note</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.chevronBox}>
          <Ionicons name="chevron-forward" size={20} color={textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={textPrimary} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>{t('coach.students.title')}</ThemedText>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => setShowInviteModal(true)} 
              style={[styles.actionBtn, { backgroundColor: tintColor }]}
            >
              <Ionicons name="person-add" size={20} color="#FFF" />
            </TouchableOpacity>
            <AnkeceTopProfileButton color={textPrimary} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="search" size={20} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder={t('coach.students.search_placeholder')}
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Animated.View entering={FadeIn.delay(200)} style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: cardBg }]}>
                  <Ionicons name="people-outline" size={60} color={isDark ? '#222' : '#EEE'} />
                </View>
                <ThemedText style={styles.emptyText}>{t('coach.students.empty')}</ThemedText>
                <TouchableOpacity 
                  style={[styles.inviteBtn, { backgroundColor: tintColor + '15' }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <Text style={{ color: tintColor, fontWeight: '700' }}>{t('coach.students.add_student')}</Text>
                </TouchableOpacity>
              </Animated.View>
            }
          />
        )}
      </SafeAreaView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('coach.students.add_student')}</ThemedText>
              <TouchableOpacity onPress={() => setShowInviteModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inviteCard}>
                <Ionicons name="share-social-outline" size={48} color={tintColor} style={{ alignSelf: 'center', marginBottom: 16 }} />
                <ThemedText style={styles.inviteTitle}>{t('coach.students.invite_code')}</ThemedText>
                <View style={[styles.codeBox, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
                  <Text style={[styles.codeText, { color: tintColor }]}>
                    {coachId?.substring(0, 8).toUpperCase() || 'ANKECEXX'}
                  </Text>
                </View>
                <Text style={[styles.inviteDesc, { color: textSecondary }]}>
                  {t('coach.students.invite_description')}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.shareBtn, { backgroundColor: tintColor }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color="#FFF" />
                  <Text style={styles.shareBtnText}>Partager le code</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  actionBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 16, fontWeight: '600' },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111',
  },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 17, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sessionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sessionBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  noteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chevronBox: { paddingLeft: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888', textAlign: 'center', marginBottom: 24 },
  inviteBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8882', justifyContent: 'center', alignItems: 'center' },
  
  inviteCard: { alignItems: 'center' },
  inviteTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  codeBox: { paddingHorizontal: 30, paddingVertical: 20, borderRadius: 20, marginBottom: 20 },
  codeText: { fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  inviteDesc: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 32, paddingHorizontal: 20 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20 },
  shareBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
});
