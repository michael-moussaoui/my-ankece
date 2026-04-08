import { BASKETBALL_TEMPLATES } from '@/constants/basketballTemplate';
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
  FadeInLeft,
  LightSpeedInRight,
  PinwheelIn,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SectionRendererProps {
  templateId?: string;
  section: BasketballTemplateSection;
  playerData: BasketballPlayerData;
  theme: BasketballTemplate['theme'];
  isPlaying?: boolean;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

/**
 * Composant pour afficher une section du template avec les données du joueur avec animations CapCut-style
 */
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
    width: '100%',
    height: '100%',
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
  textZone: {
    position: 'absolute',
    padding: 10,
    zIndex: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
  },
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  neumorphismContainer: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    zIndex: 10,
  },
  neumorphismLight: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -10, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  neumorphismDark: {
    shadowColor: '#8E9AAF', // Darker for better visibility
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  neumorphicItem: {
    backgroundColor: '#F0F2F5',
    borderRadius: 22,
    padding: 12,
    marginVertical: 8,
    // Clear white light shadow (top-left)
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -10, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 3, // Very slight elevation for general depth on Android
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)', // Simulated light edge for Android
  },
  neumorphicItemInner: {
    borderRadius: 22,
    // Strong dark shadow (bottom-right)
    shadowColor: '#8E9AAF', // Deeper blue-grey for more contrast
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.03)', // Subtle defining edge
  },
  neumorphicRecessed: {
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    // Inset-like dark shadow
    shadowColor: '#8E9AAF',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 2,
  },
  profileCard: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 24,
    // Dark shadow (bottom-right) for neumorphism
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 12,
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowRadius: 3,
  },
  profileLogoHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  profileLogo: {
    width: 60,
    height: 60,
  },
  profileLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  profileItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  profileLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  strengthsContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  strengthsTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 1,
  },
  strengthsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strengthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievementsContainer: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  achievementYearBox: {
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    marginRight: 15,
    minWidth: 50,
    alignItems: 'center',
  },
  achievementYear: {
    fontSize: 16,
    fontWeight: '900',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  achievementComp: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trophyIcon: {
    marginLeft: 10,
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
  contactContainer: {
    position: 'absolute',
    top: '15%',
    left: '8%',
    right: '8%',
    bottom: '10%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 30,
    textAlign: 'center',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  contactGrid: {
    width: '100%',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  contactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactTextContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
    opacity: 0.8,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  contactFooter: {
    marginTop: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    width: '60%',
    alignItems: 'center',
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
  paperTearContainer: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 50,
    zIndex: 20,
  },
  paperTearImage: {
    width: '100%',
    height: '100%',
  },
  overlayEffect: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 100,
  },
  fireContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  fireOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  fireGlow: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 40,
    opacity: 0.4,
    shadowRadius: 50,
    shadowOpacity: 1,
    elevation: 20,
  },
  tearOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  tearPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  tearPanelTop: {
    top: 0,
  },
  tearPanelBottom: {
    bottom: 0,
  },
  paperTexture: {
    flex: 1,
  },
  jaggedEdgeContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  jaggedEdgeContainerBottom: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
  },
});

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  templateId = 'basketball-classic-nba',
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
  const tearAnim = useSharedValue(0);
  const isElitePro = playerData.tier === 'pro' || templateId?.includes('-pro') || templateId?.includes('champions') || templateId?.includes('neon') || templateId?.includes('cinematic') || templateId?.includes('brand');
  const isElite = isElitePro || section.id.includes('ai-');
  const isEssentiel = ['basketball-classic-nba', 'basketball-street-ball', 'basketball-clean-pro'].includes(templateId || '');
  
  // Find current template for specific assets
  const currentTemplate = React.useMemo(() => 
    BASKETBALL_TEMPLATES.find(t => t.id === templateId), 
    [templateId]
  );

  // Initialiser les lecteurs vidéo
  // En mode preview/demo, on essaie d'alterner les clips si plusieurs sont fournis
  const videoIndex = section.id.includes('-2') ? 1 : 0;
  
  const offensivePlayer = useVideoPlayer(
    section.type === 'offensive' && (playerData.offensiveVideos?.[videoIndex] || section.backgroundVideo)
      ? (playerData.offensiveVideos?.[videoIndex]?.uri || section.backgroundVideo)
      : (section.type === 'offensive' && playerData.offensiveVideos?.[0] ? playerData.offensiveVideos[0].uri : null),
    (player) => {
      if (player) {
        player.loop = true;
        player.muted = false;
        if (isPlaying) player.play();
      }
    }
  );

  const defensivePlayer = useVideoPlayer(
    section.type === 'defensive' && (playerData.defensiveVideos?.[videoIndex] || section.backgroundVideo)
      ? (playerData.defensiveVideos?.[videoIndex]?.uri || section.backgroundVideo)
      : (section.type === 'defensive' && playerData.defensiveVideos?.[0] ? playerData.defensiveVideos[0].uri : null),
    (player) => {
      if (player) {
        player.loop = true;
        player.muted = false;
        if (isPlaying) player.play();
      }
    }
  );

  // Helper for image sources (local or remote)
  const getImageSource = (uri: string | number | undefined) => {
    if (!uri) return { uri: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png' };
    return typeof uri === 'number' ? uri : { uri };
  };

  // Trigger animations on section change or play
  useEffect(() => {
    // Intense dynamic Flash effect based on transition type
    if (section.transitionEffect === 'flash') {
        flashOpacity.value = withSequence(
            withTiming(1, { duration: 50 }),
            withTiming(0, { duration: 150 }),
            withTiming(0.8, { duration: 50 }),
            withTiming(0, { duration: 200 })
        );
    } else if (section.transitionEffect === 'glitch') {
        flashOpacity.value = withSequence(
            withTiming(0.6, { duration: 40 }),
            withTiming(0, { duration: 40 }),
            withTiming(0.4, { duration: 40 }),
            withTiming(0, { duration: 40 })
        );
    } else {
        flashOpacity.value = withSequence(
            withTiming(0.2, { duration: 200 }),
            withTiming(0, { duration: 400 })
        );
    }

    // Ken Burns effect
    zoomValue.value = 1;
    if (section.transitionEffect === 'zoom') {
        zoomValue.value = withTiming(1.25, { duration: section.duration });
    } else {
        zoomValue.value = withTiming(1.08, { duration: section.duration });
    }

    // Scanner animation for Premium (disabled for contact)
    if (isElitePro && section.type !== 'contact') {
        scannerY.value = 0;
        scannerY.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            true
        );
    }

    // Paper Tear Effect
    if (section.transitionEffect === 'paper-tear') {
        tearAnim.value = 0;
        tearAnim.value = withTiming(1, { duration: 1200 });
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

    if (section.type === 'offensive' && offensivePlayer && (playerData.offensiveVideos?.[0] || section.backgroundVideo)) {
        controlPlayer(offensivePlayer, isPlaying);
    }
    if (section.type === 'defensive' && defensivePlayer && (playerData.defensiveVideos?.[0] || section.backgroundVideo)) {
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
  }, [section.id, isPlaying, section.duration, templateId, isElitePro]);

  const animatedPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomValue.value }],
  }));

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const animatedTearTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -SCREEN_HEIGHT * 0.5 * tearAnim.value }],
    opacity: tearAnim.value > 0.95 ? 0 : 1,
  }));

  const animatedTearBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: SCREEN_HEIGHT * 0.5 * tearAnim.value }],
    opacity: tearAnim.value > 0.95 ? 0 : 1,
  }));

  const animatedScannerStyle = useAnimatedStyle(() => ({
    opacity: (isElitePro && section.type !== 'contact') ? 0.7 : 0,
  }));

  const animatedFireStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.7, { duration: 1200 }), -1, true),
    transform: [
        { scale: withRepeat(withTiming(1.15, { duration: 2500 }), -1, true) },
        { translateY: withRepeat(withTiming(-5, { duration: 1800 }), -1, true) }
    ]
  }));

  const getFieldValue = (field: keyof BasketballPlayerData | 'custom', label?: string): string => {
    if (field === 'custom') return label ? t(label) : '';
    const value = playerData[field];
    if (field === 'currentClub' && typeof value === 'object') return (value as ClubInfo).clubName;
    if (field === 'height' && value) return `${value} cm`;
    if (field === 'weight' && value) return `${value} kg`;
    if (field === 'dominantHand' && value) return t(`cv.options.lateralization.${value}`, String(value));
    return value === null || value === undefined ? '' : String(value);
  };

  const renderBackground = () => {
    const bg = <View style={[StyleSheet.absoluteFillObject, { backgroundColor: templateId === 'basketball-clean-pro' ? theme.background : (section.backgroundColor || theme.background) }]} />;
    
    // Custom Section Background Image (User Request)
    if (section.backgroundImage) {
        return (
            <View style={StyleSheet.absoluteFillObject}>
                {bg}
                <Image 
                    source={getImageSource(typeof section.backgroundImage === 'object' ? (section.backgroundImage as any).uri : section.backgroundImage)} 
                    style={[
                        StyleSheet.absoluteFillObject, 
                        { opacity: templateId?.includes('fire') ? 1.0 : 0.35 },
                        (templateId?.includes('fire') && (section.type === 'achievements' || section.id === 'stats' || section.id === 'achievements')) && { width: '130%', left: '-15%', top: '-25%', position: 'absolute' }
                    ]} 
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Essentiel profile: template thumbnail as background (e.g. Warriors court)
    if (isEssentiel && section.type === 'profile') {
        if (templateId === 'basketball-clean-pro') return bg; // Force solid background for Neumorphism
        
        if (currentTemplate?.thumbnail) {
            return (
                <View style={StyleSheet.absoluteFillObject}>
                    {bg}
                    <Image 
                        source={getImageSource(currentTemplate.thumbnail)} 
                        style={[StyleSheet.absoluteFillObject, { opacity: 0.35 }]} 
                        resizeMode="cover"
                    />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                </View>
            );
        }
    }
    
    return bg;
  };
  const getEnteringAnim = (baseDelay: number, baseDuration = 800) => {
    switch (section.transitionEffect) {
      case 'slide': return SlideInRight.delay(baseDelay).duration(baseDuration).springify();
      case 'zoom': return ZoomIn.delay(baseDelay).duration(baseDuration).springify();
      case 'flash': return LightSpeedInRight.delay(baseDelay).duration(baseDuration * 0.7);
      case 'glitch': return PinwheelIn.delay(baseDelay).duration(baseDuration * 0.8);
      case 'blur': return FadeIn.delay(baseDelay).duration(baseDuration);
      case 'paper-tear': return FadeIn.delay(baseDelay + 300).duration(baseDuration);
      case 'fade':
      default: return FadeIn.delay(baseDelay).duration(baseDuration);
    }
  };

  const renderPhoto = () => {
    if (section.type === 'intro' || section.type === 'contact') return null;
    if (!section.layout.photoPosition || !playerData.profilePhoto) return null;
    const { x, y, width, height } = section.layout.photoPosition;

    return (
      <Animated.View 
        entering={getEnteringAnim(0, 800)}
        style={[
          styles.photoContainer,
          { left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` },
        ]}
      >
        <AnimatedImage
          source={getImageSource(playerData.profilePhoto.uri)}
          style={[styles.photo, animatedPhotoStyle]}
          resizeMode="cover"
        />
        {isElitePro && (
            <Animated.View style={[styles.scannerLine, animatedScannerStyle, { backgroundColor: theme.primary }]} />
        )}
      </Animated.View>
    );
  };

  const renderVideo = () => {
    if (!section.layout.videoPosition) return null;
    const { x, y, width, height } = section.layout.videoPosition;

    let player = null;
    if (section.type === 'offensive' && (playerData.offensiveVideos?.[0] || section.backgroundVideo) && offensivePlayer) player = offensivePlayer;
    else if (section.type === 'defensive' && (playerData.defensiveVideos?.[0] || section.backgroundVideo) && defensivePlayer) player = defensivePlayer;

    return (
      <Animated.View
        entering={getEnteringAnim(200, 600)}
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
    if (section.type === 'intro') return null;
    return section.layout.textZones.map((zone, index) => {
      const text = zone.label || getFieldValue(zone.field, zone.label);
      if (!text) return null;

      return (
        <Animated.Text
          key={zone.id}
          entering={getEnteringAnim(300 + index * 100, 800)}
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
                  <Text style={styles.aiVerifiedText}>{t('cv.ai_verified')}</Text>
              </View>
          )}
        </Animated.Text>
      );
    });
  };
  
  const renderStats = () => {
    if (section.type !== 'stats' && section.id !== 'stats') return null;
    if (!playerData.stats) return null;
    const { pointsPerGame = 0, reboundsPerGame = 0, assistsPerGame = 0 } = playerData.stats;

    let containerStyle: any = styles.statsOverlayContainer;
    let titleStyle: any = [styles.statsMainTitle, { color: theme.accent }];
    let boxStyle: any = [styles.statBox, { backgroundColor: theme.background + 'B3', borderColor: theme.primary, borderWidth: 2 }];
    let valueStyle: any = [styles.statBoxValue, { color: theme.text }];
    let labelStyle: any = [styles.statBoxLabel, { color: theme.accent }];
    let percentStyle: any = [styles.percentageContainer, { backgroundColor: theme.primary }];
    let percentText: any = [styles.percentageText, { color: theme.text }];

    if (templateId === 'basketball-street-ball') {
       boxStyle = [styles.statBox, { backgroundColor: '#111', borderColor: theme.accent, borderWidth: 4, transform: [{ rotate: '-3deg' }], shadowColor: theme.primary, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }];
       titleStyle = [styles.statsMainTitle, { color: theme.primary, textTransform: 'uppercase', fontSize: 28, textShadowColor: '#FFF', textShadowOffset: { width: 1, height: 1}, textShadowRadius: 0 }];
    } else if (templateId === 'basketball-clean-pro') {
       boxStyle = [
           styles.statBox, 
           styles.neumorphismDark,
           { 
               backgroundColor: theme.background, 
               borderWidth: 0, 
               borderRadius: 20,
               padding: 10,
               minWidth: 90,
               elevation: 6
           }
       ];
       titleStyle = [styles.statsMainTitle, { color: '#000', fontSize: 16, letterSpacing: 4, fontWeight: '300' }];
       valueStyle = [styles.statBoxValue, { color: '#000', fontWeight: '800' }];
       labelStyle = [styles.statBoxLabel, { color: '#666', letterSpacing: 1, fontWeight: '700' }];
       percentStyle = [styles.percentageContainer, { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEE' }];
       percentText = [styles.percentageText, { color: '#333' }];
    } else if (templateId === 'basketball-fire-mode') {
        containerStyle = [styles.statsOverlayContainer, { marginTop: 150 }];
        boxStyle = [styles.statBox, { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0 }];
        titleStyle = [styles.statsMainTitle, { color: '#FFF', textTransform: 'uppercase', fontSize: 24, letterSpacing: 8, fontWeight: '900', marginBottom: 20 }];
        valueStyle = [styles.statBoxValue, { color: '#FFD700', fontSize: 36, fontWeight: '900', textShadowColor: 'rgba(255, 0, 0, 0.8)', textShadowRadius: 15 }];
        labelStyle = [styles.statBoxLabel, { color: '#FF4500', fontWeight: '900', letterSpacing: 2 }];
        percentStyle = [styles.percentageContainer, { backgroundColor: 'transparent', borderTopWidth: 1, borderTopColor: 'rgba(255, 215, 0, 0.4)', borderRadius: 0, marginTop: 20 }];
        percentText = [styles.percentageText, { color: '#FFD700', fontWeight: '700', letterSpacing: 1 }];
    } else if (templateId === 'basketball-neon-city') {
       boxStyle = [styles.statBox, { backgroundColor: 'rgba(0,0,0,0.8)', borderColor: theme.primary, borderWidth: 2, borderRadius: 0, shadowColor: theme.primary, shadowRadius: 15, shadowOpacity: 1 }];
       titleStyle = [styles.statsMainTitle, { color: '#FFF', textShadowColor: theme.primary, textShadowRadius: 10, fontFamily: 'monospace' }];
       valueStyle = [styles.statBoxValue, { color: '#FFF', textShadowColor: theme.accent, textShadowRadius: 10 }];
    } else if (templateId === 'basketball-cinematic') {
       titleStyle = [styles.statsMainTitle, { color: '#FFF', fontSize: 12, letterSpacing: 10 }];
       boxStyle = [styles.statBox, { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0 }];
       valueStyle = [styles.statBoxValue, { color: '#FFF', fontSize: 40, fontWeight: 'serif' }];
       labelStyle = [styles.statBoxLabel, { color: theme.primary, letterSpacing: 4, fontSize: 10 }];
       percentStyle = [styles.percentageContainer, { backgroundColor: 'transparent', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', borderRadius: 0 }];
       percentText = [styles.percentageText, { color: '#AAA', letterSpacing: 2, fontSize: 10 }];
    }

    return (
        <View style={containerStyle}>
            <Animated.Text entering={FadeInDown.delay(200).springify()} style={titleStyle}>
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
                        style={[
                            templateId === 'basketball-clean-pro' && styles.neumorphismLight,
                            templateId === 'basketball-clean-pro' && { borderRadius: 20 }
                        ]}
                    >
                        <View style={boxStyle}>
                            <Text style={valueStyle}>{stat.val || '-'}</Text>
                            <Text style={labelStyle}>{stat.label}</Text>
                        </View>
                    </Animated.View>
                ))}
            </View>

            {(playerData.stats.fieldGoalPercentage || playerData.stats.threePointPercentage || playerData.stats.freeThrowPercentage) && (
                <Animated.View 
                    entering={FadeIn.delay(1000)}
                    style={percentStyle}
                >
                    <Text style={percentText}>
                        {playerData.stats.fieldGoalPercentage ? `${t('cv.form.steps.stats.fg')}: ${playerData.stats.fieldGoalPercentage}%` : ''}
                        {playerData.stats.threePointPercentage ? ` • 3PT: ${playerData.stats.threePointPercentage}%` : ''}
                        {playerData.stats.freeThrowPercentage ? ` • ${t('cv.free_throws', 'FT')}: ${playerData.stats.freeThrowPercentage}%` : ''}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
  };

  const renderClubHistory = () => {
    if (section.id !== 'history' || !playerData.clubHistory.length) return null;

    return (
      <View style={styles.clubHistoryContainer}>
        {playerData.clubHistory.slice(0, 4).map((club, index) => (
          <Animated.View 
            key={index} 
            entering={getEnteringAnim(200 + index * 150, 600)}
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

  const renderAchievements = () => {
    if (section.id !== 'achievements' && section.type !== 'achievements' && section.type !== 'palmares') return null;
    if (!playerData.achievements?.length) return null;

    return (
      <View style={[styles.achievementsContainer, templateId === 'basketball-fire-mode' && { width: '60%', left: '5%', right: 'auto', alignItems: 'flex-start' }]}>
        {playerData.achievements.slice(0, 5).map((ach, index) => (
          <Animated.View 
            key={index} 
            entering={getEnteringAnim(300 + index * 150, 600)}
            style={[
              styles.achievementCard, 
              { backgroundColor: theme.background + 'CC', borderColor: theme.accent },
              templateId === 'basketball-fire-mode' && { backgroundColor: 'transparent', borderColor: 'rgba(255, 69, 0, 0.6)', borderWidth: 2 }
            ]}
          >
            <View style={styles.achievementYearBox}>
              <Text style={[styles.achievementYear, { color: theme.primary }]}>{ach.year}</Text>
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle} numberOfLines={1}>{ach.title}</Text>
              {ach.competition && <Text style={[styles.achievementComp, { color: theme.accent }]}>{ach.competition}</Text>}
            </View>
            <Ionicons name="trophy" size={20} color={theme.primary} style={styles.trophyIcon} />
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderPaperTear = () => {
    if (section.transitionEffect !== 'paper-tear') return null;

    const jaggedPath = "M0 0 L20 10 L40 0 L60 10 L80 0 L100 10 L120 0 L140 10 L160 0 L180 10 L200 0 L220 10 L240 0 L260 10 L280 0 L300 10 L320 0 L340 10 L360 0 L380 10 L400 0 V50 H0 Z";

    return (
      <View style={styles.tearOverlayLayer} pointerEvents="none">
        <Animated.View style={[styles.tearPanel, styles.tearPanelTop, animatedTearTopStyle]}>
          <View style={[styles.paperTexture, { backgroundColor: '#FDFDFD' }]} />
          <View style={styles.jaggedEdgeContainer}>
            <Svg height="20" width="100%" viewBox="0 0 400 20" preserveAspectRatio="none">
              <Path d={jaggedPath} fill="#FDFDFD" />
            </Svg>
          </View>
        </Animated.View>

        <Animated.View style={[styles.tearPanel, styles.tearPanelBottom, animatedTearBottomStyle]}>
          <View style={styles.jaggedEdgeContainerBottom}>
            <Svg height="20" width="100%" viewBox="0 0 400 10" preserveAspectRatio="none" style={{ transform: [{ scaleY: -1 }] }}>
              <Path d={jaggedPath} fill="#FDFDFD" />
            </Svg>
          </View>
          <View style={[styles.paperTexture, { backgroundColor: '#FDFDFD' }]} />
        </Animated.View>
      </View>
    );
  };

  const renderContact = () => {
    if (section.type !== 'contact' && section.id !== 'contact' && section.id !== 'outro') return null;

    const contactItems = [
      { id: 'email', icon: 'mail-outline', value: playerData.email, label: 'Email' },
      { id: 'phone', icon: 'call-outline', value: playerData.phone, label: t('cv.form.phone') },
      { id: 'instagram', icon: 'logo-instagram', value: playerData.instagram, label: 'Instagram' },
      { id: 'tiktok', icon: 'logo-tiktok', value: playerData.tiktok, label: 'TikTok' },
      { id: 'twitter', icon: 'logo-twitter', value: playerData.twitter, label: 'Twitter / X' },
    ].filter(item => item.value);

    if (contactItems.length === 0) {
      // Fallback if no contact info
      contactItems.push({ id: 'cta', icon: 'basketball-outline', value: `${playerData.firstName} ${playerData.lastName}`, label: 'PRO SPECT' });
    }

    return (
      <View style={styles.contactContainer}>
        <Animated.Text 
            entering={FadeInDown.delay(200)}
            style={[styles.contactTitle, { color: theme.primary, textShadowColor: theme.secondary }]}
        >
            {section.title || t('cv.form.contact_title') || 'CONTACT'}
        </Animated.Text>
        
        <View style={styles.contactGrid}>
            {contactItems.map((item, index) => (
                <Animated.View 
                    key={item.id}
                    entering={getEnteringAnim(400 + index * 100, 500)}
                    style={[styles.contactItem, { backgroundColor: theme.background + 'AA', borderColor: theme.primary + '44' }]}
                >
                    <View style={[styles.contactIconCircle, { backgroundColor: theme.primary + '22' }]}>
                        <Ionicons name={item.icon as any} size={22} color={theme.primary} />
                    </View>
                    <View style={styles.contactTextContent}>
                        <Text style={[styles.contactLabel, { color: theme.accent }]}>{item.label}</Text>
                        <Text style={[styles.contactValue, { color: theme.text }]} numberOfLines={1}>{item.value}</Text>
                    </View>
                </Animated.View>
            ))}
        </View>

        <Animated.View 
            entering={FadeIn.delay(1000)}
            style={[styles.contactFooter, { borderTopColor: theme.primary + '33' }]}
        >
            <Text style={{ color: theme.text, opacity: 0.6, fontSize: 10, letterSpacing: 2 }}>POWERED BY MY-ANKECE</Text>
        </Animated.View>
      </View>
    );
  };

  // Animated styles for overlays
  const lightleakStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.8, { duration: 1000 }), -1, true),
    transform: [{ scale: withRepeat(withTiming(1.5, { duration: 1500 }), -1, true) }]
  }));

  const grainStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.08, { duration: 50 }), -1, true)
  }));

  const renderOverlayEffect = () => {
    if (!section.overlayEffect || section.overlayEffect === 'none') return null;

    switch (section.overlayEffect) {
      case 'flames':
          return (
            <View style={[StyleSheet.absoluteFillObject, { zIndex: 11 }]} pointerEvents="none">
              <AnimatedImage 
                source={getImageSource('file:///C:/Users/33699/.gemini/antigravity/brain/36ddbe65-c101-4fff-a6d6-16c484a84f19/cinematic_basketball_fire_overlay_1774468645234.png')} 
                style={[styles.fireOverlay, animatedFireStyle]} 
                resizeMode="cover"
              />
              {/* Bottom fire glow */}
              <View style={[styles.fireGlow, { backgroundColor: theme.primary, shadowColor: theme.primary }]} />
            </View>
          );
      case 'grain':
        return (
          <Animated.View 
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent', zIndex: 10 }]} 
            pointerEvents="none"
          >
             {/* Fast pulsing opacity to simulate film grain noise */}
             <Animated.View 
               style={[
                 StyleSheet.absoluteFillObject, 
                 { backgroundColor: '#000' },
                 grainStyle
               ]} 
             />
          </Animated.View>
        );
      case 'lightleak':
        return null;
      case 'vignette':
        return (
          <View 
            style={[
              StyleSheet.absoluteFillObject, 
              { 
                zIndex: 12,
                borderWidth: 100,
                borderColor: 'rgba(0,0,0,0.3)',
                borderRadius: 0,
              }
            ]} 
          />
        );
      default:
        return null;
    }
  };

  const renderProfile = () => {
    if (section.type !== 'profile') return null;

    let cardStyle: any = [styles.profileCard, { backgroundColor: theme.background + 'E6', borderColor: theme.primary }];
    let titleStyle: any = [styles.profileTitle, { color: theme.primary }];
    let labelStyle: any = [styles.profileLabel, { color: '#888' }];
    let valueStyle: any = [styles.profileValue, { color: theme.text }];
    let titleText = t('cv.form.player_profile') || 'PLAYER PROFILE';

    if (templateId === 'basketball-clean-pro') {
       cardStyle = [
           styles.profileCard, 
           styles.neumorphismDark,
           { 
               backgroundColor: theme.background, 
               borderWidth: 0,
               borderRadius: 40,
               paddingHorizontal: 15,
               paddingVertical: 15,
               elevation: 10,
           }
       ];
       titleStyle = [styles.profileTitle, { color: '#000', fontSize: 16, letterSpacing: 4, fontWeight: '300', marginBottom: 15, textShadowOpacity: 0 }];
       valueStyle = [styles.profileValue, { color: '#000', fontSize: 14, fontWeight: '800' }];
       labelStyle = [styles.profileLabel, { color: '#666', letterSpacing: 0.5, fontWeight: '800', fontSize: 8 }];
    } else if (isEssentiel && templateId !== 'basketball-street-ball') {
        cardStyle = [
            styles.profileCard, 
            { 
                backgroundColor: 'rgba(255,255,255,0.12)', 
                borderColor: 'rgba(255,255,255,0.4)', 
                borderWidth: 1.5,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 12,
            }
        ];
        titleStyle = [styles.profileTitle, { color: theme.primary, textTransform: 'uppercase', letterSpacing: 5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }];
        valueStyle = [styles.profileValue, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }];
        labelStyle = [styles.profileLabel, { color: 'rgba(255,255,255,0.8)', fontWeight: '800' }];
    } else if (templateId === 'basketball-street-ball') {
        cardStyle = [
            styles.profileCard, 
            { 
                backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                borderColor: 'rgba(255, 255, 255, 0.3)', 
                borderWidth: 1.5,
                borderRadius: 24,
            }
        ];
        titleStyle = [styles.profileTitle, { color: theme.primary, textTransform: 'uppercase', letterSpacing: 2, textShadowColor: '#FFF', textShadowRadius: 2 }];
        valueStyle = [styles.profileValue, { color: '#FFF' }];
        labelStyle = [styles.profileLabel, { color: theme.primary, fontWeight: '900' }];
    } else if (templateId === 'basketball-fire-mode') {
        cardStyle = [
            styles.profileCard, 
            { 
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                borderColor: 'rgba(255, 69, 0, 0.6)', 
                // borderWidth: 3.5,
                borderRadius: 24,
                // shadowColor: '#FF4500',
                shadowRadius: 20,
                shadowOpacity: 0.4,
                elevation: 0,
            }
        ];
        titleStyle = [styles.profileTitle, { color: '#FFD700', textTransform: 'uppercase', letterSpacing: 4, fontWeight: '900', textShadowColor: 'rgba(255, 69, 0, 0.8)', textShadowRadius: 15 }];
        titleText = 'FIRE ANALYTICS';
        valueStyle = [styles.profileValue, { color: '#FFF', fontWeight: '900', textShadowColor: 'rgba(255, 69, 0, 0.5)', textShadowRadius: 5 }];
        labelStyle = [styles.profileLabel, { color: '#FFD700', opacity: 0.9, fontWeight: '800' }];
    } else if (templateId === 'basketball-neon-city') {
    } else if (templateId === 'basketball-ice-cold') {
        cardStyle = [
            styles.profileCard, 
            { 
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderColor: 'rgba(0, 229, 255, 0.3)', 
                borderWidth: 3.5,
                borderRadius: 24,
                shadowColor: '#00E5FF',
                shadowRadius: 20,
                shadowOpacity: 0.1,
                elevation: 0,
            }
        ];
        titleStyle = [styles.profileTitle, { color: '#00E5FF', textTransform: 'uppercase', letterSpacing: 4, fontWeight: '700', textShadowColor: 'rgba(0, 229, 255, 0.5)', textShadowRadius: 10 }];
        titleText = 'COLD ANALYTICS';
        valueStyle = [styles.profileValue, { color: '#FFF', fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }];
        labelStyle = [styles.profileLabel, { color: '#FFF', opacity: 0.9, fontWeight: '700' }];
    } else if (templateId === 'basketball-cinematic') {
       cardStyle = [styles.profileCard, { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0 }];
       titleStyle = [styles.profileTitle, { color: '#FFF', fontSize: 12, letterSpacing: 10, alignSelf: 'center' }];
       valueStyle = [styles.profileValue, { color: '#FFF', fontSize: 20, fontWeight: 'serif' }];
    }

    const renderProfileItem = (icon: any, label: string, value: string, isLast = false) => {
        if (templateId === 'basketball-clean-pro') {
            return (
                <View style={[styles.neumorphicItem, { width: '47%', marginBottom: 10, padding: 8, height: 70, justifyContent: 'center' }]}>
                    <View style={styles.neumorphicItemInner}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Ionicons name={icon} size={14} color={theme.accent} style={{ marginRight: 5 }} />
                            <Text style={[labelStyle, { flex: 1 }]} numberOfLines={1}>{label.toUpperCase()}</Text>
                        </View>
                        <Text style={valueStyle} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                    </View>
                </View>
            );
        }
        return (
            <View style={styles.profileItem}>
                <Ionicons 
                    name={icon} 
                    size={18} 
                    color={templateId === 'basketball-neon-city' ? '#00FFFF' : (templateId === 'basketball-ice-cold' ? '#00E5FF' : (templateId === 'basketball-fire-mode' ? '#FFD700' : theme.accent))} 
                    style={(templateId === 'basketball-neon-city' || templateId === 'basketball-ice-cold' || templateId === 'basketball-fire-mode') && { 
                        textShadowColor: templateId === 'basketball-neon-city' ? '#00FFFF' : (templateId === 'basketball-ice-cold' ? '#00E5FF' : '#FF4500'), 
                        textShadowRadius: 8 
                    }}
                />
                <View>
                    <Text style={labelStyle}>{label}</Text>
                    <Text style={valueStyle}>{value}</Text>
                </View>
            </View>
        );
    };

    const CardComponent = Animated.View;
    const cardProps = {
        entering: getEnteringAnim(400, 800),
        style: cardStyle,
    };

    return (
      <View style={[
        styles.neumorphismContainer, 
        templateId === 'basketball-clean-pro' && styles.neumorphismLight, 
        { borderRadius: 40 }
      ]}>
        <CardComponent {...cardProps as any}>
            <View style={[styles.profileLogoHeader, templateId === 'basketball-clean-pro' && { marginBottom: 15 }]}>
                <View style={[
                    templateId === 'basketball-clean-pro' ? styles.neumorphicRecessed : styles.profileLogoPlaceholder,
                    templateId === 'basketball-clean-pro' && { padding: 10, borderRadius: 20 },
                    templateId === 'basketball-ice-cold' && { borderColor: '#00E5FF', backgroundColor: 'rgba(255,255,255,0.1)' }
                ]}>
                    {playerData.currentClub?.clubLogo?.uri ? (
                        <Image 
                            source={getImageSource(playerData.currentClub.clubLogo.uri)} 
                            style={[styles.profileLogo, templateId === 'basketball-clean-pro' && { width: 50, height: 50 }]} 
                            resizeMode="contain" 
                        />
                    ) : (
                        <Ionicons name="basketball" size={32} color={theme.accent} />
                    )}
                </View>
            </View>
            
            <View style={[styles.profileGrid, templateId === 'basketball-clean-pro' && { gap: 0, justifyContent: 'space-between' }]}>
                {renderProfileItem("basketball-outline", t('cv.form.position') || 'Position', getFieldValue('position') as string)}
                {renderProfileItem("resize-outline", t('cv.form.height') || 'Height', getFieldValue('height') as string)}
                {renderProfileItem("calendar-outline", t('cv.form.age') || 'Age', getFieldValue('age') as string)}
                {renderProfileItem("hand-right-outline", t('cv.form.dominant_hand') || 'Dominant Hand', getFieldValue('dominantHand') as string)}
                {renderProfileItem("trophy-outline", t('cv.form.category') || 'Category', (playerData.currentClub?.category || 'SENIOR') as string)}
                {renderProfileItem("analytics-outline", t('cv.form.level') || 'Level', (playerData.currentClub?.league || 'NAT') as string)}
                {renderProfileItem("barbell-outline", t('cv.form.weight') || 'Weight', getFieldValue('weight') as string)}
            </View>

            {playerData.strengths && playerData.strengths.length > 0 && (
                <View style={[styles.strengthsContainer, templateId === 'basketball-clean-pro' && { borderTopWidth: 0, marginTop: 10 }]}>
                    <Text style={[{...StyleSheet.flatten(labelStyle), marginBottom: 15, fontWeight: '800'}] as any}>{t('cv.form.strengths') || 'STRENGTHS'}</Text>
                    <View style={styles.strengthsList}>
                        {playerData.strengths.map((str, idx) => (
                            <View key={idx} style={[
                                templateId === 'basketball-clean-pro' ? styles.neumorphicItem : styles.strengthBadge,
                                templateId === 'basketball-clean-pro' && { paddingVertical: 6, paddingHorizontal: 12, marginVertical: 0, borderRadius: 10 },
                                templateId !== 'basketball-clean-pro' && { backgroundColor: theme.primary + '33', borderColor: theme.primary }
                            ]}>
                                <View style={templateId === 'basketball-clean-pro' ? styles.neumorphicItemInner : {}}>
                                    <Text style={[styles.strengthText, valueStyle, {fontSize: 11}]}>{t(`cv.options.strengths.${str}`, str)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </CardComponent>
      </View>
    );
  };

  const renderIntro = () => {
    if (section.type !== 'intro') return null;

    const clubName = typeof playerData.currentClub === 'object' && playerData.currentClub.clubName ? playerData.currentClub.clubName : 'FREE AGENT';
    const jerseyNumber = typeof playerData.currentClub === 'object' && playerData.currentClub.number ? `#${playerData.currentClub.number}` : '#00';
    const season = typeof playerData.currentClub === 'object' && playerData.currentClub.season ? playerData.currentClub.season : '2025/2026';

    const isEssentiel = ['basketball-classic-nba', 'basketball-street-ball', 'basketball-clean-pro'].includes(templateId || '');
    const isElite = ['basketball-fire-mode', 'basketball-ice-cold', 'basketball-galaxy'].includes(templateId || '');
    // Default to Pro if not specified explicitly

    // ----------------------------------------------------------------
    // PACK ESSENTIEL : Keep it BASIC. No crazy rotations, clean UI
    // ----------------------------------------------------------------
    if (isEssentiel) {
       return (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }]}>
              {/* Photo on right side */}
              <AnimatedImage entering={FadeIn.duration(1000)} source={getImageSource(playerData.profilePhoto?.uri)} style={{ position: 'absolute', right: 0, bottom: '15%', width: '70%', height: '80%' }} resizeMode="contain" />
              
              {/* Medium Number on Left Empty Space */}
              <Animated.View entering={FadeInLeft.delay(300).duration(800).springify()} style={{ position: 'absolute', top: '12%', left: '8%', zIndex: 5 }}>
                 <Text style={{ color: theme.primary, fontSize: 85, fontWeight: '900', letterSpacing: -2, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 8, textShadowOffset: { width: 3, height: 3 } }}>{jerseyNumber}</Text>
              </Animated.View>

              {/* Intro Block (Bottom Left) */}
              <Animated.View entering={FadeInDown.duration(800).delay(200)} style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: theme.secondary, paddingHorizontal: 30, paddingVertical: 20, borderTopColor: theme.primary, borderTopWidth: 4, zIndex: 10 }}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                     <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 2, color: theme.primary }}>{clubName.toUpperCase()}</Text>
                     <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, opacity: 0.7 }}>{season}</Text>
                 </View>
                 <Text style={{ fontSize: 36, fontWeight: '200', color: theme.text, letterSpacing: 1 }} numberOfLines={1} adjustsFontSizeToFit>{playerData.firstName} <Text style={{ fontWeight: '800' }}>{playerData.lastName}</Text></Text>
              </Animated.View>
          </View>
       );
    }
    
    // ----------------------------------------------------------------
    // PACK ELITE : Intermediate Sophistication
    // ----------------------------------------------------------------
    if (isElite) {
       return (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }]}>
             {/* Photo behind footer fully down */}
             <AnimatedImage entering={FadeIn.duration(800)} source={getImageSource(playerData.profilePhoto?.uri)} style={{position: 'absolute', bottom: 0, right: 0, width: '80%', height: '85%', opacity: 1, zIndex: 1 }} resizeMode="contain" />
             
             {/* Text Block top-left positioned higher */}
             <Animated.View entering={ZoomIn.duration(500).springify()} style={{ position: 'absolute', top: '8%', left: 10, backgroundColor: theme.primary, padding: 15, borderWidth: 3, borderColor: theme.secondary, shadowColor: theme.accent, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, maxWidth: '50%', zIndex: 10 }}>
                <Text style={{ fontSize: 30, fontWeight: '900', color: theme.background, textTransform: 'uppercase', letterSpacing: 1 }} numberOfLines={1} adjustsFontSizeToFit>{playerData.firstName}</Text>
                <Text style={{ fontSize: 40, fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: -1, marginTop: -5 }} numberOfLines={1} adjustsFontSizeToFit>{playerData.lastName}</Text>
             </Animated.View>

             {/* Footer with slight horizontal margins acting as floating dock */}
             <Animated.View entering={SlideInLeft.delay(300).springify()} style={{ position: 'absolute', bottom: 10, left: 10, right: 10, height: 90, backgroundColor: theme.secondary, borderTopWidth: 4, borderColor: theme.primary, borderRadius: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                 <View style={{ flex: 1, alignItems: 'flex-start', paddingRight: 10 }}>
                     <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }}>TEAM</Text>
                     <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' }} numberOfLines={2} adjustsFontSizeToFit>{clubName}</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                     <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }}>{season}</Text>
                     <Text style={{ color: theme.text, fontSize: 26, fontWeight: '900', textTransform: 'uppercase' }}>{jerseyNumber}</Text>
                 </View>
             </Animated.View>
          </View>
       );
    }

    // ----------------------------------------------------------------
    // PACK ELITE PRO : Max Sophistication (Cinematic / Premium Panini look)
    // ----------------------------------------------------------------
    return (
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }]}>
        <AnimatedImage entering={FadeIn.duration(2000)} source={getImageSource(playerData.profilePhoto?.uri)} style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }} />
        
        {/* Letterbox styles */}
        <View style={{ position: 'absolute', top: 0, width: '100%', height: '15%', backgroundColor: theme.secondary, zIndex: 10 }} />
        <View style={{ position: 'absolute', bottom: 0, width: '100%', height: '15%', backgroundColor: theme.secondary, zIndex: 10 }} />
        
        {/* Top Info */}
        <Animated.Text entering={FadeInDown.delay(100)} style={{ position: 'absolute', top: 12, width: '100%', textAlign: 'center', color: theme.text, letterSpacing: 8, fontSize: 12, fontWeight: '400', zIndex: 15, opacity: 0.8 }}>
            {season} SEASON
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(300)} style={{ position: 'absolute', top: 40, width: '100%', alignItems: 'center', zIndex: 15 }}>
            <View style={{ backgroundColor: theme.primary, paddingHorizontal: 25, paddingVertical: 8, borderRadius: 30, transform: [{ scale: 0.9 }] }}>
                <Text style={{ color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 4 }}>{jerseyNumber}</Text>
            </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(800).duration(2000)} style={{ position: 'absolute', bottom: '18%', left: 0, width: '100%', alignItems: 'center', zIndex: 15 }}>

            <Text style={{ color: theme.accent, fontSize: 40, fontWeight: '400', letterSpacing: 2, textAlign: 'center', marginTop: 5, textShadowColor: '#000', textShadowRadius: 10 }}>{playerData.firstName.toUpperCase()}</Text>
            <Text style={{ color: theme.text, fontSize: 60, fontWeight: '800', letterSpacing: 6, textAlign: 'center', marginTop: -5, textShadowColor: '#000', textShadowRadius: 15 }}>{playerData.lastName.toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25, gap: 15 }}>
               <View style={{ height: 1, width: 40, backgroundColor: theme.primary }} />
               <Text style={{ color: theme.primary, fontSize: 14, letterSpacing: 8, fontWeight: 'bold' }}>{clubName.toUpperCase()}</Text>
               <View style={{ height: 1, width: 40, backgroundColor: theme.primary }} />
            </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container} testID={`section-${section.id}`}>
      {renderBackground()}
      {renderIntro()}
      {renderPhoto()}
      {renderVideo()}
      {renderTextZones()}
      {renderProfile()}
      {renderClubHistory()}
      {renderAchievements()}
      {renderStats()}
      {renderContact()}
      {renderPaperTear()}
      {renderOverlayEffect()}

      {/* Flash Transition Layout */}
      <Animated.View 
        pointerEvents="none"
        style={[styles.flashOverlay, animatedFlashStyle]} 
      />
    </View>
  );
};
