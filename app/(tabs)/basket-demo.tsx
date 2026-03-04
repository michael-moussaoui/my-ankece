import { AnkeceLogo } from '@/components/AnkeceLogo';
import { BasketballPlayerForm } from '@/components/basketball/BacketballPlayerForm';
import { BasketballCVPreview } from '@/components/basketball/BasketballCVPreview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserIconButton } from '@/components/UserIconButton';
import { MOCK_BASKETBALL_PLAYER } from '@/constants/basketballMockData';
import { BASKETBALL_TEMPLATES } from '@/constants/basketballTemplate';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { basketballCVService } from '@/services/basketballCVService';
import { BasketballPlayerData, BasketballTemplate } from '@/types/basketball/template';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';



type Step = 'welcome' | 'select-template' | 'form' | 'preview';

/**
 * Écran de démonstration du workflow complet Basketball CV
 */
export default function BasketballDemoScreen() {
  const { user: profile, subscribe, isSubscribing } = useUser();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedTemplate, setSelectedTemplate] = useState<BasketballTemplate | null>(null);
  const [playerData, setPlayerData] = useState<BasketballPlayerData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [eliteDraftUrl, setEliteDraftUrl] = useState<string | null>(null);
  
  const intervalRef = useRef<any>(null);
  const msgIntervalRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const colorScheme = useColorScheme();
  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const { accentColor } = useAppTheme();

  const handleSelectTemplate = async (template: BasketballTemplate) => {
    // Check if it's a premium template and user doesn't have a plan
    if (template.isPremium && profile?.plan !== 'elite-pro') {
      // Use the centralized subscribe function from UserContext
      await subscribe('elite-pro');
      // If subscription fails or cancels, we don't proceed to the form
      return;
    }
    
    setSelectedTemplate(template);
    setActiveTemplateId(template.id);
    setIsDemo(false);
    setStep('form');
  };

  const handleDemoSelect = (template: BasketballTemplate) => {
    setSelectedTemplate(template);
    setActiveTemplateId(template.id);
    setPlayerData(MOCK_BASKETBALL_PLAYER);
    setIsDemo(true);
    setStep('preview');
  };

  const handleFormComplete = async (data: BasketballPlayerData) => {
    let interval: any = null;
    let msgInterval: any = null;
    
    try {
      // Inject tier from selected template
      const fullData = { 
        ...data, 
        tier: selectedTemplate?.tier || 'essentiel' 
      };
      
      setPlayerData(fullData);
      setIsProcessing(true);
      setProcessingProgress(0);
      setTimeRemaining(45);
      
      const steps = t('cv.processing_steps', { returnObjects: true }) as string[];
      if (Array.isArray(steps) && steps.length > 0) {
        setProcessingMessage(steps[0]);

        // Timer for progress and countdown
        intervalRef.current = setInterval(() => {
          setProcessingProgress(prev => {
            if (prev >= 95) return prev;
            // Scale progress based on 45s
            return Math.min(prev + (100 / 45), 95);
          });
          
          setTimeRemaining(prev => (prev > 1 ? prev - 1 : 1));
        }, 1000);

        // Rotate messages
        msgIntervalRef.current = setInterval(() => {
          setProcessingMessage(prev => {
            const idx = steps.indexOf(prev);
            return steps[(idx + 1) % steps.length];
          });
        }, 3500);
      }

      console.log("🚀 Starting CV generation request (Async) with data:", data);
      const startResult = await basketballCVService.generateVideoCV(data);
      console.log("📥 Generation triggered:", startResult);

      if (startResult.success && startResult.job_id) {
        const jobId = startResult.job_id;
        
        // Arrêter les timers de simulation si on a un vrai job_id
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);

        // Démarrer le polling
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        
        pollIntervalRef.current = setInterval(async () => {
          const statusResult = await basketballCVService.getJobStatus(jobId);
          
          if (statusResult.success) {
            setProcessingProgress(statusResult.progress || 0);
            if (statusResult.message) setProcessingMessage(statusResult.message);

            if (statusResult.status === 'completed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              const res = statusResult.result;
              const baseUrl = basketballCVService.getBaseUrl();
              
              if (res.filename) {
                setGeneratedVideoUrl(`${baseUrl}/output/cv_videos/${res.filename}`);
              }
              if (res.orchestrator_url) {
                setEliteDraftUrl(res.orchestrator_url);
              }
              
              setProcessingProgress(100);
              setTimeRemaining(0);
              setTimeout(() => {
                setIsProcessing(false);
                setStep('preview');
              }, 1000);
            } else if (statusResult.status === 'failed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              Alert.alert(t('common.error'), statusResult.message || t('cv.error_msg'));
              setIsProcessing(false);
            }
          } else {
            // Job non trouvé (ex: serveur redémarré)
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            console.error("❌ Job lost or not found:", statusResult.message);
            setIsProcessing(false);
            Alert.alert(t('common.error'), t('cv.error_msg'));
          }
        }, 3000); // Poll every 3 seconds

        // Nettoyage de l'intervalle si le composant démonte (via useEffect ou autre si possible, 
        // mais ici c'est une fonction one-shot)
        // On pourrait stocker pollInterval dans une ref si besoin.
      } else {
        throw new Error(startResult.message || t('cv.error_msg'));
      }
    } catch (error) {
      console.error("Error generating CV:", error);
      setIsProcessing(false);
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('cv.error_msg'));
    } finally {
      // Les timers de simulation sont déjà cleared ou gérés par pollInterval
    }
  };

  const handleCancelGeneration = async () => {
    if (playerData?.jobId) {
      try {
        await basketballCVService.cancelVideoCV(playerData.jobId);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
        setIsProcessing(false);
        Alert.alert(t('cv.cancelled_title'), t('cv.cancelled_msg'));
        setStep('form');
      } catch (error) {
        console.error("Error cancelling generation:", error);
        setIsProcessing(false);
        setStep('form');
      }
    } else {
        setIsProcessing(false);
        setStep('form');
    }
  };


  const handleFormCancel = () => {
    Alert.alert(
      t('cv.cancel_title'),
      t('cv.cancel_msg'),
      [
        { text: t('cv.no'), style: 'cancel' },
        {
          text: t('cv.yes'),
          style: 'destructive',
          onPress: () => setStep('select-template'),
        },
      ]
    );
  };

  const handleEditPreview = () => {
    setIsDemo(false);
    setStep('form');
  };

  const handleExportCV = () => {
    Alert.alert(
      t('cv.export_title'),
      t('cv.export_format'),
      [
        {
          text: 'MP4 (1080p)',
          onPress: () => Alert.alert(t('common.info'), t('cv.export_dev')),
        },
        {
          text: 'Instagram Story',
          onPress: () => Alert.alert(t('common.info'), t('cv.export_dev')),
        },
        {
          text: 'TikTok',
          onPress: () => Alert.alert(t('common.info'), t('cv.export_dev')),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleBackFromPreview = () => {
    Alert.alert(
      t('cv.back_title'),
      t('cv.back_msg'),
      [
        { text: t('cv.no'), style: 'cancel' },
        {
          text: t('cv.yes'),
          onPress: () => setStep('form'),
        },
      ]
    );
  };

  const renderWelcome = () => (
    <ThemedView style={styles.welcomeContainer}>
      <View style={styles.welcomeHeader}>
        <AnkeceLogo
          style={styles.imageLogo}
        />
        {/* <Ionicons name="basketball" size={80} color="#FF6F00" /> */}
        {/* <Text style={styles.welcomeTitle}>CV Basketball</Text> */}
        <ThemedText style={styles.welcomeSubtitle}>
          {t('cv.subtitle')}
        </ThemedText>
      </View>

      <View style={styles.features}>
        <ThemedView style={styles.feature} darkColor={Colors.dark.backgroundSecondary}>
          <Ionicons name="image" size={24} color={accentColor} />
          <ThemedText style={styles.featureText}>{t('cv.feature_photo')}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.feature} darkColor={Colors.dark.backgroundSecondary}>
          <Ionicons name="videocam" size={24} color={accentColor} />
          <ThemedText style={styles.featureText}>{t('cv.feature_videos')}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.feature} darkColor={Colors.dark.backgroundSecondary}>
          <Ionicons name="stats-chart" size={24} color={accentColor} />
          <ThemedText style={styles.featureText}>{t('cv.feature_stats')}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.feature} darkColor={Colors.dark.backgroundSecondary}>
          <Ionicons name="person" size={24} color={accentColor} />
          <ThemedText style={styles.featureText}>{t('cv.feature_info')}</ThemedText>
        </ThemedView>
      </View>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: accentColor }]}
        onPress={() => setStep('select-template')}
      >
        <ThemedText style={styles.startButtonText}>{t('cv.start')}</ThemedText>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );

  const renderTemplateSelection = () => (
    <ThemedView style={styles.templateContainer}>
      <View style={[styles.templateHeader, { borderBottomColor: colorScheme === 'dark' ? '#444' : borderColor }]}>
          <TouchableOpacity onPress={() => setStep('welcome')}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">{t('cv.select_template')}</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.templatesList}
        >
          {BASKETBALL_TEMPLATES.map((template) => (
            <View
                key={template.id}
                style={[
                styles.templateCard, 
                { 
                    borderColor: activeTemplateId === template.id ? accentColor : (template.isPremium ? accentColor + '33' : borderColor), 
                    borderWidth: activeTemplateId === template.id ? 2 : 1,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.backgroundSecondary : Colors.light.card 
                }
                ]}
            >
                <Pressable 
                  onPress={() => setActiveTemplateId(template.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                    <View style={styles.templateCardHeader}>
                <View style={styles.templateTitleRow}>
                  <ThemedText type="defaultSemiBold" style={styles.templateCardTitle}>
                      {t(`cv.templates.${template.tier === 'pro' ? 'pro' : template.tier === 'elite' ? 'elite' : 'essential'}.name`)}
                  </ThemedText>
                  {template.isPremium && (
                      <View style={[styles.premiumBadge, { backgroundColor: accentColor }]}>
                          <ThemedText style={styles.premiumText}>ELITE</ThemedText>
                      </View>
                  )}
                </View>
                </View>
                <ThemedText style={styles.templateCardDescription}>
                {t(`cv.templates.${template.tier === 'pro' ? 'pro' : template.tier === 'elite' ? 'elite' : 'essential'}.description`)}
                </ThemedText>
                <View style={styles.templateCardFeatures}>
                <View style={styles.templateFeature}>
                    <Ionicons name="time" size={16} color={textSecondary} />
                    <ThemedText style={styles.templateFeatureText}>
                    {template.totalDuration / 1000}s
                    </ThemedText>
                </View>
                <View style={styles.templateFeature}>
                    <Ionicons name="layers" size={16} color={textSecondary} />
                    <ThemedText style={styles.templateFeatureText}>
                    {template.sections.length} {t('cv.sections')}
                    </ThemedText>
                </View>
                </View>
                </Pressable>
                <View style={[styles.templateCardFooter, { borderTopColor: borderColor }]}>
                  <TouchableOpacity 
                    style={[styles.templateActionBtn, { borderColor: accentColor, borderWidth: 1 }]}
                    onPress={() => handleDemoSelect(template)}
                  >
                    <ThemedText style={[styles.templateActionText, { color: accentColor }]}>
                      {t('cv.view_example') || 'Voir exemple'}
                    </ThemedText>
                    <Ionicons name="eye-outline" size={20} color={accentColor} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.templateActionBtn, { backgroundColor: accentColor }]}
                    onPress={() => handleSelectTemplate(template)}
                  >
                    <ThemedText style={[styles.templateActionText, { color: '#fff' }]}>
                      {t('cv.use_template') || 'Utiliser'}
                    </ThemedText>
                    <Ionicons name="flash" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
            </View>
          ))}
        </ScrollView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header Overlay */}
      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <UserIconButton color={Colors[colorScheme ?? 'light'].text} size={32} />
      </View>
      
      <SafeAreaView style={styles.container}>
        {step === 'welcome' && renderWelcome()}
        {step === 'select-template' && renderTemplateSelection()}
        {step === 'form' && (
          <BasketballPlayerForm
            onComplete={handleFormComplete}
            onCancel={handleFormCancel}
            initialData={playerData || undefined}
            templateId={activeTemplateId || undefined}
          />
        )}
        {step === 'preview' && selectedTemplate && playerData && (
          <BasketballCVPreview
            template={selectedTemplate}
            playerData={playerData}
            isDemo={isDemo}
            onEdit={handleEditPreview}
            onExport={handleExportCV}
            onBack={handleBackFromPreview}
            generatedVideoUrl={generatedVideoUrl || undefined}
            eliteDraftUrl={eliteDraftUrl || undefined}
          />
        )}

        {(isProcessing || isSubscribing) && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
            <ActivityIndicator size="large" color={accentColor} />
            
            <ThemedText style={{ marginTop: 24, fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
              {isSubscribing ? t('cv.form.packs.upgrade_needed') : processingMessage}
            </ThemedText>
            
            <ThemedText style={{ marginTop: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              {isSubscribing ? t('common.loading') : t('cv.time_remaining', { time: timeRemaining })}
            </ThemedText>

            {!isSubscribing && (
                <View style={{ width: '80%', marginTop: 40, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                        <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{t('common.loading')}</ThemedText>
                        <ThemedText style={{ color: accentColor, fontWeight: 'bold', fontSize: 14 }}>{Math.round(processingProgress)}%</ThemedText>
                    </View>
                    <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ width: `${processingProgress}%`, height: '100%', backgroundColor: accentColor, borderRadius: 3 }} />
                    </View>
                    
                    <TouchableOpacity 
                        style={{ marginTop: 40, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                        onPress={handleCancelGeneration}
                    >
                        <ThemedText style={{ color: '#FF3B30', fontWeight: 'bold' }}>
                            {t('cv.cancel_generation') || 'Arrêter la génération'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  welcomeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    opacity: 0.8,
  },
  imageLogo : {
    width: 200,
    height: 200
  },
  features: {
    gap: 16,
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  templateContainer: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  templatesList: {
    padding: 16,
    gap: 16,
  },
  templateCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateCardHeader: {
    marginBottom: 8,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardTitle: {
    fontSize: 20,
  },
  templateCardDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  templateCardFeatures: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  templateFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateFeatureText: {
    fontSize: 12,
    opacity: 0.8,
  },
  templateCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  selectTemplateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  templateActionText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
});