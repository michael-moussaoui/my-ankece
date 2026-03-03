import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Coach } from '@/types/coach';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

interface CoachUpdateDiffProps {
  current: Coach;
  pending: Partial<Coach>;
}

export const CoachUpdateDiff: React.FC<CoachUpdateDiffProps> = ({ current, pending }) => {
  const { t } = useTranslation();
  const { accentColor } = useAppTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = accentColor || Colors[colorScheme].tint;

  const renderDiffItem = (label: string, oldVal: any, newVal: any, type: 'text' | 'list' | 'boolean' | 'price' = 'text') => {
    // Check if values are actually different
    let isDifferent = false;
    if (type === 'list') {
      isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);
    } else if (type === 'price') {
      isDifferent = oldVal.min !== newVal.min || oldVal.max !== newVal.max;
    } else {
      isDifferent = oldVal !== newVal;
    }

    if (!isDifferent) return null;

    return (
      <View style={styles.diffItem}>
        <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>{label}</ThemedText>
        <View style={styles.comparisonContainer}>
          <View style={[styles.valueBox, styles.oldValueBox]}>
            <ThemedText style={styles.valueLabel}>{t('coach.admin.old_value')}</ThemedText>
            {renderValue(oldVal, type)}
          </View>
          <Ionicons name="arrow-forward" size={16} color="#888" style={styles.arrowIcon} />
          <View style={[styles.valueBox, styles.newValueBox, { borderColor: tintColor }]}>
            <ThemedText style={[styles.valueLabel, { color: tintColor }]}>{t('coach.admin.new_value')}</ThemedText>
            {renderValue(newVal, type)}
          </View>
        </View>
      </View>
    );
  };

  const renderValue = (val: any, type: 'text' | 'list' | 'boolean' | 'price') => {
    if (type === 'boolean') {
      return (
        <View style={styles.booleanRow}>
          <Ionicons 
            name={val ? "checkmark-circle" : "close-circle"} 
            size={20} 
            color={val ? "#4CD964" : "#FF3B30"} 
          />
          <ThemedText style={stylesValueText}>{val ? t('common.yes') : t('common.no')}</ThemedText>
        </View>
      );
    }
    if (type === 'list') {
      const list = Array.isArray(val) ? val : [];
      if (list.length === 0) return <ThemedText style={styles.emptyText}>-</ThemedText>;
      return (
        <View style={styles.chipContainer}>
          {list.map((item, idx) => (
            <View key={idx} style={styles.chip}>
              <ThemedText style={styles.chipText}>{item}</ThemedText>
            </View>
          ))}
        </View>
      );
    }
    if (type === 'price') {
      return (
        <ThemedText style={stylesValueText}>
          {val.min}{val.currency} - {val.max}{val.currency}
        </ThemedText>
      );
    }
    return <ThemedText style={stylesValueText}>{val || '-'}</ThemedText>;
  };

  const stylesValueText = {
    fontSize: 14,
    marginTop: 4,
  };

  const hasChanges = Object.keys(pending).some(key => {
    const k = key as keyof Coach;
    if (k === 'priceRange') return JSON.stringify(current[k]) !== JSON.stringify(pending[k]);
    if (Array.isArray(current[k])) return JSON.stringify(current[k]) !== JSON.stringify(pending[k]);
    return current[k] !== pending[k];
  });

  if (!hasChanges) {
    return (
      <View style={styles.noChangesContainer}>
        <Ionicons name="sparkles-outline" size={48} color={tintColor} />
        <ThemedText style={styles.noChangesText}>{t('coach.admin.no_changes')}</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {pending.name && renderDiffItem(t('coach.form.name'), current.name, pending.name)}
      {pending.description && renderDiffItem(t('coach.form.bio'), current.description, pending.description)}
      {pending.experienceYears !== undefined && renderDiffItem(t('coach.form.experience'), `${current.experienceYears} ans`, `${pending.experienceYears} ans`)}
      
      {pending.priceRange && renderDiffItem(t('coach.form.pricing'), current.priceRange, pending.priceRange, 'price')}
      
      {pending.specialties && renderDiffItem(
        t('coach.form.specialties'), 
        current.specialties.map(s => t(`coach.specialties.${s}`)), 
        pending.specialties.map(s => t(`coach.specialties.${s}`)), 
        'list'
      )}
      
      {pending.levels && renderDiffItem(
        t('coach.form.levels'), 
        current.levels.map(l => t(`coach.levels.${l}`)), 
        pending.levels.map(l => t(`coach.levels.${l}`)), 
        'list'
      )}

      {pending.location && (
        <>
          {renderDiffItem(t('coach.form.city'), current.location.city, pending.location.city)}
          {renderDiffItem(t('coach.form.radius'), `${current.location.radiusKm}km`, `${pending.location.radiusKm}km`)}
        </>
      )}

      {pending.qualifications && renderDiffItem(t('coach.form.qualifications'), current.qualifications, pending.qualifications, 'list')}
      {pending.pastClubs && renderDiffItem(t('coach.form.past_clubs'), current.pastClubs, pending.pastClubs, 'list')}
      {pending.philosophy && renderDiffItem(t('coach.form.philosophy'), current.philosophy, pending.philosophy)}

      {pending.isIndoor !== undefined && renderDiffItem(t('coach.form.indoor'), current.isIndoor, pending.isIndoor, 'boolean')}
      {pending.isOutdoor !== undefined && renderDiffItem(t('coach.form.outdoor'), current.isOutdoor, pending.isOutdoor, 'boolean')}
      {pending.atHome !== undefined && renderDiffItem(t('coach.form.at_home'), current.atHome, pending.atHome, 'boolean')}
      {pending.publicCourt !== undefined && renderDiffItem(t('coach.form.public_court'), current.publicCourt, pending.publicCourt, 'boolean')}
      {pending.isFree !== undefined && renderDiffItem(t('coach.form.price_free'), current.isFree, pending.isFree, 'boolean')}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  diffItem: {
    marginBottom: 20,
    backgroundColor: 'rgba(150,150,150,0.05)',
    padding: 12,
    borderRadius: 16,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 10,
    opacity: 0.9,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
    minHeight: 60,
  },
  oldValueBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  newValueBox: {
    backgroundColor: 'rgba(76, 217, 100, 0.05)',
    borderWidth: 1.5,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.6,
  },
  arrowIcon: {
    opacity: 0.3,
  },
  booleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(150,150,150,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
  },
  emptyText: {
    opacity: 0.3,
    fontStyle: 'italic',
  },
  noChangesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noChangesText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
