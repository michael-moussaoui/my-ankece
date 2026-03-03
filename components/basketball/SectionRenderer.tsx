import {
    BasketballPlayerData,
    BasketballTemplate,
    BasketballTemplateSection,
    ClubInfo,
} from '@/types/basketball/template';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInRight,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SectionRendererProps {
  section: BasketballTemplateSection;
  playerData: BasketballPlayerData;
  theme: BasketballTemplate['theme'];
  isPlaying?: boolean;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

/**
 * Composant pour afficher une section du template avec les données du joueur avec animations CapCut-style
 */
export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  playerData,
  theme,
  isPlaying = false,
}) => {
  const { t } = useTranslation();
  // Animation shared values
  const flashOpacity = useSharedValue(0);
  const zoomValue = useSharedValue(1);
  const scannerY = useSharedValue(0);
  const isElite = section.id.includes('ai-');

  // Initialiser les lecteurs vidéo
  const offensivePlayer = useVideoPlayer(
    section.type === 'offensive' && playerData.offensiveVideo
      ? playerData.offensiveVideo.uri
      : null,
    (player) => {
      if (player) {
        player.loop = false;
        player.muted = false;
      }
    }
  );

  const defensivePlayer = useVideoPlayer(
    section.type === 'defensive' && playerData.defensiveVideo
      ? playerData.defensiveVideo.uri
      : null,
    (player) => {
      if (player) {
        player.loop = false;
        player.muted = false;
      }
    }
  );

  // Trigger animations on section change or play
  useEffect(() => {
    // Flash effect
    flashOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
    );

    // Ken Burns effect (Subtle zoom)
    zoomValue.value = 1;
    zoomValue.value = withTiming(1.15, { duration: section.duration });

    // Scanner animation for Elite
    if (isElite) {
        scannerY.value = 0;
        scannerY.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            true
        );
    }

    // Video control with safety checks
    const controlPlayer = (player: any, shouldPlay: boolean) => {
        if (!player) return;
        try {
            if (shouldPlay) player.play();
            else player.pause();
        } catch (e) {
            console.warn('Video control failed:', e);
        }
    };

    if (section.type === 'offensive' && offensivePlayer && playerData.offensiveVideo) {
        controlPlayer(offensivePlayer, isPlaying);
    }
    if (section.type === 'defensive' && defensivePlayer && playerData.defensiveVideo) {
        controlPlayer(defensivePlayer, isPlaying);
    }

    return () => {
      // Safe cleanup
      const cleanupPlayer = (player: any) => {
          if (!player) return;
          try {
              player.pause();
              player.currentTime = 0;
          } catch (e) {
              // Silently ignore shared object errors during cleanup
          }
      };
      
      cleanupPlayer(offensivePlayer);
      cleanupPlayer(defensivePlayer);
    };
  }, [section.id, isPlaying, section.duration]);

  const animatedPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomValue.value }],
  }));

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const animatedScannerStyle = useAnimatedStyle(() => ({
    top: `${scannerY.value * 100}%`,
    opacity: isElite ? 0.7 : 0,
  }));

  const getFieldValue = (field: keyof BasketballPlayerData | 'custom', label?: string): string => {
    if (field === 'custom') return label || '';
    const value = playerData[field];
    if (field === 'currentClub' && typeof value === 'object') return (value as ClubInfo).clubName;
    if (field === 'height' && value) return `${value} cm`;
    if (field === 'weight' && value) return `${value} kg`;
    return value === null || value === undefined ? '' : String(value);
  };

  const renderBackground = () => {
    return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: section.backgroundColor || theme.background }]} />;
  };

  const renderPhoto = () => {
    if (!section.layout.photoPosition || !playerData.profilePhoto) return null;
    const { x, y, width, height } = section.layout.photoPosition;

    return (
      <Animated.View 
        entering={FadeIn.duration(800)}
        style={[
          styles.photoContainer,
          { left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` },
        ]}
      >
        <AnimatedImage
          source={{ uri: playerData.profilePhoto.uri }}
          style={[styles.photo, animatedPhotoStyle]}
          resizeMode="cover"
        />
        {isElite && (
            <Animated.View style={[styles.scannerLine, animatedScannerStyle, { backgroundColor: theme.primary }]} />
        )}
      </Animated.View>
    );
  };

  const renderVideo = () => {
    if (!section.layout.videoPosition) return null;
    const { x, y, width, height } = section.layout.videoPosition;

    let player = null;
    if (section.type === 'offensive' && playerData.offensiveVideo && offensivePlayer) player = offensivePlayer;
    else if (section.type === 'defensive' && playerData.defensiveVideo && defensivePlayer) player = defensivePlayer;

    return (
      <Animated.View
        entering={ZoomIn.duration(600).delay(200)}
        style={[
          styles.videoContainer,
          {
            left: `${x}%`,
            top: `${y}%`,
            width: `${width}%`,
            height: `${height}%`,
            borderColor: theme.accent,
            borderWidth: 2,
            shadowColor: theme.primary,
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 10,
          },
        ]}
      >
        {player ? (
          <VideoView style={styles.video} player={player} nativeControls={false} />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={[styles.videoPlaceholderText, { color: theme.primary }]}>
              {section.type === 'offensive' ? t('cv.form.offensive_video') : t('cv.form.defensive_video')}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderTextZones = () => {
    return section.layout.textZones.map((zone, index) => {
      const text = zone.label || getFieldValue(zone.field, zone.label);
      if (!text) return null;

      return (
        <Animated.Text
          key={zone.id}
          entering={FadeIn.delay(300 + index * 100).duration(800)}
          style={[
            styles.text,
            {
              position: 'absolute',
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              fontSize: zone.fontSize,
              color: zone.color === '#7c3aed' ? theme.primary : zone.color,
              fontWeight: zone.fontWeight,
              textAlign: zone.textAlign,
              textTransform: zone.format,
              width: zone.width ? `${zone.width}%` : 'auto',
              maxWidth: '90%',
            },
            zone.textAlign === 'center' && {
                alignSelf: 'center',
                textAlign: 'center'
            }
          ]}
          numberOfLines={2}
        >
          {text}
          {isElite && zone.field !== 'custom' && (
              <View style={[styles.aiVerifiedBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="shield-checkmark" size={10} color="#000" />
                  <Text style={styles.aiVerifiedText}>AI VERIFIED</Text>
              </View>
          )}
        </Animated.Text>
      );
    });
  };
  
  const renderStats = () => {
    if (section.type !== 'stats' || !playerData?.stats) return null;
    const { pointsPerGame = 0, reboundsPerGame = 0, assistsPerGame = 0 } = playerData.stats;

    return (
        <View style={styles.statsOverlayContainer}>
            <Animated.Text entering={FadeInDown.delay(200).springify()} style={[styles.statsMainTitle, { color: theme.accent }]}>
                {t('cv.form.current_season')}
            </Animated.Text>

            <View style={styles.statsRow}>
                {[
                    { val: pointsPerGame, label: t('cv.form.pts') },
                    { val: reboundsPerGame, label: t('cv.form.reb') },
                    { val: assistsPerGame, label: t('cv.form.ast') }
                ].map((stat, i) => (
                    <Animated.View 
                        key={i}
                        entering={SlideInUp.delay(400 + i * 150).springify().damping(12)}
                        style={[styles.statBox, { backgroundColor: theme.background + 'B3', borderColor: theme.primary, borderWidth: 2 }]}
                    >
                        <Text style={[styles.statBoxValue, { color: theme.text }]}>{stat.val || '-'}</Text>
                        <Text style={[styles.statBoxLabel, { color: theme.accent }]}>{stat.label}</Text>
                    </Animated.View>
                ))}
            </View>

            {(playerData.stats.fieldGoalPercentage || playerData.stats.threePointPercentage || playerData.stats.freeThrowPercentage) && (
                <Animated.View 
                    entering={FadeIn.delay(1000)}
                    style={[styles.percentageContainer, { backgroundColor: theme.primary }]}
                >
                    <Text style={[styles.percentageText, { color: theme.text }]}>
                        {playerData.stats.fieldGoalPercentage ? `${t('cv.form.shot')}: ${playerData.stats.fieldGoalPercentage}%` : ''}
                        {playerData.stats.threePointPercentage ? ` • 3PT: ${playerData.stats.threePointPercentage}%` : ''}
                        {playerData.stats.freeThrowPercentage ? ` • ${t('cv.form.free_throws')}: ${playerData.stats.freeThrowPercentage}%` : ''}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
  };

  const renderClubHistory = () => {
    if (section.type !== 'history' || !playerData.clubHistory.length) return null;

    return (
      <View style={styles.clubHistoryContainer}>
        {playerData.clubHistory.slice(0, 4).map((club, index) => (
          <Animated.View 
            key={index} 
            entering={FadeInRight.delay(200 + index * 150).springify()}
            style={styles.clubHistoryItem}
          >
            <View style={[styles.clubHistoryDot, { backgroundColor: theme.primary }]} />
            <View style={styles.clubHistoryContent}>
              <Text style={styles.clubHistoryName} numberOfLines={1}>{club.clubName}</Text>
              <Text style={[styles.clubHistorySeason, { color: theme.accent }]}>{club.season}</Text>
              {club.league && <Text style={styles.clubHistoryLeague} numberOfLines={1}>{club.league}</Text>}
            </View>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} testID={`section-${section.id}`}>
      {renderBackground()}
      {renderPhoto()}
      {renderVideo()}
      {renderTextZones()}
      {renderClubHistory()}
      {renderStats()}

      {/* Flash Transition Layout */}
      <Animated.View 
        pointerEvents="none"
        style={[styles.flashOverlay, animatedFlashStyle]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    position: 'relative',
    overflow: 'hidden',
  },
  photoContainer: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  clubHistoryContainer: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
  },
  clubHistoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clubHistoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  clubHistoryContent: {
    flex: 1,
  },
  clubHistoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  clubHistorySeason: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  clubHistoryLeague: {
    fontSize: 11,
    color: '#AAAAAA',
    textTransform: 'uppercase',
  },
  statsOverlayContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statsMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  statBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 85,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  statBoxValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  percentageContainer: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  percentageText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 999,
  },
  scannerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowColor: '#00E5FF',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  aiVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    gap: 4,
  },
  aiVerifiedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
});


