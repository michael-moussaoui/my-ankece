import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { contentService, Drill } from '@/services/contentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DrillViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { accentColor: orangeColor } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<Drill | null>(null);

  useEffect(() => {
    if (id) loadDrill();
  }, [id]);

  const loadDrill = async () => {
    try {
      const data = await contentService.getDrillById(id!);
      setDrill(data);
    } catch (error) {
      console.error('Error loading drill:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !drill) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={orangeColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>{drill.title.toUpperCase()}</ThemedText>
            <Text style={styles.headerSub}>{drill.duration} • {t(`academy.difficulty.${drill.difficulty.toLowerCase()}`).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.videoContainer}>
          <Video
            source={{ uri: drill.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
          />
        </View>

        <ScrollView contentContainerStyle={styles.details}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t('academy.instructions')}</ThemedText>
            <ThemedText style={styles.description}>{drill.description || t('academy.noInstructions')}</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t('academy.tagsLabel')}</ThemedText>
            <View style={styles.tagRow}>
              {drill.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.coachFooter}>
            <Ionicons name="shield-checkmark" size={24} color={orangeColor} />
            <Text style={styles.certifiedText}>{t('academy.certified')}</Text>
          </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    zIndex: 10,
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#050505',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  details: {
    padding: 24,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#AAA',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  tagText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '900',
  },
  coachFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#050505',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111',
  },
  certifiedText: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
