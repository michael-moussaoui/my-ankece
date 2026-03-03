import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SportType, TemplateFilterProps } from '@/types/template';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

// Configuration des sports avec leurs icônes
const SPORTS_CONFIG: { type: SportType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'all', label: 'Tous', icon: 'apps' },
  { type: 'football', label: 'Football', icon: 'football' },
  { type: 'basketball', label: 'Basketball', icon: 'basketball' },
  { type: 'tennis', label: 'Tennis', icon: 'tennisball' },
  { type: 'rugby', label: 'Rugby', icon: 'american-football' },
  { type: 'handball', label: 'Handball', icon: 'hand-left' },
  { type: 'volleyball', label: 'Volleyball', icon: 'baseball' },
  { type: 'athletics', label: 'Athlétisme', icon: 'fitness' },
  { type: 'swimming', label: 'Natation', icon: 'water' },
  { type: 'cycling', label: 'Cyclisme', icon: 'bicycle' },
];

/**
 * Composant de filtrage par sport
 */
export const SportFilter: React.FC<TemplateFilterProps> = ({
  selectedSport,
  onSelectSport,
  showPremiumFilter = true,
  showPremiumOnly = false,
  onTogglePremium,
}) => {
  const colorScheme = useColorScheme();
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]} testID="sport-filter">
      {/* Filtres par sport */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SPORTS_CONFIG.map((sport) => {
          const isSelected = selectedSport === sport.type;
          
          return (
            <TouchableOpacity
              key={sport.type}
              testID={`sport-filter-${sport.type}`}
              style={[
                styles.sportChip, 
                { backgroundColor: backgroundSecondary },
                isSelected && { backgroundColor: Colors[colorScheme].tint }
              ]}
              onPress={() => onSelectSport(sport.type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={sport.icon}
                size={18}
                color={isSelected ? '#fff' : textSecondary}
              />
              <ThemedText style={[styles.sportLabel, isSelected && styles.sportLabelSelected]}>
                {sport.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtre Premium */}
      {showPremiumFilter && onTogglePremium && (
        <View style={[styles.premiumFilter, { borderTopColor: borderColor }]}>
          <View style={styles.premiumFilterLeft}>
            <Ionicons name="star" size={16} color="#00E5FF" />
            <ThemedText style={styles.premiumFilterText}>Premium uniquement</ThemedText>
          </View>
          <Switch
            testID="premium-filter-toggle"
            value={showPremiumOnly}
            onValueChange={onTogglePremium}
            trackColor={{ false: backgroundSecondary, true: Colors[colorScheme].tint }}
            thumbColor={showPremiumOnly ? '#fff' : '#f4f3f4'}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sportLabelSelected: {
    color: '#fff',
  },
  premiumFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  premiumFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
