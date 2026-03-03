import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { challengeService } from '@/services/challengeService';
import { Challenge, ChallengeParticipation } from '@/types/challenge';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor, accentTextColor } = useAppTheme();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // We could add a getChallengeById in service, for now we list and filter or just use getChallenges
      const allChallenges = await challengeService.getChallenges();
      const found = allChallenges.find(c => c.id === id);
      if (found) {
        setChallenge(found);
        const history = await challengeService.getChallengeParticipations(id as string);
        setParticipations(history);
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async (isSuccess: boolean) => {
    if (!user || !challenge || processing) return;

    Alert.alert(
      isSuccess ? "Challenge réussi !" : "Challenge non réussi",
      `Est-tu sûr de vouloir enregistrer ce résultat ? Tu gagneras ${isSuccess ? challenge.pointsSuccess : challenge.pointsFailure} points.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              setProcessing(true);
              await challengeService.participateInChallenge(
                challenge.id,
                user.uid,
                profile?.displayName || 'Joueur',
                isSuccess
              );
              Alert.alert("Bravo !", "Ton résultat a été enregistré.");
              loadData(); // Refresh to see participation
            } catch (error) {
              console.error('Error participating:', error);
              Alert.alert("Erreur", "Impossible d'enregistrer le résultat.");
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </ThemedView>
    );
  }

  if (!challenge) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ThemedText>Challenge introuvable.</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={{ color: accentColor }}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Header avec accent color */}
        <View style={[styles.hero, { backgroundColor: accentColor, paddingTop: insets.top + 60 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.headerBack, { top: Math.max(insets.top, 10) }]}
          >
            <Ionicons name="chevron-back" size={28} color={accentTextColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.heroTitle, { color: accentTextColor }]} numberOfLines={2} adjustsFontSizeToFit>{challenge.title}</ThemedText>
          <ThemedText style={[styles.heroCreator, { color: accentTextColor === '#ffffff' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' }]}>Par {challenge.creatorName}</ThemedText>
          
          <View style={[styles.pointsGrid, { backgroundColor: accentTextColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={styles.pointItem}>
              <ThemedText style={[styles.pointLabel, { color: accentTextColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>Succès</ThemedText>
              <ThemedText style={[styles.pointValue, { color: accentTextColor }]}>+{challenge.pointsSuccess}</ThemedText>
            </View>
            <View style={styles.pointItem}>
              <ThemedText style={[styles.pointLabel, { color: accentTextColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>Échec</ThemedText>
              <ThemedText style={[styles.pointValue, { color: accentTextColor }]}>+{challenge.pointsFailure}</ThemedText>
            </View>
            <View style={styles.pointItem}>
              <ThemedText style={[styles.pointLabel, { color: accentTextColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>Participants</ThemedText>
              <ThemedText style={[styles.pointValue, { color: accentTextColor }]}>{challenge.participantsCount}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.sectionText}>{challenge.description}</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Objectif</ThemedText>
            <View style={[styles.objectiveCard, { backgroundColor: accentColor + '10', borderColor: accentColor }]}>
              <Ionicons name="flash" size={20} color={accentColor} />
              <ThemedText style={[styles.objectiveText, { color: accentColor }]}>{challenge.objective}</ThemedText>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <ThemedText type="defaultSemiBold" style={styles.actionPrompt}>As-tu relevé le défi ?</ThemedText>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.successBtn, { borderColor: accentColor }]}
                onPress={() => handleParticipate(true)}
                disabled={processing}
              >
                <Ionicons name="checkmark-circle" size={32} color={accentColor} />
                <ThemedText style={[styles.actionBtnText, { color: accentColor }]}>RÉUSSI</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.failureBtn]}
                onPress={() => handleParticipate(false)}
                disabled={processing}
              >
                <Ionicons name="close-circle" size={32} color="#FF3B30" />
                <ThemedText style={[styles.actionBtnText, { color: '#FF3B30' }]}>ÉCHOUÉ</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Historique des participations</ThemedText>
            {participations.length > 0 ? (
              participations.map((p) => (
                <View key={p.id} style={[styles.participationRow, { borderBottomColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA' }]}>
                  <ThemedText style={styles.participantName}>{p.participantName}</ThemedText>
                  <View style={styles.participationResult}>
                    <Ionicons 
                      name={p.isSuccess ? "checkmark-circle" : "close-circle"} 
                      size={18} 
                      color={p.isSuccess ? accentColor : "#FF3B30"} 
                    />
                    <ThemedText style={[styles.pointsEarned, { color: p.isSuccess ? accentColor : "#FF3B30" }]}>
                      +{p.pointsEarned} pts
                    </ThemedText>
                  </View>
                </View>
              ))
            ) : (
              <ThemedText style={styles.emptyHistory}>Sois le premier à participer !</ThemedText>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  headerBack: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 34,
  },
  heroCreator: {
    fontSize: 14,
    marginBottom: 24,
  },
  pointsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 20,
  },
  pointItem: {
    alignItems: 'center',
  },
  pointLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pointValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    gap: 32,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  objectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  objectiveText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    paddingVertical: 4,
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
    gap: 20,
  },
  actionPrompt: {
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  successBtn: {
    // border color via style
  },
  failureBtn: {
    borderColor: '#FF3B30',
  },
  actionBtnText: {
    fontWeight: '900',
    marginTop: 8,
    fontSize: 12,
  },
  participationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  participantName: {
    fontSize: 16,
  },
  participationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsEarned: {
    fontWeight: 'bold',
  },
  emptyHistory: {
    opacity: 0.5,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  backBtn: {
    marginTop: 20,
  }
});
