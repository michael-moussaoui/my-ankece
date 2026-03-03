import { UserIconButton } from '@/components/UserIconButton';
import { AnalysisLoadingOverlay } from '@/components/analysis/AnalysisLoadingOverlay';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { expertAiService, ExpertAnalysisResponse, ExpertDribbleResponse, ExpertSessionResponse } from '@/services/ai/expertAiService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DribbleAnalysisReport } from '../../components/analysis/DribbleAnalysisReport';
import { ExpertAnalysisReport } from '../../components/analysis/ExpertAnalysisReport';
import { SessionAnalysisReport } from '../../components/analysis/SessionAnalysisReport';

export default function AnalysisScreen() {
  const router = useRouter();
  const { updateProfile } = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'shot' | 'session' | 'dribble'>('shot');
  
  const [expertReport, setExpertReport] = useState<ExpertAnalysisResponse | null>(null);
  const [showExpertReport, setShowExpertReport] = useState(false);
  
  const [dribbleReport, setDribbleReport] = useState<ExpertDribbleResponse | null>(null);
  const [showDribbleReport, setShowDribbleReport] = useState(false);

  const [sessionReport, setSessionReport] = useState<ExpertSessionResponse | null>(null);
  const [showSessionReport, setShowSessionReport] = useState(false);

  const [status, requestPermission] = ImagePicker.useCameraPermissions();
  const [libraryStatus, requestLibraryPermission] = ImagePicker.useMediaLibraryPermissions();

  const handlePickVideo = async (type: 'shot' | 'session' | 'dribble') => {
    try {
      if (!libraryStatus?.granted) {
        const permission = await requestLibraryPermission();
        if (!permission.granted) {
          Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour choisir une vidéo.");
          return;
        }
      }

      setAnalysisType(type);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        startExpertAnalysis(result.assets[0].uri, type);
      }
    } catch (error: any) {
      console.error("Erreur sélection vidéo:", error);
      
      // Handle the specific iCloud 3164 error
      if (error?.message?.includes('3164') || error?.toString().includes('3164')) {
        Alert.alert(
          "Vidéo iCloud",
          "Cette vidéo est stockée sur iCloud. Merci de la télécharger sur votre appareil avant de l'analyser.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Erreur", "Impossible d'accéder à la galerie.");
      }
    }
  };

  const handleCamera = async (type: 'shot' | 'session' | 'dribble') => {
    if (!status?.granted) {
      const permission = await requestPermission();
      if (!permission.granted) return;
    }
    
    if (type === 'session') {
        router.push('/camera-analysis?mode=shooting');
        return;
    }
    if (type === 'shot') {
        router.push('/camera-analysis?mode=posture');
        return;
    }
    if (type === 'dribble') {
        router.push('/camera-analysis?mode=dribble');
        return;
    }

    try {
        setAnalysisType(type);
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            startExpertAnalysis(result.assets[0].uri, type);
        }
    } catch (error) {
        console.error("Erreur caméra:", error);
        Alert.alert("Erreur", "Impossible d'utiliser la caméra.");
    }
  };

  const startExpertAnalysis = async (uri: string, type: 'shot' | 'session' | 'dribble') => {
    try {
      setIsAnalyzing(true);
      if (type === 'shot') {
        const result = await expertAiService.analyzeVideo(uri);
        setExpertReport(result);
        setShowExpertReport(true);
        // Save to profile
        await updateProfile({
          latestAnalysis: {
            type: 'shot',
            date: new Date().toISOString(),
            results: result.analysis
          }
        });
      } else if (type === 'session') {
        const result = await expertAiService.analyzeSession(uri);
        setSessionReport(result);
        setShowSessionReport(true);
        // Save to profile
        await updateProfile({
          latestAnalysis: {
            type: 'session',
            date: new Date().toISOString(),
            results: result.analysis
          }
        });
      } else {
        const result = await expertAiService.analyzeDribble(uri);
        setDribbleReport(result);
        setShowDribbleReport(true);
        // Save to profile
        await updateProfile({
          latestAnalysis: {
            type: 'dribble',
            date: new Date().toISOString(),
            results: result.analysis
          }
        });
      }
    } catch (error) {
      console.error('Expert Analysis Error:', error);
      Alert.alert('Erreur', "Impossible de contacter le service d'analyse IA. Vérifiez que le serveur Python est lancé.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
        {/* Header Minimaliste */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/tracker')} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={accentColor} />
            </TouchableOpacity>
            <UserIconButton color={colors.text} size={32} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            <Text style={[styles.title, { color: colors.text }]}>Ankece AI Hub</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Analyse avancée de votre performance</Text>
          </View>

          {/* Section POSTURE */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 Shoot Analyze IA</Text>
            <View style={[styles.badge, { backgroundColor: '#34C75920' }]}>
                <Text style={[styles.badgeText, { color: '#34C759' }]}>BIOMÉCANIQUE</Text>
            </View>
          </View>
          <View style={styles.actionGrid}>
              <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: colors.card }]} 
                  onPress={() => handlePickVideo('shot')}
                  activeOpacity={0.7}
              >
                  <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
                      <Ionicons name="body-outline" size={28} color={accentColor} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Posture</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: colors.card }]} 
                  onPress={() => handleCamera('shot')}
                  activeOpacity={0.7}
              >
                  <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
                      <Ionicons name="scan-outline" size={28} color={accentColor} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Scanner</Text>
              </TouchableOpacity>
          </View>

          {/* Section SESSION */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏀 Shoot Session IA</Text>
            <View style={[styles.badge, { backgroundColor: '#007AFF20' }]}>
                <Text style={[styles.badgeText, { color: '#007AFF' }]}>STATS</Text>
            </View>
          </View>
          <View style={styles.actionGrid}>
              <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: colors.card }]} 
                  onPress={() => handlePickVideo('session')}
                  activeOpacity={0.7}
              >
                  <View style={[styles.iconCircle, { backgroundColor: '#007AFF15' }]}>
                      <Ionicons name="stats-chart-outline" size={28} color="#007AFF" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Mesurer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: colors.card }]} 
                  onPress={() => handleCamera('session')}
                  activeOpacity={0.7}
              >
                  <View style={[styles.iconCircle, { backgroundColor: '#007AFF15' }]}>
                      <Ionicons name="radio-outline" size={28} color="#007AFF" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Direct</Text>
              </TouchableOpacity>
          </View>

          {/* Section DRIBBLE */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Dribble Workout IA</Text>
            <View style={[styles.badge, { backgroundColor: '#FF950020' }]}>
                <Text style={[styles.badgeText, { color: '#FF9500' }]}>HANDLING</Text>
            </View>
          </View>
          <View style={styles.actionGrid}>
              <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: colors.card }]} 
                  onPress={() => handlePickVideo('dribble')}
                  activeOpacity={0.7}
              >
                  <View style={[styles.iconCircle, { backgroundColor: '#FF950015' }]}>
                      <Ionicons name="finger-print-outline" size={28} color="#FF9500" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Contrôle</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: colors.card }]} 
                  onPress={() => handleCamera('dribble')}
                  activeOpacity={0.7}
              >
                  <View style={[styles.iconCircle, { backgroundColor: '#FF950015' }]}>
                      <Ionicons name="flash-outline" size={28} color="#FF9500" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>Vitesse</Text>
              </TouchableOpacity>
          </View>

          {/* Premium Info Card */}
          <View style={[styles.premiumCard, { backgroundColor: accentColor }]}>
              <View style={styles.premiumContent}>
                  <Ionicons name="diamond" size={24} color="#fff" />
                  <View>
                      <Text style={styles.premiumTitle}>Analyse Multi-Sport AI</Text>
                      <Text style={styles.premiumDescription}>Détection des crossovers, entre les jambes et vitesse de dribble.</Text>
                  </View>
              </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique de progression</Text>
          
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="analytics" size={40} color={colors.border} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucun entraînement enregistré aujourd'hui</Text>
          </View>

        </ScrollView>

        {/* Modal Rapport Tir */}
        <Modal
            visible={showExpertReport}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowExpertReport(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    {expertReport && (
                        <ExpertAnalysisReport 
                            data={expertReport} 
                            onClose={() => setShowExpertReport(false)} 
                        />
                    )}
                </View>
            </View>
        </Modal>

        {/* Modal Rapport Dribble */}
        <Modal
            visible={showDribbleReport}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowDribbleReport(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    {dribbleReport && (
                        <DribbleAnalysisReport 
                            data={dribbleReport} 
                            onClose={() => setShowDribbleReport(false)} 
                        />
                    )}
                </View>
            </View>
        </Modal>

        {/* Modal Rapport Session */}
        <Modal
            visible={showSessionReport}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSessionReport(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    {sessionReport && (
                        <SessionAnalysisReport 
                            data={sessionReport} 
                            onClose={() => setShowSessionReport(false)} 
                        />
                    )}
                </View>
            </View>
        </Modal>

        {/* Overlay Chargement */}
        {isAnalyzing && (
            <AnalysisLoadingOverlay 
                message={
                    analysisType === 'shot' ? "Analyse de posture..." : 
                    analysisType === 'session' ? "Comptage des paniers..." : 
                    "Calcul des dribbles..."
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 4,
  },
  heroSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
  },
  badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  premiumCard: {
      borderRadius: 20,
      padding: 20,
      marginTop: 10,
  },
  premiumContent: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
  },
  premiumTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },
  premiumDescription: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      marginTop: 2,
      paddingRight: 40,
  },
  emptyState: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
});
