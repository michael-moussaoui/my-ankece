import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgramBuilder } from '@/components/coach/ProgramBuilder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { programService, CoachingProgram } from '@/services/programService';

export default function EditProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<CoachingProgram | null>(null);

  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#FFF' : '#111';

  useEffect(() => {
    if (id) {
      loadProgram();
    }
  }, [id]);

  const loadProgram = async () => {
    try {
      const data = await programService.getProgramById(id);
      if (data) {
        setProgram(data);
      } else {
        Alert.alert(t('common.error'), t('coach.programs.not_found', 'Programme non trouvé'));
        router.back();
      }
    } catch (error) {
      console.error('Error loading program:', error);
      Alert.alert(t('common.error'), t('common.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (programData: any) => {
    if (!id) return;
    
    setSaving(true);
    try {
      await programService.updateProgram(id, {
        ...programData,
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert(t('common.success'), t('coach.programs.form.success_msg', 'Programme mis à jour avec succès'), [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating program:', error);
      Alert.alert(t('common.error'), "Impossible de mettre à jour le programme");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            {t('coach.programs.form.edit_title', 'Modifier Programme')}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {program && (
          <ProgramBuilder 
            initialProgram={program} 
            onSave={handleUpdate} 
            loading={saving} 
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
});
