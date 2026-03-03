import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SportTemplate } from '@/types/template';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TemplateCardProps {
  template: SportTemplate;
  onSelect: () => void;
  onPreview?: () => void;
  isSelected?: boolean;
}

/**
 * Carte pour afficher un template dans la galerie
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  isSelected = false,
}) => {
  const colorScheme = useColorScheme();
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const { accentColor } = useAppTheme();

  return (
    <TouchableOpacity
      testID={`template-card-${template.id}`}
      style={[
        styles.card, 
        { backgroundColor: Colors[colorScheme].card },
        isSelected && { borderColor: accentColor, borderWidth: 2 }
      ]}
      onPress={onSelect}
      accessibilityState={{ selected: isSelected }}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbnailContainer, { backgroundColor: backgroundSecondary }]}>
        <Image
          testID={`template-thumbnail-${template.id}`}
          source={{ uri: template.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Badge Premium */}
        {template.isPremium && (
          <View 
            testID={`premium-badge-${template.id}`}
            style={styles.premiumBadge}
          >
            <Ionicons name="star" size={16} color="#00E5FF" />
            <ThemedText style={[styles.premiumText, { color: accentColor }]}>Premium</ThemedText>
          </View>
        )}

        {/* Bouton Preview */}
        {onPreview && (
          <TouchableOpacity
            testID={`preview-button-${template.id}`}
            style={styles.previewButton}
            onPress={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Ionicons name="play-circle" size={32} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Informations */}
      <View style={styles.info}>
        <ThemedText type="defaultSemiBold" style={styles.name} numberOfLines={1}>
          {template.name}
        </ThemedText>
        <ThemedText style={styles.description} numberOfLines={2}>
          {template.description}
        </ThemedText>
        
        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <View style={styles.tags}>
            {template.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: backgroundSecondary }]}>
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Indicateur de sélection */}
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color={accentColor} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '600',
  },
  previewButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
    opacity: 0.7,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    opacity: 0.8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
});
