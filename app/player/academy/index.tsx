import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { UserIconButton } from '@/components/UserIconButton';
import { contentService, TrainingProgram } from '@/services/contentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', icon: 'grid' },
  { id: 'shooting', icon: 'basketball' },
  { id: 'handles', icon: 'fitness' },
  { id: 'physical', icon: 'barbell' },
  { id: 'tactical', icon: 'analytics' },
];

export default function InvasionStoreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { accentColor: orangeColor } = useAppTheme();
  
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const data = await contentService.getPublishedPrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Error loading store:', error);
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

  const renderCategoryItem = (cat: typeof CATEGORIES[0]) => (
    <TouchableOpacity 
      key={cat.id}
      onPress={() => setSelectedCategory(cat.id)}
      style={[
        styles.categoryTab, 
        selectedCategory === cat.id && { borderColor: orangeColor, backgroundColor: '#111' }
      ]}
    >
      <Ionicons 
        name={cat.id === 'all' ? 'grid' : (cat.icon as any)} 
        size={20} 
        color={selectedCategory === cat.id ? orangeColor : '#666'} 
      />
      <ThemedText style={[
        styles.categoryText, 
        selectedCategory === cat.id && { color: orangeColor, fontWeight: 'bold' }
      ]}>
        {cat.id === 'all' ? t('common.all' as any) : t(`academy.categories.${cat.id}`)}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderProgramCard = ({ item, index }: { item: TrainingProgram, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)}
      style={styles.programCard}
    >
      <ImageBackground 
        source={resolveProgramImage(item.thumbnailUrl)}
        style={styles.cardCover}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.cardOverlay}>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{item.price > 0 ? `${item.price.toFixed(2)}${item.currency}` : t('academy.free')}</Text>
          </View>
        </View>
      </ImageBackground>
      
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.programTitle}>
          {item.title.toUpperCase()}
        </ThemedText>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.metaText}>{t('academy.weeksCount', { count: item.weeksCount })}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flash-outline" size={14} color={orangeColor} />
            <Text style={[styles.metaText, { color: orangeColor }]}>
              {t(`academy.difficulty.${item.difficulty.toLowerCase()}`)}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.buyButton, { backgroundColor: orangeColor }]}
          onPress={() => router.push(`/player/academy/program/${item.id}` as any)}
        >
          <Text style={styles.buyButtonText}>{t('academy.buyNow').toUpperCase()}</Text>
          <Ionicons name="chevron-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Street Header */}
          <View style={styles.headerMinimal}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.cartButton}>
                <Ionicons name="cart-outline" size={32} color="#FFF" />
                <View style={[styles.cartBadge, { backgroundColor: orangeColor }]} />
              </TouchableOpacity>
              <UserIconButton color="#FFF" size={32} />
            </View>
          </View>

          {/* Categories Horizontal */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(renderCategoryItem)}
          </ScrollView>

          {/* Featured Title */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>PRO DROPS</ThemedText>
            <View style={[styles.titleLine, { backgroundColor: orangeColor }]} />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={orangeColor} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={programs}
              renderItem={renderProgramCard}
              keyExtractor={(item) => item.id!}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>{t('academy.noContent')}</ThemedText>
                </View>
              }
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  cartButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  titleLine: {
    width: 40,
    height: 4,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  programCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  cardCover: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  priceBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  cardContent: {
    padding: 20,
  },
  programTitle: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    fontWeight: 'bold',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    opacity: 0.5,
  }
});
