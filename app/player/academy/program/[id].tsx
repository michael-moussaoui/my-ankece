import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnkeceLogo } from '@/components/AnkeceLogo';
import { MockStripeModal } from '@/components/MockStripeModal';
import { UserIconButton } from '@/components/UserIconButton';
import { ProgramViewer } from '@/components/academy/ProgramViewer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { contentService, Drill, TrainingProgram } from '@/services/contentService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { accentColor: orangeColor } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [isOwned, setIsOwned] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadProgram();
  }, [id, user]);

  const loadProgram = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const programData = await contentService.getProgramById(id);
      if (programData) {
        setProgram(programData);
        // On récupère aussi les exercices du programme
        const programDrills = await contentService.getDrillsByIds(programData.drills);
        setDrills(programDrills);

        // Vérifier si l'utilisateur possède le programme
        if (user) {
          const owned = await contentService.checkAccess(user.uid, id);
          setIsOwned(owned);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveProgramImage = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return require('@/assets/images/academy/confidence_cover.png');
    if (thumbnailUrl.startsWith('http')) return { uri: thumbnailUrl };
    
    // Mapping local pour les programmes par défaut
    if (thumbnailUrl.includes('confidence_cover') || thumbnailUrl.includes('confidence_basket_boost_cover_new')) {
      return require('@/assets/images/academy/confidence_cover.png');
    }
    if (thumbnailUrl.includes('confidence_boost') || thumbnailUrl.includes('confidence_basket')) {
      return require('@/assets/images/academy/confidence_cover.png');
    }
    
    // Fallback
    return require('@/assets/images/academy/confidence_cover.png');
  };

  const handleUnlock = () => {
    setShowPayment(true);
  };

  const handlePurchaseSuccess = async () => {
    if (!user || !id) return;
    try {
      await contentService.recordPurchase(user.uid, id, 'program');
      setIsOwned(true);
      setShowPayment(false);
    } catch (err) {
      console.error("Error confirming purchase:", err);
    }
  };

  const renderDrillItem = ({ item }: { item: Drill }) => (
    <TouchableOpacity 
      style={styles.drillCard}
      onPress={() => router.push(`/player/academy/drill/${item.id}` as any)}
    >
      <ImageBackground
        source={{ uri: item.thumbnailUrl }}
        style={styles.drillThumbnail}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.drillDuration}>
          <Text style={styles.drillDurationText}>{item.duration} min</Text>
        </View>
      </ImageBackground>
      <View style={styles.drillInfo}>
        <ThemedText style={styles.drillTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.drillDifficulty}>{item.difficulty}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  if (loading || !program) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={orangeColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {isOwned ? (
        <View style={{ height: 80 + insets.top, paddingTop: insets.top, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { marginTop: 0, marginLeft: 0 }]}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <AnkeceLogo style={{ width: 220, height: 66 }} />
          
          <UserIconButton size={28} color="#FFF" />
        </View>
      ) : (
        <ImageBackground 
          source={resolveProgramImage(program.thumbnailUrl)} 
          style={styles.hero}
        >
          <SafeAreaView style={[styles.heroOverlay, { paddingTop: insets.top }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, width: '100%', position: 'absolute', top: insets.top + 10 }}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <AnkeceLogo style={{ width: 220, height: 66 }} />
              
              <UserIconButton size={28} color="#FFF" />
            </View>
            
            <View style={{ flex: 1 }} />

            <View style={[styles.badge, { backgroundColor: orangeColor }]}>
              <Text style={styles.badgeText}>{program.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={styles.mainTitle}>{program.title}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.metaIconText}>
                <Ionicons name="calendar-outline" size={18} color={orangeColor} />
                <Text style={styles.heroMetaText}>{program.weeksCount} {t('academy.weeks')}</Text>
              </View>
              <View style={styles.metaIconText}>
                <Ionicons name="stats-chart-outline" size={18} color={orangeColor} />
                <Text style={styles.heroMetaText}>{program.difficulty}</Text>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      )}

      <View style={[styles.content, isOwned && { padding: 0, marginTop: 0 }]}>
        {isOwned && program.modules && program.modules.length > 0 ? (
          <ProgramViewer 
            programId={id!} 
            userId={user!.uid}
            modules={program.modules} 
            onDrillPress={(drillId) => router.push(`/player/academy/drill/${drillId}` as any)}
          />
        ) : (
          <>
            <View style={styles.descSection}>
              <ThemedText style={styles.sectionTitle}>{t('academy.synopsis')}</ThemedText>
              <ThemedText style={styles.description}>{program.description}</ThemedText>
            </View>

            <View style={styles.listHeader}>
              <ThemedText style={styles.sectionTitle}>{t('academy.curriculum')}</ThemedText>
              {!isOwned && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>{program.price > 0 ? `${program.price.toFixed(2)}${program.currency}` : t('academy.free')}</Text>
                </View>
              )}
            </View>

            <FlatList
              data={drills}
              renderItem={renderDrillItem}
              keyExtractor={(item) => item.id!}
              contentContainerStyle={styles.drillList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListFooterComponent={<View style={{ height: 100 }} />}
            />
          </>
        )}
      </View>

      {!isOwned && (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
          <TouchableOpacity 
            style={[styles.unlockBtn, { backgroundColor: orangeColor }]}
            onPress={handleUnlock}
          >
            <Text style={styles.unlockBtnText}>{t('academy.unlockAccess')}</Text>
            <Ionicons name="flash" size={24} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {showPayment && (
        <MockStripeModal
          visible={showPayment}
          onCancel={() => setShowPayment(false)}
          onSuccess={handlePurchaseSuccess}
          amount={program.price * 100}
          currency={program.currency}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    height: 350,
  },
  backButton: {
    marginLeft: 20,
    marginTop: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  badgeText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 38,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 16,
  },
  descSection: {
    marginBottom: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#AAA',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceRow: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  priceValue: {
    color: '#FFF',
    fontWeight: '900',
  },
  drillList: {
    gap: 16,
    paddingBottom: 20,
  },
  drillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  drillThumbnail: {
    width: 80,
    height: 60,
    marginRight: 16,
  },
  drillDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  drillDurationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  drillInfo: {
    flex: 1,
  },
  drillTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  drillDifficulty: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  playSmallBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  lockedBtn: {
    backgroundColor: '#050505',
    borderColor: '#111',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  unlockBtn: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  unlockBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  }
});
