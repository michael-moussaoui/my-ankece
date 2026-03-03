import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { AnkeceLogo } from '@/components/AnkeceLogo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserIconButton } from '@/components/UserIconButton';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notificationService';
import { seedPosts } from '@/services/seedService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const ballY = useSharedValue(0);

  useEffect(() => {
    if (user) {
      seedPosts();
      
      // Subscribe to notifications to show the badge
      const unsubscribe = notificationService.subscribeToUserNotifications(user.uid, (notifs) => {
        const unread = notifs.filter(n => !n.readBy.includes(user.uid) && !n.archivedBy.includes(user.uid)).length;
        setUnreadCount(unread);
      });
      
      return () => unsubscribe();
    }
    
    ballY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -10
    );
  }, []);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ballY.value }],
  }));

  return (
    <ThemedView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(1000)} style={styles.heroContainer}>
        <Image
          source={require('@/assets/images/basketball_coach_hero.png')}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />
        
        {/* Logo Overlay */}
        <Animated.View 
          entering={FadeInDown.delay(500).duration(800)} 
          style={[styles.logoContainer, { top: insets.top + 10 }]}
        >
          <AnkeceLogo
            style={styles.logo}
          />
        </Animated.View>

        {/* Header Icons (Notifications & User) */}
        <Animated.View 
          entering={FadeInDown.delay(700).duration(800)} 
          style={[styles.headerIconsContainer, { top: insets.top + 20 }]}
        >
          {user && unreadCount > 0 && (
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
              <IconSymbol name="bell.fill" size={28} color="#fff" />
              <View style={[styles.badge, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
              </View>
            </TouchableOpacity>
          )}
          <UserIconButton color="#fff" size={32} />
        </Animated.View>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Floating Ball Icon */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.titleWrapper}>
          <Animated.View style={ballStyle}>
            <IconSymbol name="basketball" size={40} color={tintColor} />
          </Animated.View>
          <ThemedText type="title" style={styles.title}>{t('home.title')}</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(800)}>
          <ThemedText style={styles.subtitle}>
            {t('home.subtitle')}
          </ThemedText>
        </Animated.View>

        <View style={styles.features}>
          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={[styles.featureCard, { backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5' }]}>
            <IconSymbol name="paperplane.fill" size={24} color={tintColor} />
            <View style={styles.featureTextWrapper}>
              <ThemedText type="defaultSemiBold">{t('home.feature1_title')}</ThemedText>
              <ThemedText style={styles.featureDesc}>{t('home.feature1_desc')}</ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800).duration(800)} style={[styles.featureCard, { backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5' }]}>
            <IconSymbol name="star.fill" size={24} color={tintColor} />
            <View style={styles.featureTextWrapper}>
              <ThemedText type="defaultSemiBold">{t('home.feature2_title')}</ThemedText>
              <ThemedText style={styles.featureDesc}>{t('home.feature2_desc')}</ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={[styles.featureCard, { backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5' }]}>
            <IconSymbol name="map.fill" size={24} color={tintColor} />
            <View style={styles.featureTextWrapper}>
              <ThemedText type="defaultSemiBold">{t('home.feature3_title')}</ThemedText>
              <ThemedText style={styles.featureDesc}>{t('home.feature3_desc')}</ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1200).duration(800)}>
            <TouchableOpacity 
              style={[styles.featureCard, { backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5' }]}
              onPress={() => router.push('/coach' as any)}
            >
              <IconSymbol name="person.2.fill" size={24} color={tintColor} />
              <View style={styles.featureTextWrapper}>
                <ThemedText type="defaultSemiBold">{t('home.feature4_title')}</ThemedText>
                <ThemedText style={styles.featureDesc}>{t('home.feature4_desc')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Call to Action */}
        <Animated.View entering={FadeInUp.delay(1000).duration(1000)} style={styles.ctaWrapper}>
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/basket-demo')}
          >
            <ThemedText style={styles.ctaText}>{t('home.cta')}</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: '45%',
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    flex: 1,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  logoContainer: {
    position: 'absolute',
    left: -20,
    width: 120,
    height: 90,
    zIndex: 10,
  },
  logo: {
    flex: 1,
  },
  headerIconsContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 18,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    lineHeight: 26,
    marginTop: 8,
  },
  features: {
    gap: 16,
    marginVertical: 20,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    alignItems: 'center',
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureDesc: {
    fontSize: 14,
    opacity: 0.6,
  },
  ctaWrapper: {
    width: '100%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
