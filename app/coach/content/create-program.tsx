import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cloudinaryService } from '@/services/cloudinaryService';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { contentService, Drill } from '@/services/contentService';

export default function CreateProgramScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { accentColor: orangeColor } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [fetchingDrills, setFetchingDrills] = useState(true);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    weeksCount: '',
    difficulty: 'intermediate',
    thumbnailUrl: '',
  });

  useEffect(() => {
    loadDrills();
  }, []);

  const loadDrills = async () => {
    try {
      const data = await contentService.getCoachDrills(user!.uid);
      setDrills(data);
    } catch (error) {
      console.error('Error loading drills:', error);
    } finally {
      setFetchingDrills(false);
    }
  };

  const toggleDrill = (id: string) => {
    setSelectedDrills(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const pickAndUploadThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('academy.alerts.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingThumbnail(true);
      try {
        const imageUrl = await cloudinaryService.uploadImage(result.assets[0].uri);
        setForm({ ...form, thumbnailUrl: imageUrl });
        Alert.alert(t('common.success'), t('academy.alerts.uploadSuccess'));
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert(t('common.error'), t('academy.alerts.uploadError'));
      } finally {
        setIsUploadingThumbnail(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.title || selectedDrills.length === 0) {
      Alert.alert(t('common.error'), t('academy.alerts.fillProgram'));
      return;
    }

    setLoading(true);
    try {
      await contentService.createProgram({
        coachId: user!.uid,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        currency: '€',
        weeksCount: parseInt(form.weeksCount) || 1,
        difficulty: form.difficulty,
        thumbnailUrl: form.thumbnailUrl || 'https://via.placeholder.com/300x200',
        drills: selectedDrills,
        status: 'published', // Automatically publish for now
      });
      Alert.alert(t('common.success'), t('academy.alerts.saveSuccess'));
      router.back();
    } catch (error) {
      console.error('Error creating program:', error);
      Alert.alert(t('common.error'), t('academy.alerts.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('academy.createProgram').toUpperCase()}</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('academy.form.title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('academy.form.placeholders.programTitle')}
                placeholderTextColor="#444"
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('academy.form.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('academy.form.placeholders.programDesc')}
                placeholderTextColor="#444"
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('academy.form.price')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('academy.form.placeholders.price')}
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(text) => setForm({ ...form, price: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                <Text style={styles.label}>{t('academy.form.weeksCount')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('academy.form.placeholders.weeks')}
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  value={form.weeksCount}
                  onChangeText={(text) => setForm({ ...form, weeksCount: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('academy.form.thumbnailUrl')}</Text>
              <View style={styles.thumbnailContainer}>
                {form.thumbnailUrl ? (
                  <View style={styles.previewWrapper}>
                    <Image source={{ uri: form.thumbnailUrl }} style={styles.thumbnailPreview} />
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => setForm({ ...form, thumbnailUrl: '' })}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF0000" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadBtn} 
                    onPress={pickAndUploadThumbnail}
                    disabled={isUploadingThumbnail}
                  >
                    {isUploadingThumbnail ? (
                      <ActivityIndicator color={orangeColor} />
                    ) : (
                      <>
                        <Ionicons name="image" size={32} color="#444" />
                        <Text style={styles.uploadBtnText}>{t('academy.form.placeholders.thumbnail')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 8 }]}
                  placeholder={t('academy.form.placeholders.thumbnail')}
                  placeholderTextColor="#444"
                  value={form.thumbnailUrl}
                  onChangeText={(text) => setForm({ ...form, thumbnailUrl: text })}
                />
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.inputGroup}>
              <View style={styles.drillHeader}>
                <Text style={styles.label}>{t('academy.selectDrills', { count: selectedDrills.length })}</Text>
                {fetchingDrills && <ActivityIndicator size="small" color={orangeColor} />}
              </View>
              
              {drills.length === 0 && !fetchingDrills ? (
                <Text style={styles.emptyDrillsText}>{t('academy.alerts.noDrills')}</Text>
              ) : (
                <View style={styles.drillsList}>
                  {drills.map((drill) => (
                    <TouchableOpacity
                      key={drill.id}
                      style={[
                        styles.drillItem,
                        selectedDrills.includes(drill.id!) && { borderColor: orangeColor, backgroundColor: '#111' }
                      ]}
                      onPress={() => toggleDrill(drill.id!)}
                    >
                      <Ionicons 
                        name={selectedDrills.includes(drill.id!) ? "checkbox" : "square-outline"} 
                        size={20} 
                        color={selectedDrills.includes(drill.id!) ? orangeColor : '#444'} 
                      />
                      <Text style={[
                        styles.drillTitle,
                        selectedDrills.includes(drill.id!) && { color: orangeColor }
                      ]}>
                        {drill.title}
                      </Text>
                      <Text style={styles.drillMeta}>{drill.duration}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: orangeColor }]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>{t('academy.publishProgram')}</Text>
                  <Ionicons name="flash" size={24} color="#000" />
                </>
              )}
            </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    gap: 12,
  },
  previewWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  uploadBtn: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: {
    color: '#444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drillsList: {
    gap: 12,
    marginTop: 8,
  },
  drillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    gap: 12,
  },
  drillTitle: {
    flex: 1,
    color: '#DDD',
    fontWeight: 'bold',
  },
  drillMeta: {
    color: '#666',
    fontSize: 12,
  },
  emptyDrillsText: {
    color: '#444',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 20,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 18,
  },
});
