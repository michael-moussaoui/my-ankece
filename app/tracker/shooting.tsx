import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StyleSheet,
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
import { ShotDetail, ShotType } from '@/types/tracker';

const SHOT_TYPES: { key: ShotType; label: string }[] = [
  { key: '3pt', label: '3 Points' },
  { key: 'ft', label: 'Lancer Franc' },
  { key: 'mid', label: 'Mid-Range' },
  { key: 'catch_shoot', label: 'Catch & Shoot' },
  { key: 'pull_up', label: 'Pull-up' },
  { key: 'step_back', label: 'Step-back' },
  { key: 'fadeaway', label: 'Fadeaway' },
];

export default function ShootingSessionScreen() {
  const { user, profile } = useAuth();
  const { accentColor } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { playgroundId } = useLocalSearchParams();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = accentColor;
  
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const [shots, setShots] = useState<Record<ShotType, { attempts: number; made: number }>>({
    '3pt': { attempts: 0, made: 0 },
    'ft': { attempts: 0, made: 0 },
    'mid': { attempts: 0, made: 0 },
    'catch_shoot': { attempts: 0, made: 0 },
    'pull_up': { attempts: 0, made: 0 },
    'step_back': { attempts: 0, made: 0 },
    'fadeaway': { attempts: 0, made: 0 },
  });

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

  const activeShot = SHOT_TYPES[activeShotIndex];
  const currentData = shots[activeShot.key];

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = async (isMade: boolean) => {
    if (!isActive) {
      Alert.alert("Session en pause", "Veuillez démarrer le chrono pour enregistrer vos tirs.");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShots(prev => ({
      ...prev,
      [activeShot.key]: {
        attempts: prev[activeShot.key].attempts + 1,
        made: prev[activeShot.key].made + (isMade ? 1 : 0),
      }
    }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsActive(false);

    const totalShots = Object.values(shots).reduce((acc, s) => acc + s.attempts, 0);
    const totalMade = Object.values(shots).reduce((acc, s) => acc + s.made, 0);

    if (totalShots === 0) {
      router.back();
      return;
    }

    const shotsArray: ShotDetail[] = SHOT_TYPES.map(st => ({
      shotType: st.key,
      attempts: shots[st.key].attempts,
      made: shots[st.key].made,
    })).filter(s => s.attempts > 0);

    try {
      const sessionData: any = {
        type: 'training',
        duration: seconds,
        totalShots,
        totalMade,
        shots: shotsArray,
      };
      
      if (playgroundId) {
        sessionData.playgroundId = playgroundId;
      }

      await trackerService.saveShootingSession(user.uid, profile?.displayName || 'Joueur', sessionData);
      Alert.alert("Session terminée !", `Bravo ! Vous avez réussi ${totalMade}/${totalShots} tirs.`);
      router.back();
    } catch (error) {
      console.error('Error saving shooting session:', error);
      Alert.alert("Erreur", "Impossible d'enregistrer la session. Vérifiez votre connexion.");
      setIsActive(true);
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

      <View style={styles.shotTypeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {SHOT_TYPES.map((st, index) => (
            <TouchableOpacity 
              key={st.key}
              onPress={() => {
                setActiveShotIndex(index);
                Haptics.selectionAsync();
              }}
              style={[
                styles.typeTag, 
                activeShotIndex === index && { backgroundColor: tintColor }
              ]}
            >
              <ThemedText style={[
                styles.typeTagText,
                activeShotIndex === index && { color: '#fff', fontWeight: 'bold' }
              ]}>
                {st.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timerWrapper}>
        <View style={styles.timerContainer}>
          <TouchableOpacity onPress={() => setIsActive(!isActive)} style={styles.playPauseButton}>
            <Ionicons name={isActive ? "pause" : "play"} size={24} color={tintColor} />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold" style={styles.timerText}>{formatTime(seconds)}</ThemedText>
        </View>
      </View>

      <View style={styles.mainTracker}>
        <View style={styles.activeShotInfo}>
          <ThemedText type="title" style={styles.activeShotLabel}>{activeShot.label}</ThemedText>
          <View style={styles.scoreRow}>
            <ThemedText style={styles.scoreBig}>{currentData.made}</ThemedText>
            <ThemedText style={styles.scoreSeparator}>/</ThemedText>
            <ThemedText style={styles.scoreBig}>{currentData.attempts}</ThemedText>
          </View>
          <ThemedText style={styles.percentText}>
            {currentData.attempts > 0 ? Math.round((currentData.made / currentData.attempts) * 100) : 0}%
          </ThemedText>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.missButton]} 
            onPress={() => handlePress(false)}
          >
            <Ionicons name="close" size={40} color="#fff" />
            <ThemedText style={styles.buttonLabel}>MISSED</ThemedText>
            <ThemedText style={styles.buttonCounter}>{currentData.attempts - currentData.made}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.madeButton, { backgroundColor: tintColor }]} 
            onPress={() => handlePress(true)}
          >
            <Ionicons name="checkmark" size={40} color="#fff" />
            <ThemedText style={styles.buttonLabel}>MADE</ThemedText>
            <ThemedText style={styles.buttonCounter}>{currentData.made}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bottomStats, { paddingBottom: insets.bottom + 20 }]}>
        <ThemedText style={styles.totalText}>Total: {Object.values(shots).reduce((acc, s) => acc + s.made, 0)} / {Object.values(shots).reduce((acc, s) => acc + s.attempts, 0)}</ThemedText>
        
        <TouchableOpacity 
          onPress={handleFinish} 
          style={[styles.bottomFinishButton, { backgroundColor: tintColor }]}
        >
          <ThemedText style={styles.finishButtonText}>Terminer la session</ThemedText>
        </TouchableOpacity>
      </View>
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
    marginBottom: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(150,150,150,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 16,
  },
  bottomFinishButton: {
    marginTop: 20,
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shotTypeSelector: {
    height: 50,
    marginBottom: 20,
  },
  selectorScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  typeTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
  },
  typeTagText: {
    fontSize: 14,
    opacity: 0.8,
  },
  mainTracker: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeShotInfo: {
    alignItems: 'center',
    marginBottom: 60,
  },
  activeShotLabel: {
    fontSize: 32,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  scoreBig: {
    fontSize: 80,
    fontWeight: '700',
    lineHeight: 85,
    fontVariant: ['tabular-nums'],
  },
  scoreSeparator: {
    fontSize: 40,
    opacity: 0.3,
    marginBottom: 10,
  },
  percentText: {
    fontSize: 24,
    opacity: 0.5,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    height: 200,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  missButton: {
    backgroundColor: '#FF3B30',
  },
  madeButton: {
    // backgroundColor handled dynamically
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  buttonCounter: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 60,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  bottomStats: {
    padding: 24,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    opacity: 0.6,
    fontWeight: '700',
  }
});
