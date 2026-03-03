import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExportOptions, useExport } from '@/services/export/exportService';
import { BasketballVideoPreviewProps } from '@/types/basketball/template';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutUp,
    FlipInXUp,
    LinearTransition,
    SlideInUp,
    SlideOutUp,
    ZoomIn
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SectionRenderer } from './SectionRenderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Composant de prévisualisation du CV Basketball final
 */
export const BasketballCVPreview: React.FC<BasketballVideoPreviewProps & { generatedVideoUrl?: string; eliteDraftUrl?: string }> = ({
  template,
  playerData,
  isDemo = false,
  onEdit,
  onExport,
  onBack,
  generatedVideoUrl,
  eliteDraftUrl,
}) => {
  const [viewMode, setViewMode] = useState<'template' | 'video' | 'elite'>(
    eliteDraftUrl ? 'elite' : (generatedVideoUrl ? 'video' : 'template')
  );
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); 

  const colorScheme = useColorScheme();
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const borderColor = Colors[colorScheme].border;
  const backgroundSecondary = Colors[colorScheme].backgroundSecondary;
  const cardBackground = Colors[colorScheme].card;
  const textSecondary = Colors[colorScheme].textSecondary;
  const { t } = useTranslation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSection = template.sections[currentSectionIndex];

  // Hook d'export - renommer la variable progress
  const { isExporting, progress: exportProgress, exportCV, shareCV } = useExport();

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Gérer la lecture automatique
  useEffect(() => {
    if (isPlaying) {
      // Réinitialiser le progrès
      setPlaybackProgress(0);
      
      // Mettre à jour le progrès toutes les 100ms
      progressIntervalRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          const newProgress = prev + (100 / currentSection.duration) * 100;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 100);

      // Timer pour passer à la section suivante
      timerRef.current = setTimeout(() => {
        if (currentSectionIndex < template.sections.length - 1) {
          setCurrentSectionIndex(currentSectionIndex + 1);
          setPlaybackProgress(0);
        } else {
          // Fin de la lecture
          setIsPlaying(false);
          setPlaybackProgress(0);
          setCurrentSectionIndex(0);
        }
      }, currentSection.duration);
    } else {
      // Arrêter les timers si en pause
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentSectionIndex, currentSection.duration, template.sections.length]);

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setIsPlaying(false);
      setPlaybackProgress(0);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < template.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setIsPlaying(false);
      setPlaybackProgress(0);
    }
  };

  const handleSelectSection = (index: number) => {
    setCurrentSectionIndex(index);
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentSectionIndex(0);
    setPlaybackProgress(0);
    setIsPlaying(true);
  };

  const toggleViewMode = () => {
    if (viewMode === 'template') {
        setViewMode(eliteDraftUrl ? 'elite' : 'video');
    } else if (viewMode === 'elite') {
        setViewMode(generatedVideoUrl ? 'video' : 'template');
    } else {
        setViewMode('template');
    }
    setIsPlaying(false);
  };

  const handleExport = async () => {
    try {
      const options: ExportOptions = {
        format: 'instagram-story', // ou 'mp4', 'tiktok', etc.
        quality: 'high',
        includeWatermark: true,
      };

      const filePath = await exportCV(template, playerData, options);

      Alert.alert(
        t('cv.form.export_success_title'),
        t('cv.form.export_success_msg'),
        [
          { text: t('cv.form.no'), style: 'cancel' },
          {
            text: t('cv.form.share'),
            onPress: () => shareCV(filePath),
          },
        ]
      );
    } catch (err) {
      Alert.alert(t('common.error'), t('cv.form.export_error') || 'Export failed');
      console.error(err);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: backgroundSecondary }]} testID="basketball-cv-preview">
      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          testID="back-button"
          onPress={onBack}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <ThemedText type="subtitle" style={styles.headerTitle}>{t('cv.form.preview')}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {playerData.firstName} {playerData.lastName}
          </ThemedText>
        </View>

        <TouchableOpacity
          testID="edit-button"
          onPress={onEdit}
          style={styles.headerButton}
        >
          <Ionicons name={isDemo ? "flash" : "create-outline"} size={24} color={tintColor} />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Template Info */}
        <View style={[styles.templateInfo, { borderBottomColor: borderColor }]}>
          <View style={styles.templateInfoLeft}>
            <Ionicons name="document-text" size={20} color={tintColor} />
            <ThemedText style={styles.templateName}>{template.name}</ThemedText>
          </View>
          <View style={styles.templateStats}>
            <View style={styles.templateStat}>
              <Ionicons name="time-outline" size={16} color={textSecondary} />
              <ThemedText style={styles.templateStatThemedText}>
                {template.totalDuration / 1000}s
              </ThemedText>
            </View>
            <View style={styles.templateStat}>
              <Ionicons name="layers-outline" size={16} color={textSecondary} />
              <ThemedText style={styles.templateStatThemedText}>
                {template.sections.length} {t('cv.sections')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Section Preview */}
        <View style={styles.previewContainer}>
          {viewMode === 'elite' && eliteDraftUrl ? (
            <WebView 
              source={{ uri: eliteDraftUrl }}
              style={StyleSheet.absoluteFill}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
                  <ActivityIndicator size="large" color={tintColor} />
                </View>
              )}
            />
          ) : viewMode === 'video' && generatedVideoUrl ? (
            <View style={StyleSheet.absoluteFill}>
              <Video
                source={{ uri: generatedVideoUrl }}
                style={StyleSheet.absoluteFill}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={isPlaying}
                onLoadStart={() => console.log("Video loading...")}
                onError={(error) => console.error("Video error:", error)}
              />
              {!isPlaying && (
                 <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={tintColor} />
                 </View>
              )}
            </View>
          ) : (
            <>
              {/* Section Container with Dynamic Transitions */}
              <Animated.View
                key={`${currentSection.id}-renderer`}
                entering={
                    template.id === 'basketball-ai-elite'
                    ? ZoomIn.duration(400).springify()
                    : currentSectionIndex % 3 === 0 
                    ? SlideInUp.duration(600).springify().damping(15) 
                    : currentSectionIndex % 3 === 1 
                    ? FlipInXUp.duration(800) 
                    : ZoomIn.duration(600).springify()
                }
                exiting={
                    template.id === 'basketball-ai-elite'
                    ? ZoomIn.duration(200)
                    : SlideOutUp.duration(400)
                }
                style={styles.sectionContainer}
              >
                <SectionRenderer
                    section={currentSection}
                    playerData={playerData}
                    theme={template.theme}
                    isPlaying={isPlaying}
                />
              </Animated.View>

              {/* Section Title Overlay */}
              <Animated.View 
                key={`${currentSection.id}-overlay`}
                entering={FadeInDown.springify().damping(12)}
                exiting={FadeOutUp.duration(200)}
                style={[
                    styles.sectionTitleOverlay, 
                    { borderLeftColor: template.theme.primary, borderLeftWidth: 4 },
                    template.id === 'basketball-ai-elite' && { backgroundColor: 'rgba(255, 140, 0, 0.1)', borderColor: template.theme.primary }
                ]}
              >
                <View style={styles.sectionTitleContent}>
                  <ThemedText style={styles.sectionTitle}>{currentSection.title}</ThemedText>
                  <ThemedText style={[styles.sectionInfo, { color: template.theme.primary }]}>
                    {t('common.section') || 'Section'} {currentSectionIndex + 1}/{template.sections.length}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sectionDuration, { color: template.theme.accent }]}>
                  {currentSection.duration / 1000}s
                </ThemedText>
              </Animated.View>
            </>
          )}

          {(generatedVideoUrl || eliteDraftUrl) && (
            <TouchableOpacity 
              style={[styles.toggleViewBtn, { backgroundColor: viewMode !== 'template' ? tintColor : 'rgba(0,0,0,0.6)' }]}
              onPress={toggleViewMode}
            >
              <Ionicons name={viewMode === 'template' ? (eliteDraftUrl ? "flash" : "videocam") : "layers"} size={20} color="#fff" />
              <ThemedText style={styles.toggleViewText}>
                {viewMode === 'template' 
                  ? (eliteDraftUrl ? "Voir Elite Draft" : "Voir Vidéo Réelle") 
                  : "Voir Template"}
              </ThemedText>
            </TouchableOpacity>
          )}

          {isDemo && !showRealVideo && (
            <Animated.View 
              entering={FlipInXUp.delay(500)}
              style={styles.demoCallToAction}
            >
              <TouchableOpacity 
                 style={[styles.useTemplateBtn, { backgroundColor: template.theme.primary }]}
                 onPress={onEdit}
              >
                <ThemedText style={styles.useTemplateText}>
                  {t('cv.use_this_template') || 'Utiliser ce template'}
                </ThemedText>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Stats Overlay (Dynamic) */}
           {currentSection.type === 'stats' && playerData.stats && (
              <Animated.View 
                entering={FadeInDown.delay(300).springify()}
                style={styles.statsOverlay}
              >
                  <View style={styles.statBadge}>
                     <ThemedText style={styles.statValue}>{playerData.stats.pointsPerGame}</ThemedText>
                     <ThemedText style={styles.statLabel}>{t('cv.form.ppg')}</ThemedText>
                  </View>
                  <View style={styles.statBadge}>
                     <ThemedText style={styles.statValue}>{playerData.stats.reboundsPerGame}</ThemedText>
                     <ThemedText style={styles.statLabel}>{t('cv.form.rpg')}</ThemedText>
                  </View>
                  <View style={styles.statBadge}>
                     <ThemedText style={styles.statValue}>{playerData.stats.assistsPerGame}</ThemedText>
                     <ThemedText style={styles.statLabel}>{t('cv.form.apg')}</ThemedText>
                  </View>
              </Animated.View>
           )}

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View 
                layout={LinearTransition}
                style={[styles.progressBar, { width: `${playbackProgress}%`, backgroundColor: template.theme.primary }]} 
            />
          </View>

          {/* Navigation Arrows */}
          {currentSectionIndex > 0 && (
            <TouchableOpacity
              testID="previous-section-button"
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={handlePreviousSection}
            >
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {currentSectionIndex < template.sections.length - 1 && (
            <TouchableOpacity
              testID="next-section-button"
              style={[styles.navButton, styles.navButtonRight]}
              onPress={handleNextSection}
            >
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Play/Pause Button */}
          <TouchableOpacity
            testID="play-button"
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={48}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Restart Button (visible à la fin) */}
          {!isPlaying && currentSectionIndex === template.sections.length - 1 && playbackProgress === 0 && (
            <Animated.View 
                entering={FadeInDown.springify()}
                style={{ position: 'absolute', bottom: 20, alignSelf: 'center' }}
            >
                <TouchableOpacity
                testID="restart-button"
                style={styles.restartButton}
                onPress={handleRestart}
                >
                <Ionicons name="refresh" size={24} color="#fff" />
                <ThemedText style={styles.restartThemedText}>{t('cv.form.replay')}</ThemedText>
                </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Section Selector */}
        <View style={[styles.sectionSelector, { backgroundColor: cardBackground, borderBottomColor: borderColor }]} testID="section-selector">
          <ThemedText style={styles.sectionSelectorTitle}>{t('cv.form.cv_sections')}</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionSelectorContent}
          >
            {template.sections.map((section, index) => (
              <TouchableOpacity
                key={section.id}
                testID={`section-button-${index}`}
                style={[
                  styles.sectionButton,
                  { backgroundColor: backgroundSecondary },
                  currentSectionIndex === index && { backgroundColor: tintColor },
                ]}
                onPress={() => handleSelectSection(index)}
              >
                <View style={styles.sectionButtonContent}>
                  <Ionicons
                    name={
                      section.type === 'intro'
                        ? 'person'
                        : section.type === 'profile'
                        ? 'card'
                        : section.type === 'offensive'
                        ? 'basketball'
                        : section.type === 'defensive'
                        ? 'shield'
                        : section.type === 'history'
                        ? 'time'
                        : 'stats-chart'
                    }
                    size={20}
                    color={currentSectionIndex === index ? '#fff' : textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.sectionButtonThemedText,
                      currentSectionIndex === index &&
                        styles.sectionButtonThemedTextActive,
                    ]}
                  >
                    {section.title}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.sectionButtonDuration,
                    currentSectionIndex === index &&
                      styles.sectionButtonDurationActive,
                  ]}
                >
                  {section.duration / 1000}s
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Player Info Summary - Modern Cards */}
        <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={styles.playerInfoContainer}
        >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16, gap: 12}}>
                <View style={[styles.infoCard, { backgroundColor: cardBackground }]}>
                    <Ionicons name="basketball-outline" size={20} color={tintColor} />
                    <View>
                        <ThemedText style={styles.infoCardLabel}>{t('cv.form.position')}</ThemedText>
                        <ThemedText style={styles.infoCardValue}>{playerData.position}</ThemedText>
                    </View>
                </View>

                <View style={[styles.infoCard, { backgroundColor: cardBackground }]}>
                    <Ionicons name="calendar-outline" size={20} color={tintColor} />
                    <View>
                        <ThemedText style={styles.infoCardLabel}>{t('cv.form.age')}</ThemedText>
                        <ThemedText style={styles.infoCardValue}>{playerData.age} {t('cv.form.years_old')}</ThemedText>
                    </View>
                </View>

                {playerData.height && (
                    <View style={[styles.infoCard, { backgroundColor: cardBackground }]}>
                        <Ionicons name="resize-outline" size={20} color={tintColor} />
                        <View>
                            <ThemedText style={styles.infoCardLabel}>{t('cv.form.height')}</ThemedText>
                            <ThemedText style={styles.infoCardValue}>{playerData.height} cm</ThemedText>
                        </View>
                    </View>
                )}

                <View style={[styles.infoCard, { backgroundColor: cardBackground, minWidth: 120 }]}>
                    <Ionicons name="shirt-outline" size={20} color={tintColor} />
                    <View>
                        <ThemedText style={styles.infoCardLabel}>{t('cv.form.current_club')}</ThemedText>
                        <ThemedText style={styles.infoCardValue} numberOfLines={1}>{playerData.currentClub.clubName}</ThemedText>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>

        {playerData.stats && Object.keys(playerData.stats).length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            style={[styles.statsDashboard, { backgroundColor: cardBackground, borderColor }]}
          >
            <View style={styles.dashboardHeader}>
                <View style={[styles.dashboardIconBox, { backgroundColor: backgroundSecondary }]}>
                    <Ionicons name="stats-chart" size={24} color={tintColor} />
                </View>
                <View>
                    <ThemedText style={styles.dashboardTitle}>{t('cv.form.current_season')}</ThemedText>
                    <ThemedText style={styles.dashboardSubtitle}>{t('cv.form.stats_desc')}</ThemedText>
                </View>
            </View>

            <View style={styles.dashboardGrid}>
                <View style={[styles.dashboardStatBox, { backgroundColor: backgroundSecondary }]}>
                    <ThemedText style={styles.dashboardStatValue}>{playerData.stats.pointsPerGame ?? '-'}</ThemedText>
                    <ThemedText style={styles.dashboardStatLabel}>{t('cv.form.pts')}</ThemedText>
                </View>
                <View style={[styles.dashboardStatBox, { backgroundColor: backgroundSecondary }]}>
                    <ThemedText style={styles.dashboardStatValue}>{playerData.stats.reboundsPerGame ?? '-'}</ThemedText>
                    <ThemedText style={styles.dashboardStatLabel}>{t('cv.form.reb')}</ThemedText>
                </View>
                <View style={[styles.dashboardStatBox, { backgroundColor: backgroundSecondary }]}>
                    <ThemedText style={styles.dashboardStatValue}>{playerData.stats.assistsPerGame ?? '-'}</ThemedText>
                    <ThemedText style={styles.dashboardStatLabel}>{t('cv.form.ast')}</ThemedText>
                </View>
                 {playerData.stats.stealsPerGame !== undefined && (
                    <View style={[styles.dashboardStatBox, { backgroundColor: backgroundSecondary }]}>
                        <ThemedText style={styles.dashboardStatValue}>{playerData.stats.stealsPerGame}</ThemedText>
                        <ThemedText style={styles.dashboardStatLabel}>{t('cv.form.interceptions')}</ThemedText>
                    </View>
                )}
            </View>

             {(playerData.stats.fieldGoalPercentage || playerData.stats.threePointPercentage) && (
                 <View style={[styles.percentageRow, { borderTopColor: borderColor }]}>
                    {playerData.stats.fieldGoalPercentage && (
                        <View style={styles.percentageItem}>
                            <ThemedText style={styles.percentageValue}>{playerData.stats.fieldGoalPercentage}%</ThemedText>
                            <ThemedText style={styles.percentageLabel}>{t('cv.form.shot')}</ThemedText>
                        </View>
                    )}
                    {playerData.stats.threePointPercentage && (
                        <View style={styles.percentageItem}>
                            <ThemedText style={styles.percentageValue}>{playerData.stats.threePointPercentage}%</ThemedText>
                            <ThemedText style={styles.percentageLabel}>3 Points</ThemedText>
                        </View>
                    )}
                    {playerData.stats.freeThrowPercentage && (
                        <View style={styles.percentageItem}>
                            <ThemedText style={styles.percentageValue}>{playerData.stats.freeThrowPercentage}%</ThemedText>
                            <ThemedText style={styles.percentageLabel}>{t('cv.form.free_throws')}</ThemedText>
                        </View>
                    )}
                </View>
             )}
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Export Button */}
      <View style={[styles.footer, { backgroundColor: cardBackground }]}>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: tintColor }, isExporting && styles.exportingButton]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator color="#fff" />
              <ThemedText style={styles.exportButtonThemedText}>
                {exportProgress?.message || 'Export en cours...'}
              </ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={24} color="#fff" />
              <ThemedText style={styles.exportButtonThemedText}>{t('cv.form.export_video')}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Barre de progression quand export en cours */}
      {isExporting && exportProgress && (
        <View style={styles.progressOverlay}>
          <View style={[styles.progressOverlayContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.progressOverlayThemedText}>{exportProgress.message}</ThemedText>
            <View style={[styles.exportProgressBarContainer, { backgroundColor: backgroundSecondary }]}>
              <View 
                style={[
                  styles.exportProgressBar, 
                  { width: `${exportProgress.progress}%`, backgroundColor: tintColor }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressPercentageThemedText}>
              {Math.round(exportProgress.progress)}%
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1, 
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 50, // Added padding for iOS notch
  },
  headerButton: {
    padding: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  templateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  templateInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '700',
  },
  templateStats: {
    flexDirection: 'row',
    gap: 12,
  },
  templateStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateStatThemedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewContainer: {
    backgroundColor: '#000',
    position: 'relative',
    height: SCREEN_HEIGHT * 0.6,
    overflow: 'hidden',
  },
  sectionContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  sectionTitleOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitleContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  sectionInfo: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  sectionDuration: {
    fontSize: 13,
    fontWeight: '900',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statBadge: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#aaa',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBar: {
    height: '100%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  navButton: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navButtonLeft: {
    left: 12,
  },
  navButtonRight: {
    right: 12,
  },
  playButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  restartButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#000',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  restartThemedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  demoCallToAction: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    zIndex: 100,
  },
  useTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  useTemplateText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sectionSelector: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionSelectorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSelectorContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  sectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    minWidth: 100,
  },
  sectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionButtonThemedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionButtonThemedTextActive: {
    color: '#fff',
  },
  sectionButtonDuration: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.5,
  },
  sectionButtonDurationActive: {
    color: '#fff',
    opacity: 0.8,
  },
  playerInfoContainer: {
    marginVertical: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    minWidth: 110,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statsDashboard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dashboardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dashboardSubtitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  dashboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dashboardStatBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  dashboardStatValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  dashboardStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
    marginTop: 2,
  },
  percentageRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  percentageItem: {
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  percentageLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  exportButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  exportButtonThemedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  exportingButton: {
    opacity: 0.7,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    zIndex: 1000,
  },
  progressOverlayContent: {
    padding: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  progressOverlayThemedText: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportProgressBarContainer: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
  },
  exportProgressBar: {
    height: '100%',
  },
  progressPercentageThemedText: {
    fontSize: 16,
    fontWeight: '900',
    opacity: 0.8,
  },
  toggleViewBtn: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    zIndex: 100,
  },
  toggleViewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

