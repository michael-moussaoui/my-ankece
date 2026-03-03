import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Coach } from '@/types/coach';

interface CoachCardProps {
  coach: Coach;
  onPress: () => void;
}

export function CoachCard({ coach, onPress }: CoachCardProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const borderColor = colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA';

  const getBadgeIcon = (badge: Coach['badge']) => {
    switch (badge) {
      case 'elite': return 'star-outline';
      case 'certified': return 'checkmark-circle-outline';
      case 'pro': return 'trophy-outline';
      case 'top_rated': return 'heart-outline';
      default: return null;
    }
  };

  const getBadgeLabel = (badge: Coach['badge']) => {
    if (!badge) return '';
    return t(`coach.badges.${badge}`);
  };

  const activeBadge = coach.badge || 
    (coach.requestedBadge ? coach.requestedBadge : 
    (coach.studentCount > 5 ? 'elite' as const : 
    (coach.rating >= 4 ? 'top_rated' as const : null)));

  const isPending = !coach.badge && !!coach.requestedBadge;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={coach.photoUrl}
        style={styles.image}
        contentFit="cover"
        transition={500}
      />
      
      {activeBadge && (
        <View style={[
            styles.badgeContainer, 
            { backgroundColor: isPending ? 'rgba(150,150,150,0.8)' : tintColor }
        ]}>
          <Ionicons name={getBadgeIcon(activeBadge) as any} size={12} color="#FFF" />
          <ThemedText style={styles.badgeText}>
            {getBadgeLabel(activeBadge)}
            {isPending && ` (${t('common.loading').toLowerCase()})`}
          </ThemedText>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.name}>{coach.name}</ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{coach.rating}</ThemedText>
            <ThemedText style={styles.reviewCount}>({coach.reviewCount})</ThemedText>
          </View>
        </View>

        <View style={styles.specialties}>
          {coach.specialties.slice(0, 3).map((spec, index) => (
            <View key={spec} style={[styles.specialtyBadge, { backgroundColor: tintColor + '15' }]}>
              <ThemedText style={[styles.specialtyText, { color: tintColor }]}>
                {t(`coach.specialties.${spec}`)}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color="#8E8E93" />
            <ThemedText style={styles.infoText}>{coach.location.city}</ThemedText>
          </View>
          <ThemedText style={styles.price}>
            {coach.isFree ? (
              t('coach.profile.free')
            ) : (
              `${coach.priceRange.min}${coach.priceRange.currency} - ${coach.priceRange.max}${coach.priceRange.currency}`
            )}
            {!coach.isFree && <ThemedText style={styles.perSession}> / h</ThemedText>}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CCC5',
    paddingTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  perSession: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
});
