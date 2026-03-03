import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CoachLevel, CoachSpecialty } from '@/types/coach';

interface CoachFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export function CoachFilterModal({ visible, onClose, onApply }: CoachFilterModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';

  const [selectedSpecialties, setSelectedSpecialties] = useState<CoachSpecialty[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<CoachLevel[]>([]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100]);

  const toggleSpecialty = (spec: CoachSpecialty) => {
    setSelectedSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const toggleLevel = (lvl: CoachLevel) => {
    setSelectedLevels(prev => 
      prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
    );
  };

  const handleReset = () => {
    setSelectedSpecialties([]);
    setSelectedLevels([]);
    setBudgetRange([0, 100]);
  };

  const handleApply = () => {
    onApply({
      specialties: selectedSpecialties,
      levels: selectedLevels,
      budgetRange,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: cardBg }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">{t('coach.filters.title')}</ThemedText>
            <TouchableOpacity onPress={handleReset}>
              <ThemedText style={{ color: tintColor }}>{t('coach.filters.reset')}</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.filters.specialties')}</ThemedText>
              <View style={styles.chipGrid}>
                {Object.values(CoachSpecialty).map(spec => (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.chip,
                      selectedSpecialties.includes(spec) && { backgroundColor: tintColor, borderColor: tintColor }
                    ]}
                    onPress={() => toggleSpecialty(spec)}
                  >
                    <ThemedText style={[
                      styles.chipText,
                      selectedSpecialties.includes(spec) && { color: '#FFF', fontWeight: '700' }
                    ]}>
                      {t(`coach.specialties.${spec}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.filters.levels')}</ThemedText>
              <View style={styles.chipGrid}>
                {Object.values(CoachLevel).map(lvl => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.chip,
                      selectedLevels.includes(lvl) && { backgroundColor: tintColor, borderColor: tintColor }
                    ]}
                    onPress={() => toggleLevel(lvl)}
                  >
                    <ThemedText style={[
                      styles.chipText,
                      selectedLevels.includes(lvl) && { color: '#FFF', fontWeight: '700' }
                    ]}>
                      {t(`coach.levels.${lvl}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price section could use a RangeSlider, using buttons for now */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('coach.filters.budget')}</ThemedText>
              <View style={styles.chipGrid}>
                {[20, 40, 60, 80, 100].map(price => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.priceChip,
                      budgetRange[1] === price && { backgroundColor: tintColor, borderColor: tintColor }
                    ]}
                    onPress={() => setBudgetRange([0, price])}
                  >
                    <ThemedText style={[
                      styles.chipText,
                      budgetRange[1] === price && { color: '#FFF', fontWeight: '700' }
                    ]}>
                      {t('coach.filters.max_price', { price })}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: tintColor }]}
              onPress={handleApply}
            >
              <ThemedText style={styles.applyButtonText}>{t('coach.filters.apply')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC5',
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC5',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC5',
  },
  priceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCC5',
    minWidth: 80,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  applyButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
