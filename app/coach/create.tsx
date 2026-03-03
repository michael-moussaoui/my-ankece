import { UserIconButton as AnkeceTopProfileButton } from '@/components/UserIconButton';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MediaPicker } from '@/components/video/MediaPicker';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cloudinaryService } from '@/services/cloudinaryService';
import { createCoachProfile, getCoachById, updateCoachProfile } from '@/services/coachService';
import { Coach, CoachLevel, CoachSpecialty } from '@/types/coach';
import { MediaAsset } from '@/types/media';
import * as ExpoLocation from 'expo-location';

const CreateCoachScreen = () => {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { accentColor } = useAppTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = accentColor;
  const borderColor = Colors[colorScheme].border;
  const cardBackground = Colors[colorScheme].card;
  const textSecondary = Colors[colorScheme].textSecondary;

  // Form State
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<CoachSpecialty[]>([]);
  const [levels, setLevels] = useState<CoachLevel[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState('10');
  const [qualifications, setQualifications] = useState('');
  const [pastClubs, setPastClubs] = useState('');
  const [philosophy, setPhilosophy] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [experienceYears, setExperienceYears] = useState('0');
  
  // Toggles
  const [isIndoor, setIsIndoor] = useState(true);
  const [isOutdoor, setIsOutdoor] = useState(true);
  const [atHome, setAtHome] = useState(false);
  const [publicCourt, setPublicCourt] = useState(true);
  const [requestedBadge, setRequestedBadge] = useState<'pro' | 'certified' | null>(null);
  const [currentBadge, setCurrentBadge] = useState<Coach['badge']>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(!!id);
  const [location, setLocation] = useState<ExpoLocation.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let currentLocation = await ExpoLocation.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (id) {
        try {
          const coach = await getCoachById(id);
          if (coach) {
            setProfilePhoto(coach.photoUrl);
            setName(coach.name);
            setBio(coach.description);
            setSpecialties(coach.specialties);
            setLevels(coach.levels);
            setPriceMin(coach.priceRange.min.toString());
            setPriceMax(coach.priceRange.max.toString());
            setCity(coach.location.city);
            setRadius(coach.location.radiusKm.toString());
            setQualifications(coach.qualifications.join(', '));
            setPastClubs(coach.pastClubs.join(', '));
            setPhilosophy(coach.philosophy);
            setIsFree(coach.isFree || false);
            setExperienceYears((coach.experienceYears || 0).toString());
            setIsIndoor(coach.isIndoor);
            setIsOutdoor(coach.isOutdoor);
            setAtHome(coach.atHome);
            setPublicCourt(coach.publicCourt);
            setRequestedBadge(coach.requestedBadge || null);
            setCurrentBadge(coach.badge || null);
          }
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    fetchCoachData();
  }, [id]);

  const toggleSpecialty = (specialty: CoachSpecialty) => {
    setSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };

  const toggleLevel = (level: CoachLevel) => {
    setLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level) 
        : [...prev, level]
    );
  };

  const handleSubmit = async () => {
    if (!profilePhoto) {
      Alert.alert(t('common.error'), t('coach.form.photo_required'));
      return;
    }

    if (!name.trim() || !bio.trim() || specialties.length === 0 || levels.length === 0 || !city.trim()) {
      Alert.alert(t('common.error'), t('cv.form.required_error'));
      return;
    }

    if (!user) {
      Alert.alert(t('common.error'), t('auth.login_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload photo to Cloudinary (only if it's a new photo)
      let photoUrl = profilePhoto;
      if (profilePhoto && !profilePhoto.startsWith('http')) {
        const uploadedUrl = await cloudinaryService.uploadImage(profilePhoto);
        if (!uploadedUrl) throw new Error('Photo upload failed');
        photoUrl = uploadedUrl;
      }

      const coachData = {
        userId: user.uid,
        name,
        photoUrl: photoUrl as string,
        description: bio,
        specialties,
        levels,
        priceRange: {
          min: parseFloat(priceMin) || 0,
          max: parseFloat(priceMax) || 0,
          currency: 'EUR'
        },
        location: {
          city,
          radiusKm: parseFloat(radius) || 10,
          latitude: location?.coords.latitude || 0,
          longitude: location?.coords.longitude || 0
        },
        qualifications: qualifications.split(',').map(q => q.trim()).filter(q => q !== ''),
        pastClubs: pastClubs.split(',').map(c => c.trim()).filter(c => c !== ''),
        philosophy,
        isIndoor,
        isOutdoor,
        atHome,
        publicCourt,
        isFree,
        requestedBadge: (id && currentBadge === requestedBadge) ? null : requestedBadge,
        experienceYears: parseInt(experienceYears) || 0,
      };

      if (id) {
        await updateCoachProfile(id, coachData);
      } else {
        await createCoachProfile(coachData);
      }

      Alert.alert(t('common.success'), id ? t('coach.form.update_success') : t('coach.form.success'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert(t('common.error'), t('coach.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">{id ? t('coach.form.edit_title') : t('coach.form.title')}</ThemedText>
          <AnkeceTopProfileButton color={Colors[colorScheme].text} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Profile Photo */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('coach.form.photo')}</ThemedText>
              {isLoadingData ? (
                <View style={[styles.photoPreviewContainer, styles.centered]}>
                  <ActivityIndicator color={tintColor} />
                </View>
              ) : profilePhoto ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
                  <TouchableOpacity 
                    style={styles.removePhotoBadge} 
                    onPress={() => setProfilePhoto(null)}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <MediaPicker 
                  mediaType="image" 
                  onMediaSelected={(asset: MediaAsset) => setProfilePhoto(asset.uri)}
                  color={tintColor}
                />
              )}
            </View>

            {/* Personal Info */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('coach.form.personal_info')}</ThemedText>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('coach.form.name')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('coach.form.name_placeholder')}
                  placeholderTextColor={textSecondary}
                />
              </View>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('coach.form.bio')}</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder={t('coach.form.bio_placeholder')}
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Expertise */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('coach.form.expertise')}</ThemedText>
              <ThemedText style={styles.label}>{t('coach.form.specialties')}</ThemedText>
              <View style={styles.chipContainer}>
                {Object.values(CoachSpecialty).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chip,
                      { borderColor },
                      specialties.includes(s) && { backgroundColor: tintColor, borderColor: tintColor }
                    ]}
                    onPress={() => toggleSpecialty(s)}
                  >
                    <ThemedText style={[styles.chipText, specialties.includes(s) && { color: '#fff', fontWeight: '700' }]}>
                      {t(`coach.specialties.${s}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={[styles.label, { marginTop: 15 }]}>{t('coach.form.experience')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="Ex: 5"
                keyboardType="numeric"
                placeholderTextColor={textSecondary}
              />

              <ThemedText style={[styles.label, { marginTop: 15 }]}>{t('coach.form.levels')}</ThemedText>
              <View style={styles.chipContainer}>
                {Object.values(CoachLevel).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[
                      styles.chip,
                      { borderColor },
                      levels.includes(l) && { backgroundColor: tintColor, borderColor: tintColor }
                    ]}
                    onPress={() => toggleLevel(l)}
                  >
                    <ThemedText style={[styles.chipText, levels.includes(l) && { color: '#fff', fontWeight: '700' }]}>
                      {t(`coach.levels.${l}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pricing & Location */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('coach.form.pricing_location')}</ThemedText>
              
              <View style={[styles.switchRow, { marginBottom: 15 }]}>
                <ThemedText style={styles.label}>{t('coach.form.price_free')}</ThemedText>
                <Switch 
                  value={isFree} 
                  onValueChange={(val) => {
                    setIsFree(val);
                    if (val) {
                      setPriceMin('0');
                      setPriceMax('0');
                    }
                  }} 
                  trackColor={{ true: tintColor }} 
                />
              </View>

              {!isFree && (
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                      <ThemedText style={styles.label}>{t('coach.form.price_min')}</ThemedText>
                      <TextInput
                          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                          value={priceMin}
                          onChangeText={setPriceMin}
                          placeholder="30"
                          keyboardType="numeric"
                          placeholderTextColor={textSecondary}
                      />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                      <ThemedText style={styles.label}>{t('coach.form.price_max')}</ThemedText>
                      <TextInput
                          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                          value={priceMax}
                          onChangeText={setPriceMax}
                          placeholder="50"
                          keyboardType="numeric"
                          placeholderTextColor={textSecondary}
                      />
                  </View>
                </View>
              )}

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 2, marginRight: 10 }]}>
                    <ThemedText style={styles.label}>{t('coach.form.city')}</ThemedText>
                    <TextInput
                        style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                        value={city}
                        onChangeText={setCity}
                        placeholder={t('coach.form.city_placeholder') || "Ex: Paris"}
                        placeholderTextColor={textSecondary}
                    />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                    <ThemedText style={styles.label}>{t('coach.form.radius')}</ThemedText>
                    <TextInput
                        style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                        value={radius}
                        onChangeText={setRadius}
                        placeholder="10"
                        keyboardType="numeric"
                        placeholderTextColor={textSecondary}
                    />
                </View>
              </View>

              <View style={styles.switchGroup}>
                <View style={styles.switchRow}>
                  <ThemedText>{t('coach.form.indoor')}</ThemedText>
                  <Switch value={isIndoor} onValueChange={setIsIndoor} trackColor={{ true: tintColor }} />
                </View>
                <View style={styles.switchRow}>
                  <ThemedText>{t('coach.form.outdoor')}</ThemedText>
                  <Switch value={isOutdoor} onValueChange={setIsOutdoor} trackColor={{ true: tintColor }} />
                </View>
                <View style={styles.switchRow}>
                  <ThemedText>{t('coach.form.at_home')}</ThemedText>
                  <Switch value={atHome} onValueChange={setAtHome} trackColor={{ true: tintColor }} />
                </View>
                <View style={styles.switchRow}>
                  <ThemedText>{t('coach.form.public_court')}</ThemedText>
                  <Switch value={publicCourt} onValueChange={setPublicCourt} trackColor={{ true: tintColor }} />
                </View>
              </View>
            </View>

            {/* Background */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('coach.form.background')}</ThemedText>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('coach.form.qualifications')}</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                  value={qualifications}
                  onChangeText={setQualifications}
                  placeholder={t('coach.form.qualifications_placeholder')}
                  placeholderTextColor={textSecondary}
                  multiline
                />
              </View>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('coach.form.past_clubs')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                  value={pastClubs}
                  onChangeText={setPastClubs}
                  placeholder={t('coach.form.past_clubs_placeholder')}
                  placeholderTextColor={textSecondary}
                />
              </View>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('coach.form.philosophy')}</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
                  value={philosophy}
                  onChangeText={setPhilosophy}
                  placeholder={t('coach.form.philosophy_placeholder')}
                  placeholderTextColor={textSecondary}
                  multiline
                />
              </View>
            </View>

            {/* Badge Request */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('coach.form.verification')}</ThemedText>
              <ThemedText style={[styles.label, { marginBottom: 15 }]}>{t('coach.form.request_badge')}</ThemedText>
              
              <TouchableOpacity 
                style={[
                  styles.requestBadgeItem, 
                  { borderColor },
                  requestedBadge === 'pro' && { backgroundColor: tintColor, borderColor: tintColor }
                ]}
                onPress={() => setRequestedBadge(requestedBadge === 'pro' ? null : 'pro')}
              >
                <View style={styles.requestBadgeHeader}>
                  <Ionicons name="ribbon-outline" size={24} color={requestedBadge === 'pro' ? "#fff" : tintColor} />
                  <ThemedText style={[styles.requestBadgeTitle, requestedBadge === 'pro' && { color: "#fff" }]}>
                    {t('coach.form.request_pro')}
                  </ThemedText>
                  {requestedBadge === 'pro' && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </View>
                <ThemedText style={[styles.requestBadgeHint, requestedBadge === 'pro' && { color: "#fff", opacity: 0.9 }]}>
                  {t('coach.form.request_pro_hint')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.requestBadgeItem, 
                  { borderColor, marginTop: 12 },
                  requestedBadge === 'certified' && { backgroundColor: tintColor, borderColor: tintColor }
                ]}
                onPress={() => setRequestedBadge(requestedBadge === 'certified' ? null : 'certified')}
              >
                <View style={styles.requestBadgeHeader}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={requestedBadge === 'certified' ? "#fff" : tintColor} />
                  <ThemedText style={[styles.requestBadgeTitle, requestedBadge === 'certified' && { color: "#fff" }]}>
                    {t('coach.form.request_certified')}
                  </ThemedText>
                  {requestedBadge === 'certified' && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </View>
                <ThemedText style={[styles.requestBadgeHint, requestedBadge === 'certified' && { color: "#fff", opacity: 0.9 }]}>
                  {t('coach.form.request_certified_hint')}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: tintColor }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitText}>{t('coach.form.submit')}</ThemedText>
              )}
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
};

export default CreateCoachScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc5',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  switchGroup: {
    marginTop: 10,
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  photoPreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBadgeItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  requestBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  requestBadgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  requestBadgeHint: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 36,
  },
});
