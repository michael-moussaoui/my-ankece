import { ThemeToggle } from '@/components/ThemeToggle';
import { UserIconButton } from '@/components/UserIconButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ACCENT_COLORS, useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { user, updateProfile, subscribe, isSubscribing, setPlan } = useUser();
  const { logout, isAdmin } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor, setAccentColor, accentTextColor } = useAppTheme();
  const tintColor = accentColor;
  const borderColor = Colors[colorScheme].border;
  const backgroundSecondary = Colors[colorScheme].backgroundSecondary;

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    try {
      await i18n.changeLanguage(newLang);
      await AsyncStorage.setItem('user-language', newLang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const renderSettingItem = ({ 
    icon, 
    label, 
    value, 
    onPress, 
    showArrow = true, 
    isSwitch = false,
    switchValue = false,
    onSwitchChange = () => {}
  }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: borderColor }]} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: backgroundSecondary }]}>
          <IconSymbol name={icon} size={22} color={tintColor} />
        </View>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      <View style={styles.settingItemRight}>
        {value && (
          <ThemedText style={[
            styles.settingValue, 
            value === 'Elite Pro' && { color: accentColor, fontWeight: 'bold' }
          ]}>
            {value}
          </ThemedText>
        )}
        {isSwitch ? (
          <Switch 
            value={switchValue} 
            onValueChange={onSwitchChange}
            trackColor={{ false: '#767577', true: tintColor + '80' }}
            thumbColor={switchValue ? tintColor : '#f4f3f4'}
          />
        ) : (
          showArrow && <Ionicons name="chevron-forward" size={20} color="#999" />
        )}
      </View>
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <ThemedText type="title">{t('settings.title').toLowerCase()}</ThemedText>
            <UserIconButton color={Colors[colorScheme].text} size={32} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Section: Abonnement */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Abonnement</ThemedText>
            <View style={styles.sectionCard}>
              {renderSettingItem({
                icon: 'star.fill',
                label: user?.plan === 'elite-pro' ? 'Elite Pro' : 'Passer à l\'Elite Pro',
                value: user?.plan === 'elite-pro' ? 'Actif' : 'Essentiel',
                onPress: () => {
                  if (user?.plan !== 'elite-pro') {
                    subscribe('price_elite_pro_monthly'); // Placeholder Price ID
                  }
                }
              })}
              {user?.plan === 'elite-pro' && renderSettingItem({
                icon: 'arrow.counterclockwise',
                label: 'Réinitialiser mon pack (Debug)',
                onPress: () => setPlan('essential'),
                showArrow: false
              })}
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={16} color="#888" />
                <ThemedText style={styles.infoText}>
                  {user?.plan === 'elite-pro' 
                    ? 'Modifications illimitées, sans publicité.' 
                    : '1 modification par mois, publicités actives.'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section: Apparence & Langue */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Application</ThemedText>
            <View style={styles.sectionCard}>
              <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
                <View style={styles.settingItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: backgroundSecondary }]}>
                    <IconSymbol name="paintbrush.fill" size={22} color={tintColor} />
                  </View>
                  <ThemedText style={styles.settingLabel}>Thème</ThemedText>
                </View>
                <ThemeToggle />
              </View>

              {/* Couleur principale */}
              <View style={[styles.colorPickerBlock, { borderBottomColor: borderColor }]}>
                <View style={styles.settingItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: backgroundSecondary }]}>
                    <IconSymbol name="circle.fill" size={22} color={tintColor} />
                  </View>
                  <ThemedText style={styles.settingLabel}>Couleur principale</ThemedText>
                </View>
                <View style={styles.colorSwatches}>
                  {ACCENT_COLORS.map(({ value, label, darkOnly }) => {
                    const isDisabled = darkOnly && colorScheme !== 'dark';
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => !isDisabled && setAccentColor(value)}
                        style={[
                          styles.swatch,
                          { backgroundColor: value },
                          accentColor === value && styles.swatchSelected,
                          isDisabled && styles.swatchDisabled,
                        ]}
                      >
                        {accentColor === value ? (
                          <Ionicons name="checkmark" size={18} color={accentTextColor} />
                        ) : isDisabled ? (
                          <Ionicons name="moon" size={12} color="rgba(255,255,255,0.8)" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {renderSettingItem({
                icon: 'globe',
                label: t('settings.language'),
                value: i18n.language === 'fr' ? 'Français' : 'English',
                onPress: toggleLanguage
              })}
            </View>
          </View>

          {/* Section: Admin (Conditional) */}
          {isAdmin && (
            <View style={styles.section}>
               <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('settings.administration')}</ThemedText>
               <View style={styles.sectionCard}>
                  {renderSettingItem({
                    icon: 'lock.fill',
                    label: 'Tableau de bord Admin',
                    onPress: () => router.push('/(admin)')
                  })}
               </View>
            </View>
          )}

          {/* Section: Profil */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('settings.profile')}</ThemedText>
            <View style={styles.sectionCard}>
              {renderSettingItem({
                icon: 'person.fill',
                label: 'Mon Profil',
                onPress: () => router.push('/profile')
              })}
              {renderSettingItem({
                icon: 'person.2.fill',
                label: 'Mon Réseau',
                onPress: () => router.push('/network')
              })}
              {renderSettingItem({
                icon: 'bell.fill',
                label: 'Notifications',
                isSwitch: true,
                switchValue: user?.notificationsEnabled ?? false,
                onSwitchChange: (val: boolean) => updateProfile({ notificationsEnabled: val })
              })}
              {renderSettingItem({
                icon: 'list.bullet.rectangle',
                label: 'Mes Notifications',
                onPress: () => router.push('/notifications')
              })}
            </View>
          </View>

          {/* Section: Légal */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{t('legal.title')}</ThemedText>
            <View style={styles.sectionCard}>
              {renderSettingItem({
                icon: 'doc.text.fill',
                label: t('legal.mentions'),
                onPress: () => router.push('/legal/mentions' as any)
              })}
              {renderSettingItem({
                icon: 'hand.raised.fill',
                label: t('legal.cgu'),
                onPress: () => router.push('/legal/cgu' as any)
              })}
              {renderSettingItem({
                icon: 'cart.fill',
                label: t('legal.cgv'),
                onPress: () => router.push('/legal/cgv' as any)
              })}
              {renderSettingItem({
                icon: 'shield.fill',
                label: t('legal.privacy'),
                onPress: () => router.push('/legal/privacy' as any)
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>{t('settings.logout')}</ThemedText>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
        
        {isSubscribing && (
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 10 }}>Initialisation du paiement...</ThemedText>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#9991', // Subtle background for card-like feel
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#888',
  },
  logoutButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B3015',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    opacity: 0.8,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  colorPickerBlock: {
    flexDirection: 'column',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colorSwatches: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  swatchDisabled: {
    opacity: 0.4,
  },
});
