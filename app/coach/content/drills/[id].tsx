import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { contentService, Drill } from '@/services/contentService';
import { cloudinaryService } from '@/services/cloudinaryService';

export default function EditDrillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { accentColor: orangeColor } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    tags: '',
  });

  useEffect(() => {
    if (id) {
      loadDrill();
    }
  }, [id]);

  const loadDrill = async () => {
    try {
      const data = await contentService.getDrillById(id!);
      if (data) {
        setForm({
          title: data.title,
          description: data.description || '',
          videoUrl: data.videoUrl,
          duration: data.duration,
          difficulty: data.difficulty,
          tags: data.tags.join(', '),
        });
      } else {
        Alert.alert(t('common.error'), t('academy.alerts.notFound'));
        router.back();
      }
    } catch (error) {
      console.error('Error loading drill:', error);
      Alert.alert(t('common.error'), t('common.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('academy.alerts.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploading(true);
      try {
        const videoUrl = await cloudinaryService.uploadVideo(result.assets[0].uri);
        setForm({ ...form, videoUrl });
        Alert.alert(t('common.success'), t('academy.alerts.uploadSuccess'));
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert(t('common.error'), t('academy.alerts.uploadError'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.videoUrl) {
      Alert.alert(t('common.error'), t('academy.alerts.fillRequired'));
      return;
    }

    setSaving(true);
    try {
      await contentService.updateDrill(id!, {
        title: form.title,
        description: form.description,
        videoUrl: form.videoUrl,
        duration: form.duration || '5:00',
        difficulty: form.difficulty,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      Alert.alert(t('common.success'), t('academy.alerts.saveSuccess'));
      router.back();
    } catch (error) {
      console.error('Error updating drill:', error);
      Alert.alert(t('common.error'), t('academy.alerts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('academy.editDrill', 'MODIFIER DRILL')}</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('academy.form.title')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('academy.form.placeholders.drillTitle')}
              placeholderTextColor="#444"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('academy.form.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('academy.form.placeholders.drillDesc')}
              placeholderTextColor="#444"
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('academy.form.videoUrl')}</Text>
            <View style={styles.videoInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('academy.form.placeholders.videoUrl')}
                placeholderTextColor="#444"
                value={form.videoUrl}
                onChangeText={(text) => setForm({ ...form, videoUrl: text })}
              />
              <TouchableOpacity 
                style={[styles.uploadBtn, { backgroundColor: orangeColor }]}
                onPress={pickAndUploadVideo}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={24} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>{t('academy.form.duration')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('academy.form.placeholders.duration')}
                placeholderTextColor="#444"
                value={form.duration}
                onChangeText={(text) => setForm({ ...form, duration: text })}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
              <Text style={styles.label}>{t('academy.form.difficulty')}</Text>
              <View style={styles.difficultyContainer}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.diffBadge,
                      form.difficulty === level && { backgroundColor: orangeColor }
                    ]}
                    onPress={() => setForm({ ...form, difficulty: level })}
                  >
                    <Text style={[
                      styles.diffText,
                      form.difficulty === level && { color: '#000' }
                    ]}>
                      {level[0].toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('academy.form.tags')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('academy.form.placeholders.tags')}
              placeholderTextColor="#444"
              value={form.tags}
              onChangeText={(text) => setForm({ ...form, tags: text })}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: orangeColor }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>{t('academy.saveDrill')}</Text>
                <Ionicons name="checkmark-circle" size={24} color="#000" />
              </>
            )}
          </TouchableOpacity>
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  videoInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  diffBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  diffText: {
    color: '#666',
    fontWeight: '900',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 18,
  },
});
