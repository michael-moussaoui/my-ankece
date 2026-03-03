import { MediaPicker } from '@/components/video/MediaPicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    BasketballPlayerData,
    BasketballPosition,
    BasketballTemplateFormProps,
    ClubInfo,
} from '@/types/basketball/template';
import { MediaAsset } from '@/types/media';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

/**
 * Formulaire de saisie des informations du joueur de basketball
 */
export const BasketballPlayerForm: React.FC<BasketballTemplateFormProps> = ({
  onComplete,
  onCancel,
  initialData,
  templateId,
}) => {
  const { t } = useTranslation();
  const { user: profile } = useUser();
  const colorScheme = useColorScheme();
  const { accentColor, accentTextColor } = useAppTheme();
  const tintColor = accentColor;
  const borderColor = Colors[colorScheme].border;
  const backgroundSecondary = Colors[colorScheme].backgroundSecondary;
  const cardBackground = Colors[colorScheme].card;
  const textSecondary = Colors[colorScheme].textSecondary;

  const POSITIONS: {key: BasketballPosition, label: string}[] = useMemo(() => [
    { key: 'Meneur', label: t('cv.form.positions.point_guard') },
    { key: 'Arrière', label: t('cv.form.positions.shooting_guard') },
    { key: 'Ailier', label: t('cv.form.positions.small_forward') },
    { key: 'Ailier Fort', label: t('cv.form.positions.power_forward') },
    { key: 'Pivot', label: t('cv.form.positions.center') },
  ], [t]);

  const STRENGTHS = useMemo(() => [
    { key: 'strength_scorer', label: t('cv.form.strength_scorer') },
    { key: 'strength_defender', label: t('cv.form.strength_defender') },
    { key: 'strength_playmaker', label: t('cv.form.strength_playmaker') },
    { key: 'strength_rebounder', label: t('cv.form.strength_rebounder') },
    { key: 'strength_leader', label: t('cv.form.strength_leader') },
    { key: 'strength_shooter', label: t('cv.form.strength_shooter') },
    { key: 'strength_athletic', label: t('cv.form.strength_athletic') },
    { key: 'strength_versatile', label: t('cv.form.strength_versatile') },
  ], [t]);

  // Informations personnelles
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [position, setPosition] = useState<BasketballPosition>(
    initialData?.position || 'Meneur'
  );
  const [height, setHeight] = useState(initialData?.height?.toString() || '');
  const [wingspan, setWingspan] = useState(initialData?.wingspan?.toString() || '');
  const [verticalLeap, setVerticalLeap] = useState(initialData?.verticalLeap?.toString() || '');
  const [dominantHand, setDominantHand] = useState<'Droitier' | 'Gaucher' | 'Ambidextre'>(
    initialData?.dominantHand || 'Droitier'
  );
  const [strengths, setStrengths] = useState<string[]>(initialData?.strengths || []);


  // Club actuel
  const [clubName, setClubName] = useState(
    initialData?.currentClub?.clubName || ''
  );
  const [clubLogo, setClubLogo] = useState<MediaAsset | null>(
    initialData?.currentClub?.clubLogo || null
  );
  const [season, setSeason] = useState(
    initialData?.currentClub?.season || '2024-2025'
  );
  const [category, setCategory] = useState(
    initialData?.currentClub?.category || ''
  );
  const [league, setLeague] = useState(initialData?.currentClub?.league || '');
  const [number, setNumber] = useState(
    initialData?.currentClub?.number?.toString() || ''
  );

  // Médias
  const [profilePhoto, setProfilePhoto] = useState<MediaAsset | null>(
    initialData?.profilePhoto || null
  );
  const [offensiveVideos, setOffensiveVideos] = useState<MediaAsset[]>(
    initialData?.offensiveVideos || []
  );
  const [defensiveVideos, setDefensiveVideos] = useState<MediaAsset[]>(
    initialData?.defensiveVideos || []
  );
  const [presentationVideo, setPresentationVideo] = useState<MediaAsset | null>(
    initialData?.presentationVideo || null
  );

  // Parcours (clubs précédents)
  const [clubHistory, setClubHistory] = useState<ClubInfo[]>(
    initialData?.clubHistory || []
  );

  // Contact
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');

  // Statistiques
  const [pointsPerGame, setPointsPerGame] = useState(
    initialData?.stats?.pointsPerGame?.toString() || ''
  );
  const [reboundsPerGame, setReboundsPerGame] = useState(
    initialData?.stats?.reboundsPerGame?.toString() || ''
  );
  const [assistsPerGame, setAssistsPerGame] = useState(
    initialData?.stats?.assistsPerGame?.toString() || ''
  );
  const [stealsPerGame, setStealsPerGame] = useState(
    initialData?.stats?.stealsPerGame?.toString() || ''
  );
  const [blocksPerGame, setBlocksPerGame] = useState(
    initialData?.stats?.blocksPerGame?.toString() || ''
  );
  const [fieldGoalPercentage, setFieldGoalPercentage] = useState(
    initialData?.stats?.fieldGoalPercentage?.toString() || ''
  );
  const [threePointPercentage, setThreePointPercentage] = useState(
    initialData?.stats?.threePointPercentage?.toString() || ''
  );
  const [freeThrowPercentage, setFreeThrowPercentage] = useState(
    initialData?.stats?.freeThrowPercentage?.toString() || ''
  );
  const [gamesPlayed, setGamesPlayed] = useState(
    initialData?.stats?.gamesPlayed?.toString() || ''
  );
  const [minutesPerGame, setMinutesPerGame] = useState(
    initialData?.stats?.minutesPerGame?.toString() || ''
  );

  // Contact & Réseaux sociaux
  const [instagram, setInstagram] = useState(initialData?.instagram || '');
  const [twitter, setTwitter] = useState(initialData?.twitter || '');
  const [facebook, setFacebook] = useState(initialData?.facebook || '');

  // Personnalisation Elite
  const [selectedPrimaryColor, setSelectedPrimaryColor] = useState(initialData?.primaryColor || '#FF8C00');
  const [selectedAccentColor, setSelectedAccentColor] = useState(initialData?.accentColor || '#B4B4BE');
  const [transitionType, setTransitionType] = useState<'fade' | 'zoom' | 'none'>(initialData?.transitionType || 'fade');
  const [jobId] = useState(initialData?.jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const isElite = templateId === 'basketball-ai-elite';
  const isPro = templateId === 'basketball-pro-cv';
  const hasCustomization = isElite || isPro;
  const totalSteps = hasCustomization ? 10 : 9; // Add customization step if elite or pro

  // État du formulaire
  const [step, setStep] = useState(1);

  const [showMediaPicker, setShowMediaPicker] = useState<
    'profile' | 'offensive' | 'defensive' | 'clubLogo' | 'presentation' | null
  >(null);

  // --- LOGIQUE D'IMPORT IA ---
  const handleImportAI = () => {
    if (!profile?.latestAnalysis) {
      Alert.alert(t('common.info'), "Aucune analyse IA récente trouvée.");
      return;
    }

    const { type, results } = profile.latestAnalysis;

    if (type === 'session' && results) {
        setFieldGoalPercentage(results.accuracy?.toString() || '');
        setThreePointPercentage(results.composition?.three_points?.toString() || '');
        setFreeThrowPercentage(results.composition?.free_throws?.toString() || '');
        Alert.alert("Succès", "Statistiques de tir importées depuis votre dernière Session IA !");
    } else if (type === 'dribble' && results) {
        // We could import dribble intensity if needed, but for now let's just show a message
        Alert.alert("Info", "Analyse de dribbles détectée. Vos stats de maniement de balle sont prêtes pour le template Elite.");
    } else {
        Alert.alert("Info", "Analyse de posture détectée. Vos données biomecaniques seront incluses dans le Pack Elite.");
    }
  };

  // --- LOGIQUE DE VALIDATION POURCENTAGES ---
  const handlePercentageChange = (text: string, setter: (value: string) => void) => {
    const formattedText = text.replace(',', '.');
    if (formattedText === '' || /^\d{0,3}(\.\d{0,1})?$/.test(formattedText)) {
      const numericValue = parseFloat(formattedText);
      if (!isNaN(numericValue) && numericValue > 100) {
        setter('100');
      } else {
        setter(formattedText);
      }
    }
  };

  const handleAddClub = () => {
    Alert.prompt(
      t('cv.form.add_club'),
      t('cv.form.club_name'),
      [
        { text: t('cv.form.previous'), style: 'cancel' },
        {
          text: t('cv.form.add_club'),
          onPress: (cName?: string) => {
            if (cName && cName.trim()) {
              const newClub: ClubInfo = {
                clubName: cName.trim(),
                season: '2023-2024',
              };
              setClubHistory([...clubHistory, newClub]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRemoveClub = (index: number) => {
    setClubHistory(prev => prev.filter((_, i) => i !== index));
  };

  const removeOffensiveVideo = (index: number) => {
    setOffensiveVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeDefensiveVideo = (index: number) => {
    setDefensiveVideos(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (vStep: number): boolean => {
    switch (vStep) {
      case 1:
        if (!firstName.trim() || !lastName.trim() || !age) {
          Alert.alert(t('common.error'), t('cv.form.required_error'));
          return false;
        }
        return true;
      case 2:
        if (strengths.length === 0) {
            Alert.alert(t('common.error'), t('cv.form.strengths_desc'));
            return false;
        }
        return true;
      case 3:
        if (!clubName.trim()) {
          Alert.alert(t('common.error'), t('cv.form.current_club_error'));
          return false;
        }
        return true;
      case 4:
        if (!profilePhoto) {
          Alert.alert(
            t('cv.form.photo_missing_title'),
            t('cv.form.photo_missing_msg'),
            [
              { text: t('map.cancel'), style: 'cancel' },
              { text: t('cv.form.continue_no_photo'), onPress: () => setStep(5) },
            ]
          );
          return false;
        }
        return true;
      case 5: // Defensive
      case 6: // Offensive
      case 7: // Social
      case 8: // Stats
        return true; 
      default:
        return true;
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else if (step === totalSteps) {
        handleComplete();
      }
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            step === i + 1 && [styles.stepDotActive, { backgroundColor: selectedAccentColor }]
          ]}
        />
      ))}
    </View>
  );


  const handlePickMedia = async (source: 'camera' | 'library', typeOverride?: any) => {
    const pickerType = typeOverride || showMediaPicker;
    if (!pickerType) return;

    // 1. On ferme tout de suite pour libérer l'écran
    setShowMediaPicker(null);

    const isVideo = pickerType === 'offensive' || pickerType === 'defensive' || pickerType === 'presentation';
    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: isVideo ? ['videos'] : ['images'],
        quality: 0.8,
        allowsEditing: !isVideo,
        videoMaxDuration: 30,
    };

    try {
        let result;
        if (source === 'camera') {
            const { granted } = await ImagePicker.requestCameraPermissionsAsync();
            if (!granted) {
                Alert.alert(t('common.error'), "Permission caméra refusée");
                return;
            }
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!granted) {
                Alert.alert(t('common.error'), "Permission galerie refusée");
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (result && !result.canceled && result.assets && result.assets[0]) {
            const asset = result.assets[0];
            const mediaAsset: MediaAsset = {
                id: Date.now().toString(),
                uri: asset.uri,
                type: (asset.type as 'video' | 'image') || (isVideo ? 'video' : 'image'),
                fileName: asset.fileName || `media_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
                duration: asset.duration,
                width: asset.width,
                height: asset.height,
            };

            if (pickerType === 'profile') setProfilePhoto(mediaAsset);
            else if (pickerType === 'offensive') setOffensiveVideos(prev => [...prev, mediaAsset]);
            else if (pickerType === 'defensive') setDefensiveVideos(prev => [...prev, mediaAsset]);
            else if (pickerType === 'clubLogo') setClubLogo(mediaAsset);
            else if (pickerType === 'presentation') setPresentationVideo(mediaAsset);
        }
    } catch (error: any) {
        console.error('Error picking media:', error);
        Alert.alert(t('common.error'), "Erreur lors de la sélection");
    } finally {
        setShowMediaPicker(null);
    }
  };

  const openMediaPicker = (type: 'profile' | 'offensive' | 'defensive' | 'clubLogo' | 'presentation') => {
    if (Platform.OS === 'web') {
        setShowMediaPicker(type);
    } else {
        Alert.alert(
            t('cv.form.choose_source'),
            '',
            [
                { text: t('cv.form.take_media'), onPress: () => handlePickMedia('camera', type) },
                { text: t('cv.form.from_library'), onPress: () => handlePickMedia('library', type) },
                { text: t('common.cancel'), style: 'cancel' }
            ]
        );
    }
  };

  const handleComplete = () => {
       const playerData: BasketballPlayerData = {
        firstName,
        lastName,
        age: parseInt(age),
        position,
        height: height ? parseInt(height) : undefined,
        wingspan: wingspan ? parseInt(wingspan) : undefined,
        verticalLeap: verticalLeap ? parseInt(verticalLeap) : undefined,
        dominantHand,
        strengths,
        currentClub: {
          clubName,
          season,
          category,
          league,
          number: number ? parseInt(number) : undefined,
          clubLogo,
        },
        clubHistory,
        profilePhoto,
        offensiveVideos,
        defensiveVideos,
        presentationVideo,
        stats: {
          pointsPerGame: pointsPerGame ? parseFloat(pointsPerGame) : undefined,
          reboundsPerGame: reboundsPerGame ? parseFloat(reboundsPerGame) : undefined,
          assistsPerGame: assistsPerGame ? parseFloat(assistsPerGame) : undefined,
          stealsPerGame: stealsPerGame ? parseFloat(stealsPerGame) : undefined,
          blocksPerGame: blocksPerGame ? parseFloat(blocksPerGame) : undefined,
          fieldGoalPercentage: fieldGoalPercentage ? parseFloat(fieldGoalPercentage) : undefined,
          threePointPercentage: threePointPercentage ? parseFloat(threePointPercentage) : undefined,
          freeThrowPercentage: freeThrowPercentage ? parseFloat(freeThrowPercentage) : undefined,
          gamesPlayed: gamesPlayed ? parseInt(gamesPlayed) : undefined,
          minutesPerGame: minutesPerGame ? parseFloat(minutesPerGame) : undefined,
        },
        email,
        phone,
        instagram,
        twitter,
        facebook,
        primaryColor: selectedPrimaryColor,
        accentColor: selectedAccentColor,
        transitionType,
        jobId,
      };

    onComplete(playerData);
  };



  const handleMediaSelected = (media: MediaAsset) => {
    if (showMediaPicker === 'profile') {
      setProfilePhoto(media);
    } else if (showMediaPicker === 'offensive') {
      setOffensiveVideo(media);
    } else if (showMediaPicker === 'defensive') {
      setDefensiveVideo(media);
    } else if (showMediaPicker === 'presentation') {
      setPresentationVideo(media);
    }
      else if (showMediaPicker === 'clubLogo') setClubLogo(media);
    setShowMediaPicker(null);
  };

  const renderStepPhysical = () => (
    <View style={styles.stepContent} testID="form-step-physical">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.strengths')}</ThemedText>
      <ThemedText style={styles.stepDescription}>
        {t('cv.form.strengths_desc')}
      </ThemedText>

      <View style={styles.positionGrid}>
        {STRENGTHS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.positionChip,
              { backgroundColor: backgroundSecondary },
              strengths.includes(s.label) && { backgroundColor: selectedAccentColor }
            ]}
            onPress={() => {
              if (strengths.includes(s.label)) {
                setStrengths(strengths.filter((st) => st !== s.label));
              } else if (strengths.length < 3) {
                setStrengths([...strengths, s.label]);
              } else {
                Alert.alert("Info", t('map.error_max_vibes')); // Reuse max vibes error for simplicity or add a new one
              }
            }}
          >
            <ThemedText style={[styles.positionChipText, strengths.includes(s.label) && styles.positionChipTextActive]}>
              {s.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText type="subtitle" style={[styles.stepTitle, { marginTop: 32 }]}>{t('cv.form.dominant_hand')}</ThemedText>
      <View style={styles.positionGrid}>
        {(['Droitier', 'Gaucher', 'Ambidextre'] as const).map((hand) => (
          <TouchableOpacity
            key={hand}
            style={[
              styles.positionChip,
              { backgroundColor: backgroundSecondary },
              dominantHand === hand && { backgroundColor: selectedAccentColor }
            ]}
            onPress={() => setDominantHand(hand)}
          >
            <ThemedText style={[styles.positionChipText, dominantHand === hand && styles.positionChipTextActive]}>
                {hand === 'Droitier' ? t('cv.form.right_handed') : hand === 'Gaucher' ? t('cv.form.left_handed') : t('cv.form.ambidextrous')}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText type="subtitle" style={[styles.stepTitle, { marginTop: 32 }]}>{t('cv.form.physical_info')}</ThemedText>
      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <ThemedText style={styles.label}>{t('cv.form.wingspan')}</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={wingspan}
            onChangeText={setWingspan}
            placeholder="205"
            keyboardType="numeric"
            maxLength={3}
            placeholderTextColor={textSecondary}
          />
          <ThemedText style={styles.inputHint}>{t('cv.form.wingspan_hint')}</ThemedText>
        </View>

        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <ThemedText style={styles.label}>{t('cv.form.vertical_leap')}</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={verticalLeap}
            onChangeText={setVerticalLeap}
            placeholder="85"
            keyboardType="numeric"
            maxLength={3}
            placeholderTextColor={textSecondary}
          />
          <ThemedText style={styles.inputHint}>{t('cv.form.vertical_leap_hint')}</ThemedText>
        </View>
      </View>
    </View>
  );

  const renderStep1 = () => (

    <View style={styles.stepContent} testID="form-step-1">
      <View style={styles.photoUploadSection}>
        <TouchableOpacity 
          style={[styles.photoPickerCircle, { backgroundColor: backgroundSecondary }]} 
          onPress={() => openMediaPicker('profile')}
        >
          {profilePhoto ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: profilePhoto.uri }} style={styles.photoImage} />
              <View style={[styles.editBadge, { backgroundColor: selectedAccentColor }]}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person-outline" size={40} color={accentColor} />
              <ThemedText style={[styles.photoPlaceholderText, { color: accentColor }]}>{t('cv.form.add_photo')}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.personal_info')}</ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>
          {t('cv.form.first_name')} <ThemedText style={styles.required}>*</ThemedText>
        </ThemedText>
        <TextInput
          testID="input-firstname"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('cv.form.first_name')}
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>
          {t('cv.form.last_name')} <ThemedText style={styles.required}>*</ThemedText>
        </ThemedText>
        <TextInput
          testID="input-lastname"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('cv.form.last_name')}
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <ThemedText style={styles.label}>
            {t('cv.form.age')} <ThemedText style={styles.required}>*</ThemedText>
          </ThemedText>
          <TextInput
            testID="input-age"
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={age}
            onChangeText={setAge}
            placeholder="18"
            keyboardType="numeric"
            maxLength={2}
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <ThemedText style={styles.label}>{t('cv.form.height')}</ThemedText>
          <TextInput
            testID="input-height"
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={height}
            onChangeText={setHeight}
            placeholder="190"
            keyboardType="numeric"
            maxLength={3}
            placeholderTextColor={textSecondary}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>{t('cv.form.position')} <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <View style={styles.positionGrid}>
          {POSITIONS.map((pos) => (
            <TouchableOpacity
              key={pos.key}
              style={[
                styles.positionChip, 
                { backgroundColor: backgroundSecondary },
                position === pos.key && { backgroundColor: selectedAccentColor }
              ]}
              onPress={() => setPosition(pos.key)}
            >
              <ThemedText style={[styles.positionChipText, position === pos.key && styles.positionChipTextActive]}>
                {pos.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent} testID="form-step-2">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.current_club')}</ThemedText>
      {/* ZONE D'UPLOAD DU LOGO */}
      <View style={styles.logoUploadSection}>
        <ThemedText style={styles.label}>{t('cv.form.club_logo')}</ThemedText>
        <TouchableOpacity 
          style={[styles.logoPickerSquare, { backgroundColor: backgroundSecondary }]} 
          onPress={() => openMediaPicker('clubLogo')}
        >
          {clubLogo ? (
            <View style={styles.logoPreviewContainer}>
              <Image source={{ uri: clubLogo.uri }} style={styles.logoImage} />
              <View style={[styles.editBadge, { backgroundColor: selectedAccentColor }]}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="shield-outline" size={32} color={accentColor} />
              <ThemedText style={[styles.logoPlaceholderText, { color: accentColor }]}>{t('cv.form.add_logo')}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
        {clubLogo && (
          <TouchableOpacity onPress={() => setClubLogo(null)}>
            <ThemedText style={styles.removeLogoText}>{t('cv.form.remove_logo')}</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>
          {t('cv.form.club_name')} <ThemedText style={styles.required}>*</ThemedText>
        </ThemedText>
        <TextInput
          testID="input-club"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={clubName}
          onChangeText={setClubName}
          placeholder="Ex: Paris Basketball"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <ThemedText style={styles.label}>{t('cv.form.season')}</ThemedText>
          <TextInput
            testID="input-season"
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={season}
            onChangeText={setSeason}
            placeholder="2024-2025"
            placeholderTextColor={textSecondary}
          />
        </View>

        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <ThemedText style={styles.label}>{t('cv.form.jersey_number')}</ThemedText>
          <TextInput
            testID="input-number"
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={number}
            onChangeText={setNumber}
            placeholder="23"
            keyboardType="numeric"
            maxLength={2}
            placeholderTextColor={textSecondary}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>{t('cv.form.category')}</ThemedText>
        <TextInput
          testID="input-category"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={category}
          onChangeText={setCategory}
          placeholder="Ex: Senior, U21, U18"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>{t('cv.form.league')}</ThemedText>
        <TextInput
          testID="input-league"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={league}
          onChangeText={setLeague}
          placeholder="Ex: Nationale 1, Pro B"
          placeholderTextColor={textSecondary}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent} testID="form-step-3">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.uniform_photo')}</ThemedText>
      <ThemedText style={styles.stepDescription}>
        {t('cv.form.uniform_photo_desc')}
      </ThemedText>

      {profilePhoto ? (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: profilePhoto.uri }} style={styles.photoPreview} />
          <TouchableOpacity
            testID="change-photo-button"
            style={styles.changeMediaButton}
            onPress={() => setShowMediaPicker('profile')}
          >
            <Ionicons name="camera" size={24} color={accentColor} />
            <ThemedText style={[styles.changeMediaText, { color: accentColor }]}>{t('cv.form.change_photo')}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeMediaButton}
            onPress={() => setProfilePhoto(null)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          testID="add-photo-button"
          style={[styles.addMediaButton, { backgroundColor: backgroundSecondary }]}
          onPress={() => setShowMediaPicker('profile')}
        >
          <Ionicons name="camera-outline" size={48} color={accentColor} />
          <ThemedText style={[styles.addMediaText, { color: accentColor }]}>{t('cv.form.add_photo')}</ThemedText>
          <ThemedText style={styles.addMediaHint}>{t('cv.form.photo_hint')}</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent} testID="form-step-4">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.game_videos')}</ThemedText>

      {/* Vidéo offensive */}
      <View style={styles.videoSection}>
        <ThemedText style={styles.videoSectionTitle}>
          <Ionicons name="basketball" size={20} color={accentColor} /> {t('cv.form.offensive_videos')}
        </ThemedText>
        
        {offensiveVideos.map((video, index) => (
          <View key={video.id} style={[styles.videoPreview, { backgroundColor: backgroundSecondary, marginBottom: 8 }]}>
            <ThemedText style={styles.videoFileName}>{video.fileName}</ThemedText>
            <ThemedText style={styles.videoDuration}>
              {((video.duration || 0) / 1000).toFixed(0)}s
            </ThemedText>
            <TouchableOpacity
              onPress={() => removeOffensiveVideo(index)}
              style={styles.removeVideoButton}
            >
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          testID="add-offensive-button"
          style={[styles.addVideoButton, { backgroundColor: backgroundSecondary, borderColor: accentColor + '44' }]}
          onPress={() => openMediaPicker('offensive')}
        >
          <Ionicons name="add-circle-outline" size={32} color={accentColor} />
          <ThemedText style={[styles.addVideoText, { color: accentColor }]}>
            {offensiveVideos.length > 0 ? t('cv.form.add_another_offensive') : t('cv.form.add_offensive')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Vidéo défensive */}
      <View style={styles.videoSection}>
        <ThemedText style={styles.videoSectionTitle}>
          <Ionicons name="shield" size={20} color={accentColor} /> {t('cv.form.defensive_videos')}
        </ThemedText>
        
        {defensiveVideos.map((video, index) => (
          <View key={video.id} style={[styles.videoPreview, { backgroundColor: backgroundSecondary, marginBottom: 8 }]}>
            <ThemedText style={styles.videoFileName}>{video.fileName}</ThemedText>
            <ThemedText style={styles.videoDuration}>
              {((video.duration || 0) / 1000).toFixed(0)}s
            </ThemedText>
            <TouchableOpacity
              onPress={() => removeDefensiveVideo(index)}
              style={styles.removeVideoButton}
            >
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          testID="add-defensive-button"
          style={[styles.addVideoButton, { backgroundColor: backgroundSecondary, borderColor: accentColor + '44' }]}
          onPress={() => openMediaPicker('defensive')}
        >
          <Ionicons name="add-circle-outline" size={32} color={accentColor} />
          <ThemedText style={[styles.addVideoText, { color: accentColor }]}>
            {defensiveVideos.length > 0 ? t('cv.form.add_another_defensive') : t('cv.form.add_defensive')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Vidéo de présentation */}
      <View style={styles.videoSection}>
        <ThemedText style={styles.videoSectionTitle}>
          <Ionicons name="mic" size={20} color={accentColor} /> Vidéo de Présentation (Discours)
        </ThemedText>
        {presentationVideo ? (
          <View style={[styles.videoPreview, { backgroundColor: backgroundSecondary }]}>
            <ThemedText style={styles.videoFileName}>{presentationVideo.fileName}</ThemedText>
            <ThemedText style={styles.videoDuration}>
              {((presentationVideo.duration || 0) / 1000).toFixed(0)}s
            </ThemedText>
            <TouchableOpacity
              onPress={() => openMediaPicker('presentation')}
            >
              <ThemedText style={[styles.changeVideoText, { color: accentColor }]}>{t('cv.form.change')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPresentationVideo(null)}
              style={styles.removeVideoButton}
            >
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addVideoButton, { backgroundColor: backgroundSecondary, borderColor: accentColor + '44' }]}
            onPress={() => openMediaPicker('presentation')}
          >
            <Ionicons name="add-circle-outline" size={32} color={accentColor} />
            <ThemedText style={[styles.addVideoText, { color: accentColor }]}>Ajouter ma vidéo de présentation</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent} testID="form-step-5">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.stats')}</ThemedText>
      <ThemedText style={styles.stepDescription}>
        {t('cv.form.stats_desc')}
      </ThemedText>

      {/* Bouton Import IA */}
      {profile?.latestAnalysis && (
          <TouchableOpacity 
            style={[styles.aiImportButton, { borderColor: accentColor }]} 
            onPress={handleImportAI}
          >
              <Ionicons name="sparkles" size={20} color={accentColor} />
              <ThemedText style={[styles.aiImportText, { color: accentColor }]}>Importer mes résultats IA</ThemedText>
          </TouchableOpacity>
      )}

      {/* Section: Statistiques principales */}
      <View style={[styles.statsSection, { backgroundColor: backgroundSecondary, borderColor }]}>
        <ThemedText style={styles.statsSectionTitle}>
          <Ionicons name="stats-chart" size={20} color={accentColor} /> {t('cv.form.main_stats')}
        </ThemedText>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <ThemedText style={styles.label}>{t('cv.form.points')}</ThemedText>
            <TextInput
              testID="input-points"
              style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={pointsPerGame}
              onChangeText={setPointsPerGame}
              placeholder="15.5"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <ThemedText style={styles.label}>{t('cv.form.rebonds')}</ThemedText>
            <TextInput
              testID="input-rebounds"
              style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={reboundsPerGame}
              onChangeText={setReboundsPerGame}
              placeholder="7.2"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <ThemedText style={styles.label}>{t('cv.form.passes')}</ThemedText>
            <TextInput
              testID="input-assists"
              style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={assistsPerGame}
              onChangeText={setAssistsPerGame}
              placeholder="5.8"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <ThemedText style={styles.label}>{t('cv.form.interceptions')}</ThemedText>
            <TextInput
              testID="input-steals"
              style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={stealsPerGame}
              onChangeText={setStealsPerGame}
              placeholder="1.5"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <ThemedText style={styles.label}>{t('cv.form.contres')}</ThemedText>
            <TextInput
              testID="input-blocks"
              style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={blocksPerGame}
              onChangeText={setBlocksPerGame}
              placeholder="0.8"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <ThemedText style={styles.label}>{t('cv.form.minutes')}</ThemedText>
            <TextInput
              testID="input-minutes"
              style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={minutesPerGame}
              onChangeText={setMinutesPerGame}
              placeholder="28.5"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
            />
          </View>
        </View>
      </View>

      {/* Section: Pourcentages */}
      <View style={[styles.statsSection, { backgroundColor: backgroundSecondary, borderColor }]}>
        <ThemedText style={styles.statsSectionTitle}>
          <Ionicons name="trending-up" size={20} color={accentColor} /> {t('cv.form.shooting')}
        </ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>{t('cv.form.fg_percent')}</ThemedText>
          <View style={styles.percentageInputContainer}>
            <TextInput
              testID="input-fg-percentage"
              style={[styles.input, styles.percentageInput, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={fieldGoalPercentage}
              onChangeText={setFieldGoalPercentage}
              placeholder="45.5"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
              maxLength={5}
            />
            <ThemedText style={styles.percentageSymbol}>%</ThemedText>
          </View>
          <ThemedText style={styles.inputHint}>{t('cv.form.fg_hint')}</ThemedText>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>{t('cv.form.three_pt_percent')}</ThemedText>
          <View style={styles.percentageInputContainer}>
            <TextInput
              testID="input-3pt-percentage"
              style={[styles.input, styles.percentageInput, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={threePointPercentage}
              onChangeText={setThreePointPercentage}
              placeholder="38.2"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
              maxLength={5}
            />
            <ThemedText style={styles.percentageSymbol}>%</ThemedText>
          </View>
          <ThemedText style={styles.inputHint}>{t('cv.form.three_pt_percent')}</ThemedText>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>{t('cv.form.ft_percent')}</ThemedText>
          <View style={styles.percentageInputContainer}>
            <TextInput
              testID="input-ft-percentage"
              style={[styles.input, styles.percentageInput, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
              value={freeThrowPercentage}
              onChangeText={setFreeThrowPercentage}
              placeholder="82.5"
              keyboardType="decimal-pad"
              placeholderTextColor={textSecondary}
              maxLength={5}
            />
            <ThemedText style={styles.percentageSymbol}>%</ThemedText>
          </View>
          <ThemedText style={styles.inputHint}>{t('cv.form.ft_percent')}</ThemedText>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>{t('cv.form.games_played')}</ThemedText>
          <TextInput
            testID="input-games-played"
            style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
            value={gamesPlayed}
            onChangeText={setGamesPlayed}
            placeholder="25"
            keyboardType="numeric"
            placeholderTextColor={textSecondary}
          />
          <ThemedText style={styles.inputHint}>{t('cv.form.games_played')}</ThemedText>
        </View>
      </View>

      <View style={[styles.statsNote, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name="information-circle" size={20} color={accentColor} />
        <ThemedText style={styles.statsNoteText}>
          {t('cv.form.stats_note')}
        </ThemedText>
      </View>
    </View>
  );

  const renderStepSocial = () => (
    <View style={styles.stepContent} testID="form-step-social">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.social_networks')}</ThemedText>
      <ThemedText style={styles.stepDescription}>
        {t('cv.form.social_desc')}
      </ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>
          <Ionicons name="logo-instagram" size={16} color="#E1306C" /> Instagram
        </ThemedText>
        <TextInput
          testID="input-instagram"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@votre_compte"
          autoCapitalize="none"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>
          <Ionicons name="logo-twitter" size={16} color="#1DA1F2" /> Twitter (X)
        </ThemedText>
        <TextInput
          testID="input-twitter"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={twitter}
          onChangeText={setTwitter}
          placeholder="@votre_compte"
          autoCapitalize="none"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>
          <Ionicons name="logo-facebook" size={16} color="#4267B2" /> Facebook
        </ThemedText>
        <TextInput
          testID="input-facebook"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={facebook}
          onChangeText={setFacebook}
          placeholder={t('cv.form.facebook_placeholder')}
          autoCapitalize="none"
          placeholderTextColor={textSecondary}
        />
      </View>
    </View>
  );

  const renderStep7 = () => (
    <ThemedView style={styles.stepContent} testID="form-step-7">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.background')} & {t('cv.form.contact_info')}</ThemedText>

      {/* Parcours */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>{t('cv.form.past_clubs')}</ThemedText>
        {clubHistory.map((club, index) => (
          <ThemedView key={index} style={[styles.clubHistoryItem, { backgroundColor: backgroundSecondary }]}>
            <ThemedText style={styles.clubHistoryText}>{club.clubName}</ThemedText>
            <ThemedText style={styles.clubHistorySeason}>{club.season}</ThemedText>
            <TouchableOpacity onPress={() => handleRemoveClub(index)}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </ThemedView>
        ))}
        <TouchableOpacity
          testID="add-club-button"
          style={[styles.addClubButton, { borderColor: accentColor }]}
          onPress={handleAddClub}
        >
          <Ionicons name="add-circle-outline" size={24} color={accentColor} />
          <ThemedText style={[styles.addClubText, { color: accentColor }]}>{t('cv.form.add_club')}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Contact */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>{t('cv.form.email')}</ThemedText>
        <TextInput
          testID="input-email"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>{t('cv.form.phone')}</ThemedText>
        <TextInput
          testID="input-phone"
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+33 6 12 34 56 78"
          keyboardType="phone-pad"
          placeholderTextColor={textSecondary}
        />
      </View>
    </ThemedView>
  );

  const renderStepCustomization = () => (
    <View style={styles.stepContent} testID="form-step-customization">
      <ThemedText type="subtitle" style={styles.stepTitle}>Personnalisation Premium</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Choisissez l'identité visuelle de votre Video CV.
      </ThemedText>

      {/* Primary Color Selection */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Couleur Principale (Éléments Clés)</ThemedText>
        <View style={styles.colorPresets}>
          {['#FF8C00', '#7c3aed', '#0288D1', '#e11d48', '#10b981'].map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                selectedPrimaryColor === color && { borderColor: Colors[colorScheme].text, borderWidth: 3 }
              ]}
              onPress={() => setSelectedPrimaryColor(color)}
            />
          ))}
        </View>
        <TextInput
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={selectedPrimaryColor}
          onChangeText={setSelectedPrimaryColor}
          placeholder="#HEXCODE"
          autoCapitalize="characters"
        />
      </View>

      {/* Accent Color Selection */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Couleur d'Accentuation</ThemedText>
        <View style={styles.colorPresets}>
          {['#B4B4BE', '#FFD700', '#00E5FF', '#FFFFFF', '#4a4a4a'].map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                selectedAccentColor === color && { borderColor: Colors[colorScheme].text, borderWidth: 3 }
              ]}
              onPress={() => setSelectedAccentColor(color)}
            />
          ))}
        </View>
        <TextInput
          style={[styles.input, { borderColor, color: Colors[colorScheme].text, backgroundColor: cardBackground }]}
          value={selectedAccentColor}
          onChangeText={setSelectedAccentColor}
          placeholder="#HEXCODE"
          autoCapitalize="characters"
        />
      </View>

      {/* Transition Type */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Style de Transition</ThemedText>
        <View style={styles.transitionGrid}>
          {(['fade', 'zoom', 'none'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.transitionBtn,
                { borderColor: transitionType === type ? accentColor : borderColor, backgroundColor: cardBackground }
              ]}
              onPress={() => setTransitionType(type)}
            >
              <ThemedText style={[styles.transitionText, transitionType === type && { color: accentColor, fontWeight: 'bold' }]}>
                {type.toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderReview = () => (
    <ThemedView style={styles.stepContent} testID="form-review">
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.review')}</ThemedText>
      <ThemedText style={styles.stepDescription}>
        {t('cv.form.review_desc')}
      </ThemedText>

      <ThemedView style={[styles.reviewCard, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.reviewHeader}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto.uri }} style={styles.reviewAvatar} />
          ) : (
            <ThemedView style={[styles.reviewAvatarPlaceholder, { backgroundColor: backgroundSecondary }]}>
              <Ionicons name="person" size={30} color={textSecondary} />
            </ThemedView>
          )}
          <View style={styles.reviewHeaderText}>
            <ThemedText style={styles.reviewName}>{firstName} {lastName}</ThemedText>
            <ThemedText style={styles.reviewSubName}>
                {position} • {age} {t('cv.form.years_old')} • {height}cm
            </ThemedText>
          </View>
        </View>

        <ThemedView style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* Physical Info */}
        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewSectionTitle}>{t('cv.form.physical_info')}</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {t('cv.form.wingspan')}: {wingspan}cm | {t('cv.form.vertical_leap')}: {verticalLeap}cm
          </ThemedText>
          <ThemedText style={styles.reviewValue}>
            {t('cv.form.dominant_hand')}: {dominantHand}
          </ThemedText>
        </View>

        <ThemedView style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewSectionTitle}>{t('cv.form.club_season')}</ThemedText>
          <ThemedText style={styles.reviewValue}>{clubName} ({season})</ThemedText>
          <ThemedText style={styles.reviewValue}>{league} • {category} • #{number}</ThemedText>
        </View>

        <ThemedView style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewSectionTitle}>{t('cv.form.main_stats')}</ThemedText>
          <View style={styles.reviewStatsRow}>
            <View style={styles.reviewStatItem}>
              <ThemedText style={styles.reviewStatValue}>{pointsPerGame || '0'}</ThemedText>
              <ThemedText style={styles.reviewStatLabel}>{t('cv.form.pts')}</ThemedText>
            </View>
            <View style={styles.reviewStatItem}>
              <ThemedText style={styles.reviewStatValue}>{reboundsPerGame || '0'}</ThemedText>
              <ThemedText style={styles.reviewStatLabel}>{t('cv.form.reb')}</ThemedText>
            </View>
            <View style={styles.reviewStatItem}>
              <ThemedText style={styles.reviewStatValue}>{assistsPerGame || '0'}</ThemedText>
              <ThemedText style={styles.reviewStatLabel}>{t('cv.form.ast')}</ThemedText>
            </View>
          </View>
        </View>

        <ThemedView style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewSectionTitle}>{t('cv.form.strengths')}</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {strengths.map((s, i) => (
              <ThemedView key={i} style={{ backgroundColor: backgroundSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <ThemedText style={{ fontSize: 12 }}>{s}</ThemedText>
              </ThemedView>
            ))}
          </View>
        </View>

        <ThemedView style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* Contact Info */}
        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewSectionTitle}>{t('cv.form.contact_info')}</ThemedText>
          <ThemedText style={styles.reviewValue}>{email}</ThemedText>
          <ThemedText style={styles.reviewValue}>{phone}</ThemedText>
        </View>

      </ThemedView>

      <ThemedView style={[styles.infoBox, { backgroundColor: backgroundSecondary, borderColor: accentColor, borderWidth: 1 }]}>
        <Ionicons name="information-circle" size={20} color={accentColor} />
        <ThemedText style={[styles.infoBoxText, { color: Colors[colorScheme].text }]}>
          {t('cv.form.review_edit_hint')}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );


  const renderSuccess = () => (
    <ThemedView style={styles.stepContent} testID="form-success">
      <Ionicons name="checkmark-circle" size={80} color="#4CAF50" style={styles.successIcon} />
      <ThemedText type="subtitle" style={styles.stepTitle}>{t('cv.form.cv_success')}</ThemedText>
      <ThemedText style={styles.stepDescription}>
        {t('cv.form.cv_success_desc')}
      </ThemedText>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: accentColor, marginTop: 20 }]}
        onPress={onCancel} // Assuming onCancel navigates away or closes the form
      >
        <ThemedText style={styles.primaryButtonText}>{t('cv.form.view_profile')}</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );


  return (
    <ThemedView style={styles.container} testID="basketball-player-form">
      {/* HEADER FIXE */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>{t('cv.form.create_cv')}</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStepPhysical()}
        {step === 3 && renderStep2()}
        {step === 4 && renderStep3()}
        {step === 5 && renderStep4()}
        {step === 6 && renderStep5()}
        {step === 7 && renderStepSocial()}
        {step === 8 && renderStep7()}
        {hasCustomization ? (
          <>
            {step === 9 && renderStepCustomization()}
            {step === 10 && renderReview()}
            {step === 11 && renderSuccess()}
          </>
        ) : (
          <>
            {step === 9 && renderReview()}
            {step === 10 && renderSuccess()}
          </>
        )}

      </ScrollView>

      {/* FOOTER AVEC BOUTONS DE NAVIGATION */}
      {((!hasCustomization && step < 10) || (hasCustomization && step < 11)) && (
        <ThemedView style={[styles.footer, { borderTopColor: borderColor, backgroundColor: cardBackground }]}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor }]}
            onPress={handleBack}
          >
            <ThemedText style={styles.secondaryButtonText}>
              {step === 1 ? t('cv.form.cancel') : t('cv.form.previous')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accentColor }]}
            onPress={handleNext}
          >
            <ThemedText style={[styles.primaryButtonText, { color: accentTextColor }]}>
              {step === totalSteps ? t('cv.form.generate_cv') : t('cv.form.next')}
            </ThemedText>
            <Ionicons
              name={step === totalSteps ? 'sparkles' : 'arrow-forward'}
              size={18}
              color={accentTextColor}
            />
          </TouchableOpacity>
        </ThemedView>
      )}


      {/* Media Picker Modal (Web Only) */}
      {Platform.OS === 'web' && showMediaPicker && (
        <Modal
          visible={!!showMediaPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMediaPicker(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMediaPicker(null)}
          >
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>{t('cv.form.choose_source')}</ThemedText>

              <TouchableOpacity
                style={[styles.modalOption, { borderBottomColor: borderColor }]}
                onPress={() => handlePickMedia('camera')}
              >
                <Ionicons name="camera" size={24} color={accentColor} />
                <ThemedText style={styles.modalOptionText}>{t('cv.form.take_media')}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handlePickMedia('library')}
              >
                <Ionicons name="images" size={24} color={accentColor} />
                <ThemedText style={styles.modalOptionText}>{t('cv.form.from_library')}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: backgroundSecondary }]}
                onPress={() => setShowMediaPicker(null)}
              >
                <ThemedText style={styles.modalCancelText}>{t('common.cancel') || 'Annuler'}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </TouchableOpacity>
        </Modal>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  stepDotActive: {
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  logoUploadSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPickerSquare: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  logoPreviewContainer: {
    width: '100%',
    height: '100%',
    padding: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 12,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    borderRadius: 10,
    padding: 4,
  },
  removeLogoText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 8,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  positionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: '30%',
    alignItems: 'center',
  },
  positionChipActive: {
  },
  positionChipText: { color: '#666', fontWeight: '500' },
  positionChipTextActive: { color: '#fff', fontWeight: '700' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addMediaButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  addMediaHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  mediaPreview: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  changeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  changeMediaText: {
    fontSize: 14,
  },
  removeMediaButton: {
    marginTop: 8,
  },
  videoSection: {
    marginBottom: 24,
  },
  videoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  videoPreview: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoFileName: {
    fontSize: 14,
    flex: 1,
  },
  videoDuration: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  changeVideoText: {
    fontSize: 14,
  },
  removeVideoButton: {
    marginLeft: 8,
  },
  addVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    gap: 12,
  },
  addVideoText: {
    fontSize: 14,
  },
  clubHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  clubHistoryText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  clubHistorySeason: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  addClubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  addClubText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  aiImportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 20,
    gap: 8,
  },
  aiImportText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  percentageInput: {
    flex: 1,
    paddingRight: 40, // Espace pour le symbole %
  },
  percentageSymbol: {
    position: 'absolute',
    right: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsNote: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  statsNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  reviewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  reviewAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewSubName: {
    fontSize: 14,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  reviewSection: {
    marginBottom: 12,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.6,
  },
  reviewValue: {
    fontSize: 16,
  },
  reviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reviewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  reviewStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reviewStatLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
  },
  successIcon: {
    alignSelf: 'center',
    marginVertical: 40,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    // alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCancel: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  colorPresets: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  transitionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  transitionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoUploadSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoPickerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  photoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  logoUploadSection: {
    marginBottom: 20,
  },
  logoPickerSquare: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    marginTop: 8,
    overflow: 'hidden',
  },
  logoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  removeLogoText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  transitionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});