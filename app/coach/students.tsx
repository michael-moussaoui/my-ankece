import { UserIconButton as AnkeceTopProfileButton } from '@/components/UserIconButton';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachByUserId, getCoachStudents, syncExistingStudents } from '@/services/coachService';

export default function CoachStudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

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

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncExistingStudents();
      await fetchStudents();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const renderStudent = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.studentCard, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}
      onPress={() => router.push({
        pathname: '/public-profile/[id]',
        params: { id: item.playerId }
      } as any)}
    >
      <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
        <Ionicons name="person" size={24} color={tintColor} />
      </View>
      <View style={styles.studentInfo}>
        <ThemedText type="defaultSemiBold" style={styles.studentName}>{item.playerName}</ThemedText>
        <ThemedText style={styles.bookingInfo}>
          {t('coach.students.last_booking') || 'Dernière séance'} : {item.lastBookingDate?.toDate().toLocaleDateString()}
        </ThemedText>
        <ThemedText style={styles.bookingCount}>
          {item.bookingCount || 0} {t('coach.students.sessions') || 'séance(s)'}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">{t('coach.students.title') || 'Mes Élèves'}</ThemedText>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={handleSync} 
              disabled={syncing}
              style={[styles.syncButton, { backgroundColor: tintColor + '15' }]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={tintColor} />
              ) : (
                <Ionicons name="sync" size={20} color={tintColor} />
              )}
              <ThemedText style={[styles.syncText, { color: tintColor }]}>
                {t('common.sync') || 'Sync'}
              </ThemedText>
            </TouchableOpacity>
            <AnkeceTopProfileButton color={Colors[colorScheme].text} />
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="people-outline" size={64} color="#8E8E93" />
                <ThemedText style={styles.emptyText}>
                  {t('coach.students.empty') || 'Vous n\'avez pas encore d\'élèves.'}
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  listContent: {
    padding: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    marginBottom: 2,
  },
  bookingInfo: {
    fontSize: 12,
    opacity: 0.6,
  },
  bookingCount: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
