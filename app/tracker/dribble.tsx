import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserIconButton } from '@/components/UserIconButton';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackerService } from '@/services/trackerService';
import { DribbleDifficulty } from '@/types/tracker';

const DIFFICULTIES: { key: DribbleDifficulty; label: string; color: string }[] = [
  { key: 'rookie', label: 'Rookie', color: '#4CAF50' },
  { key: 'pro', label: 'Pro', color: '#FF9800' },
  { key: 'elite', label: 'Elite', color: '#FF3B30' },
];

export default function DribbleSessionScreen() {
  const { user, profile } = useAuth();
  const { accentColor } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { playgroundId } = useLocalSearchParams();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = accentColor;
  
  const [comboType, setComboType] = useState('');
  const [repetitions, setRepetitions] = useState(0);
  const [difficulty, setDifficulty] = useState<DribbleDifficulty>('rookie');
  
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    if (!user) return;
    if (repetitions === 0) {
      Alert.alert("Erreur", "Veuillez entrer le nombre de répétitions.");
      return;
    }

    try {
      const sessionData: any = {
        comboType: comboType || 'Combo Libre',
        repetitions,
        duration: seconds,
        difficulty,
      };

      if (playgroundId) {
        sessionData.playgroundId = playgroundId;
      }

      await trackerService.saveDribbleSession(user.uid, profile?.displayName || 'Joueur', sessionData);
      Alert.alert("Séance terminée !", "Vos statistiques de dribble ont été mises à jour.");
      router.back();
    } catch (error) {
      console.error('Error saving dribble session:', error);
      Alert.alert("Erreur", "Impossible d'enregistrer la session.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <UserIconButton color={Colors[colorScheme].text} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.timerWrapper}>
          <View style={[styles.timerContainer, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
            <TouchableOpacity onPress={() => setIsActive(!isActive)} style={styles.playPauseButton}>
              <Ionicons name={isActive ? "pause" : "play"} size={24} color={tintColor} />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.timerText}>{formatTime(seconds)}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Type de Combo</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
            placeholder="Ex: Crossover, Between the legs..."
            placeholderTextColor="#8e8e93"
            value={comboType}
            onChangeText={setComboType}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Difficulté</ThemedText>
          <View style={styles.difficultyRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.key}
                onPress={() => {
                  setDifficulty(d.key);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.difficultyBtn,
                  difficulty === d.key && { backgroundColor: d.color, borderColor: d.color }
                ]}
              >
                <ThemedText style={[
                  styles.difficultyText,
                  difficulty === d.key && { color: '#fff', fontWeight: 'bold' }
                ]}>
                  {d.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.mainCounter}>
          <ThemedText style={styles.counterLabel}>Répétitions</ThemedText>
          <View style={styles.counterRow}>
            <TouchableOpacity 
              style={[styles.counterBtn, { backgroundColor: 'rgba(150,150,150,0.1)' }]} 
              onPress={() => {
                setRepetitions(Math.max(0, repetitions - 10));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <ThemedText style={styles.counterBtnText}>-10</ThemedText>
            </TouchableOpacity>

            <View style={styles.countWrapper}>
              <ThemedText style={styles.countText}>{repetitions}</ThemedText>
            </View>

            <TouchableOpacity 
              style={[styles.counterBtn, { backgroundColor: tintColor }]} 
              onPress={() => {
                setRepetitions(repetitions + 10);
                if (!isActive) setIsActive(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <ThemedText style={[styles.counterBtnText, { color: '#fff' }]}>+10</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.counterHint}>Utilisez les boutons ou commencez à dribbler !</ThemedText>
        </View>

        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: isActive ? '#FF3B30' : tintColor }]}
          onPress={() => setIsActive(!isActive)}
        >
          <ThemedText style={styles.startButtonText}>
            {isActive ? 'Pause' : 'Démarrer le Timer'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.finishSessionButton, { backgroundColor: tintColor }]}
          onPress={handleFinish}
        >
          <ThemedText style={styles.startButtonText}>Terminer la session</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    flex: 1,
  },
  timerWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playPauseButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  timerText: {
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  finishSessionButton: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
  },
  mainCounter: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 30,
    borderRadius: 32,
    backgroundColor: 'rgba(150,150,150,0.05)',
  },
  counterLabel: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 20,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  counterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  countWrapper: {
    minWidth: 80,
    alignItems: 'center',
  },
  countText: {
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 80,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  counterHint: {
    fontSize: 12,
    opacity: 0.4,
    marginTop: 20,
  },
  startButton: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
