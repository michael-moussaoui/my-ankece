import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Text,
  Image,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  connected: boolean;
}

export default function IntegrationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFF' : '#111';
  const textSecondary = isDark ? '#888' : '#666';

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 'homecourt', name: 'HomeCourt', icon: 'basketball', description: t('analytics.integrations.homecourt_desc'), color: '#FF4500', connected: false },
    { id: 'hudl', name: 'Hudl', icon: 'videocam', description: t('analytics.integrations.hudl_desc'), color: '#EF4444', connected: true },
    { id: 'apple', name: 'Apple Health', icon: 'heart', description: t('analytics.integrations.apple_desc'), color: '#FF2D55', connected: false },
    { id: 'catapult', name: 'Catapult', icon: 'stats-chart', description: t('analytics.integrations.catapult_desc'), color: '#000000', connected: false },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(item => 
      item.id === id ? { ...item, connected: !item.connected } : item
    ));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{t('analytics.integrations.title')}</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <ThemedText style={styles.subtitle}>{t('analytics.integrations.subtitle')}</ThemedText>
          
          {integrations.map((item, index) => (
            <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.info}>
                <ThemedText style={styles.name}>{item.name}</ThemedText>
                <Text style={[styles.desc, { color: textSecondary }]}>{item.description}</Text>
              </View>
              <Switch 
                value={item.connected} 
                onValueChange={() => toggleIntegration(item.id)}
                trackColor={{ true: tintColor }}
              />
            </View>
          ))}

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color={tintColor} />
            <Text style={[styles.infoText, { color: textSecondary }]}>
              {t('analytics.integrations.security_info')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  title: { fontSize: 20, fontWeight: '900' },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  
  content: { padding: 20 },
  subtitle: { opacity: 0.6, marginBottom: 24, fontSize: 15 },

  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 16, gap: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '800' },
  desc: { fontSize: 13, fontWeight: '500' },

  infoBox: { flexDirection: 'row', gap: 12, padding: 20, backgroundColor: 'rgba(150,150,150,0.05)', borderRadius: 16, marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
