import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgramBuilder } from '@/components/coach/ProgramBuilder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { programService, CoachingProgram } from '@/services/programService';
import { getCoachByUserId } from '@/services/coachService';

export default function CreateProgramScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor } = useAppTheme();
  
  const [loading, setLoading] = useState(false);

  const handleSave = async (programData: Omit<CoachingProgram, 'id' | 'coachId' | 'createdAt' | 'updatedAt' | 'salesCount'>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const coachProfile = await getCoachByUserId(user.uid);
      if (!coachProfile) {
        Alert.alert(t('common.error'), 'Profil coach non trouvé');
        return;
      }

      await programService.createProgram({
        ...programData,
        coachId: coachProfile.id,
      });

      Alert.alert(t('common.success'), t('coach.programs.save_success'), [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving program:', error);
      Alert.alert(t('common.error'), "Impossible d'enregistrer le programme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{t('coach.programs.create')}</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ProgramBuilder onSave={handleSave} loading={loading} />
      </SafeAreaView>
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
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#8882', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
});
