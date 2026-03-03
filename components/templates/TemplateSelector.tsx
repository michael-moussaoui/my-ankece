import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_TEMPLATES } from '@/constants/mockTemplates';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SportTemplate, SportType, TemplateSelectorProps } from '@/types/template';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SportFilter } from './SportFilter';
import { TemplateCard } from './TemplateCard';

/**
 * Composant principal pour sélectionner un template sportif
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  selectedSport: initialSport = 'all',
  showPremiumOnly: initialShowPremiumOnly = false,
  onPreview,
}) => {
  const [selectedSport, setSelectedSport] = useState<SportType>(initialSport);
  const [showPremiumOnly, setShowPremiumOnly] = useState(initialShowPremiumOnly);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Filtrer les templates selon les critères
  const filteredTemplates = useMemo(() => {
    let templates = MOCK_TEMPLATES;

    // Filtrer par sport
    if (selectedSport !== 'all') {
      templates = templates.filter(t => t.sport === selectedSport);
    }

    // Filtrer par premium
    if (showPremiumOnly) {
      templates = templates.filter(t => t.isPremium);
    }

    // Trier par popularité
    return templates.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [selectedSport, showPremiumOnly]);

  const handleSelectTemplate = (template: SportTemplate) => {
    setSelectedTemplateId(template.id);
    onSelectTemplate(template);
  };

  const handleTogglePremium = () => {
    setShowPremiumOnly(!showPremiumOnly);
  };

  // État vide
  const renderEmptyState = () => (
    <View style={styles.emptyState} testID="empty-state">
      <Ionicons name="images-outline" size={64} color={textSecondary} />
      <ThemedText style={styles.emptyStateTitle}>Aucun template disponible</ThemedText>
      <ThemedText style={styles.emptyStateText}>
        {showPremiumOnly
          ? 'Aucun template premium pour ce sport'
          : 'Aucun template trouvé pour ce sport'}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container} testID="template-selector">
      {/* Filtres */}
      <SportFilter
        selectedSport={selectedSport}
        onSelectSport={setSelectedSport}
        showPremiumFilter={true}
        showPremiumOnly={showPremiumOnly}
        onTogglePremium={handleTogglePremium}
      />

      {/* Liste des templates */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            onSelect={() => handleSelectTemplate(item)}
            onPreview={onPreview ? () => onPreview(item) : undefined}
            isSelected={selectedTemplateId === item.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
