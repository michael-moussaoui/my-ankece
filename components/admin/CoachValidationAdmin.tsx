import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllCoaches, getPendingChangesForAdmin, updateCoachBadge, updateCoachStatus } from '@/services/coachService';
import { Coach } from '@/types/coach';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { CoachUpdateDiff } from './CoachUpdateDiff';
import { RejectionModal } from './RejectionModal';

export const CoachValidationAdmin = () => {
  const { t } = useTranslation();
  const router = useRouter();
   const colorScheme = useColorScheme();
   const { accentColor } = useAppTheme();
   const { user } = useAuth();
   const tintColor = accentColor || Colors[colorScheme ?? 'light'].tint;
  const [loading, setLoading] = useState(false);
  const [pendingCoaches, setPendingCoaches] = useState<Coach[]>([]);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [diffModalVisible, setDiffModalVisible] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [viewingChangesCoach, setViewingChangesCoach] = useState<Coach | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPendingCoaches = async () => {
    setLoading(true);
    try {
      const coaches = showAll ? await getAllCoaches() : await getPendingChangesForAdmin();
      setPendingCoaches(coaches);
    } catch (error) {
      console.error('Error loading pending coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingCoaches();
  }, [showAll]);

  const filteredCoaches = pendingCoaches.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = async (coachId: string, action: 'validate' | 'reject', reason?: string) => {
    if (action === 'reject' && !reason) {
      setSelectedCoachId(coachId);
      setRejectionModalVisible(true);
      return;
    }

    const title = action === 'validate' ? t('coach.admin.validate') : t('coach.admin.reject');
    const message = action === 'validate' ? t('coach.admin.confirm_validate') : t('coach.admin.confirm_reject');

    const executeAction = async () => {
        setLoading(true);
        try {
          const status: Coach['status'] = action === 'validate' ? 'active' : 'rejected';
          await updateCoachStatus(coachId, user!.uid, status, reason);
          
          setPendingCoaches(prev => {
            if (!showAll && status === 'active') {
                return prev.filter(c => c.id !== coachId);
            }
            return prev.map(c => {
                if (c.id === coachId) {
                    const updated = { ...c, status, rejectionReason: reason };
                    if (status === 'active' && c.requestedBadge) {
                        updated.badge = c.requestedBadge;
                        updated.requestedBadge = null;
                    }
                    return updated;
                }
                return c;
            });
          });
          
          setRejectionModalVisible(false);
          Alert.alert(t('common.success'), action === 'validate' ? 'Profil validé' : 'Profil refusé');
        } catch (error) {
          Alert.alert(t('common.error'), 'Action impossible');
        } finally {
          setLoading(false);
        }
    };

    if (action === 'validate') {
        Alert.alert(title, message, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: title, onPress: executeAction }
        ]);
    } else {
        executeAction();
    }
  };

  const handleBadgeAssignment = async (coachId: string, badge: Coach['badge']) => {
    try {
      setLoading(true);
      await updateCoachBadge(coachId, badge);
      setPendingCoaches(prev => prev.map(c => c.id === coachId ? { ...c, badge, requestedBadge: null } : c));
      Alert.alert(t('common.success'), 'Badge mis à jour');
    } catch (error) {
      Alert.alert(t('common.error'), 'Erreur lors de la mise à jour du badge');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Coach }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/coach/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <ThemedText type="defaultSemiBold" style={styles.name}>{item.name}</ThemedText>
          <ThemedText style={styles.subInfo}>{item.location.city}</ThemedText>
        </View>
        <View style={styles.mainActions}>
          <TouchableOpacity 
            style={[styles.miniActionButton, styles.miniRejectButton]} 
            onPress={() => handleAction(item.id, 'reject')}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.miniActionButton, { backgroundColor: tintColor }]} 
            onPress={() => handleAction(item.id, 'validate')}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <ThemedText style={styles.specialtiesText} numberOfLines={1}>
          {item.specialties.map(s => t(`coach.specialties.${s}`)).join(', ')}
        </ThemedText>
        <View style={styles.indicators}>
          {item.status === 'active' && item.pendingUpdate && (
            <TouchableOpacity 
              style={[styles.statusBadge, { backgroundColor: tintColor + '15' }]}
              onPress={() => {
                setViewingChangesCoach(item);
                setDiffModalVisible(true);
              }}
            >
              <ThemedText style={[styles.statusText, { color: tintColor }]}>
                {t('coach.admin.update_pending')} · {t('coach.admin.view_changes')}
              </ThemedText>
            </TouchableOpacity>
          )}
          {item.requestedBadge && item.requestedBadge !== item.badge && (
            <View style={styles.requestBannerSimple}>
              <Ionicons name="ribbon" size={12} color={tintColor} />
              <ThemedText style={[styles.requestText, { color: tintColor }]}>
                {t('coach.badges.request_label')} : {t(`coach.badges.${item.requestedBadge}`).toUpperCase()}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      
       <View style={styles.cardFooter}>
        <View style={styles.badgeSection}>
          <ThemedText style={styles.badgeSectionTitle}>Badges de Confiance (Manuel)</ThemedText>
          <View style={styles.badgeActions}>
            {(['pro', 'certified'] as const).map((b) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.badgeMiniButton,
                  item.badge === b && { backgroundColor: tintColor, borderColor: tintColor }
                ]}
                onPress={() => handleBadgeAssignment(item.id, item.badge === b ? null : b)}
              >
                <Ionicons 
                    name={b === 'pro' ? 'trophy' : 'checkmark-circle'} 
                    size={12} 
                    color={item.badge === b ? "#fff" : tintColor} 
                />
                <ThemedText style={[styles.badgeMiniText, item.badge === b && { color: '#fff' }]}>
                  {t(`coach.badges.${b}`)}
                </ThemedText>
              </TouchableOpacity>
            ))}
            
            {item.requestedBadge && item.requestedBadge !== item.badge && (
              <TouchableOpacity
                style={[styles.approveBadgeButton, { backgroundColor: tintColor }]}
                onPress={() => item.requestedBadge && handleBadgeAssignment(item.id, item.requestedBadge)}
              >
                <Ionicons name="checkmark-done-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
                <ThemedText style={styles.approveBadgeText}>
                  Approuver {t(`coach.badges.${item.requestedBadge}`).toUpperCase()}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.badgeSection, { marginTop: 10 }]}>
          <ThemedText style={styles.badgeSectionTitle}>Status de Performance (Auto/Manuel)</ThemedText>
          <View style={styles.badgeActions}>
            {(['top_rated', 'elite'] as const).map((b) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.badgeMiniButton,
                  item.badge === b && { backgroundColor: tintColor, borderColor: tintColor }
                ]}
                onPress={() => handleBadgeAssignment(item.id, item.badge === b ? null : b)}
              >
                <ThemedText style={[styles.badgeMiniText, item.badge === b && { color: '#fff' }]}>
                  {t(`coach.badges.${b}`)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title">{showAll ? t('coach.admin.management_title') : t('coach.admin.title')}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[styles.toggleButton, showAll && { backgroundColor: tintColor }]} 
          onPress={() => setShowAll(!showAll)}
        >
          <Ionicons name="list" size={20} color={showAll ? "#fff" : tintColor} />
          <ThemedText style={[styles.toggleText, showAll && { color: "#fff" }]}>
            {t('coach.admin.show_all')}
          </ThemedText>
        </TouchableOpacity>
        {loading && <ActivityIndicator color={tintColor} style={{ marginLeft: 10 }} />}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Rechercher par nom ou ville..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {filteredCoaches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <ThemedText style={styles.emptyText}>{t('coach.admin.pending_none')}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredCoaches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <RejectionModal 
        visible={rejectionModalVisible}
        onClose={() => {
            setRejectionModalVisible(false);
            setSelectedCoachId(null);
        }}
        onConfirm={(reason: string) => {
            if (selectedCoachId) handleAction(selectedCoachId, 'reject', reason);
        }}
        loading={loading}
      />

      <Modal
        visible={diffModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDiffModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.diffModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">{t('coach.admin.diff_title')}</ThemedText>
              <TouchableOpacity onPress={() => setDiffModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>
            
            {viewingChangesCoach && (
              <CoachUpdateDiff 
                current={viewingChangesCoach} 
                pending={viewingChangesCoach.pendingUpdate || {}} 
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: tintColor }]}
                onPress={() => setDiffModalVisible(false)}
              >
                <ThemedText style={styles.modalButtonText}>{t('common.ok')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
    gap: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  mainActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniRejectButton: {
    backgroundColor: '#FF3B30',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subInfo: {
    fontSize: 12,
    opacity: 0.6,
  },
  cardBody: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  specialtiesText: {
    fontSize: 13,
    opacity: 0.8,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    color: '#FF9500',
    fontWeight: 'bold',
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  badgeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeMiniButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
    minWidth: 60,
    alignItems: 'center',
  },
  badgeMiniText: {
    fontSize: 10,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.5,
  },
  requestBannerSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  requestText: {
    fontSize: 9,
    fontWeight: '600',
  },
  indicators: {
    alignItems: 'flex-end',
    gap: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  badgeSection: {
    marginBottom: 8,
  },
  badgeSectionTitle: {
    fontSize: 10,
    opacity: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  approveBadgeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  diffModalContent: {
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalFooter: {
    marginTop: 20,
    paddingBottom: 20,
  },
  modalButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
