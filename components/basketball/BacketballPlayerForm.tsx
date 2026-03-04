import { useAppTheme } from '@/context/ThemeContext';
import { cloudinaryService } from '@/services/cloudinaryService';
import { BasketballPlayerData, BasketballTemplateFormProps } from '@/types/basketball/template';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import {
    AnimatedTitle,
    FormInput,
    FormSelector,
    FormStepper,
    GlassContainer,
    QuotaIndicator
} from './FormComponents';

const TOTAL_STEPS = 7;

interface VideoClip {
  uri: string;
  tag: string;
}

export const BasketballPlayerForm: React.FC<BasketballTemplateFormProps> = ({
  onComplete,
  onCancel,
  initialData,
  templateId
}) => {
  const { t, i18n } = useTranslation();
  const { accentColor, accentTextColor } = useAppTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    height: initialData?.height?.toString() || '',
    weight: initialData?.weight?.toString() || '',
    lateralization: initialData?.dominantHand === 'Gaucher' ? 'left' : (initialData?.dominantHand === 'Ambidextre' ? 'ambi' : 'right'),
    profilePhoto: initialData?.profilePhoto?.uri || null,
    mainPosition: initialData?.position || 'PG',
    secondaryPosition: '',
    category: initialData?.currentClub?.category || 'SENIOR',
    wingspan: initialData?.wingspan?.toString() || '',
    verticalLeap: initialData?.verticalLeap?.toString() || '',
    level: initialData?.currentClub?.league || 'REG',
    club: initialData?.currentClub?.clubName || '',
    jersey: initialData?.currentClub?.number?.toString() || '',
    ppg: initialData?.stats?.pointsPerGame?.toString() || '',
    apg: initialData?.stats?.assistsPerGame?.toString() || '',
    rpg: initialData?.stats?.reboundsPerGame?.toString() || '',
    spg: initialData?.stats?.stealsPerGame?.toString() || '',
    bpg: initialData?.stats?.blocksPerGame?.toString() || '',
    fgPercent: initialData?.stats?.fieldGoalPercentage?.toString() || '',
    threePercent: initialData?.stats?.threePointPercentage?.toString() || '',
    ftPercent: initialData?.stats?.freeThrowPercentage?.toString() || '',
    personalMessage: '',
    achievements: initialData?.achievements || [],
    offensiveClips: initialData?.offensiveVideos?.map(v => ({ uri: v.uri, tag: '' })) || [],
    defensiveClips: initialData?.defensiveVideos?.map(v => ({ uri: v.uri, tag: '' })) || [],
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    instagram: initialData?.instagram || '',
    facebook: initialData?.facebook || '',
    twitter: initialData?.twitter || '',
    tiktok: initialData?.tiktok || '',
    youtube: initialData?.youtube || '',
    snapchat: initialData?.snapchat || '',
    presentationVideo: initialData?.presentationVideo?.uri || null,
    clubLogo: initialData?.currentClub?.clubLogo?.uri || null,
    pack: templateId === 'basketball-ai-elite' ? 'elite' : 'essential'
  });

  const packQuotas: any = {
    essential: { off: 3, def: 3 },
    elite: { off: 10, def: 10 },
    elite_pro: { off: null, def: null }
  };

  const currentQuota = packQuotas[formData.pack] || packQuotas.essential;

  const pickImage = async (field: string) => {
    Alert.alert(
      t('common.choose_option'),
      '',
      [
        {
          text: t('common.gallery'),
          onPress: () => processImagePick(field, 'library'),
        },
        {
          text: t('common.camera'),
          onPress: () => processImagePick(field, 'camera'),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const processImagePick = async (field: string, source: 'library' | 'camera') => {
    let result;
    
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('auth.camera_permission_msg'));
        return;
      }
      
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      setLoading(true);
      try {
        const url = await cloudinaryService.uploadImage(result.assets[0].uri);
        setFormData((prev: any) => ({ ...prev, [field]: url }));
      } catch (err) {
        Alert.alert(t('common.error'), t('cv.error_msg'));
      } finally {
        setLoading(false);
      }
    }
  };

  const pickVideo = async (type: 'off' | 'def' | 'presentation') => {
    const clips = type === 'off' ? formData.offensiveClips : formData.defensiveClips;
    const max = type === 'off' ? currentQuota.off : currentQuota.def;

    if (max !== null && clips.length >= max) {
      Alert.alert(t('cv.form.steps.videos.quota_reached'), t('cv.form.packs.upgrade_needed'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      setGalleryLoading(true);
      try {
        const url = await cloudinaryService.uploadVideo(result.assets[0].uri);
        const newClip = { uri: url as string, tag: '' };
        if (type === 'off') {
          setFormData((prev: any) => ({ ...prev, offensiveClips: [...prev.offensiveClips, newClip] }));
        } else {
          setFormData((prev: any) => ({ ...prev, defensiveClips: [...prev.defensiveClips, newClip] }));
        }
      } catch (err) {
        Alert.alert(t('common.error'), t('cv.error_msg'));
      } finally {
        setGalleryLoading(false);
      }
    }
  };

  const recordPresentationVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('cv.form.camera_permission_denied') || "Accès caméra refusé");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setGalleryLoading(true);
      try {
        const url = await cloudinaryService.uploadVideo(result.assets[0].uri);
        setFormData((prev: any) => ({ ...prev, presentationVideo: url }));
      } catch (err) {
        Alert.alert(t('common.error'), t('cv.error_msg'));
      } finally {
        setGalleryLoading(false);
      }
    }
  };

  const generateAIScouting = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockReport = i18n.language === 'fr' 
        ? "Joueur explosif avec un excellent tir extérieur. Potentiel défensif élevé grâce à son envergure."
        : "Explosive player with excellent perimeter shooting. High defensive potential due to wingspan.";
      setFormData({...formData, personalMessage: mockReport});
    } catch (err) {
      Alert.alert(t('common.error'), t('cv.error_msg'));
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // Transform back to BasketballPlayerData
    const finalData: BasketballPlayerData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      age: 20, // Default or calculated
      position: formData.mainPosition,
      height: parseInt(formData.height) || 0,
      wingspan: parseInt(formData.wingspan) || 0,
      verticalLeap: parseInt(formData.verticalLeap) || 0,
      dominantHand: formData.lateralization === 'left' ? 'Gaucher' : (formData.lateralization === 'ambi' ? 'Ambidextre' : 'Droitier'),
      strengths: [],
      achievements: formData.achievements,
      currentClub: {
        clubName: formData.club,
        season: '2024-2025',
        category: formData.category,
        league: formData.level,
        number: parseInt(formData.jersey) || 0,
        clubLogo: formData.clubLogo ? ({ id: 'logo', uri: formData.clubLogo, type: 'image' } as any) : null,
      },
      offensiveVideos: formData.offensiveClips.map((c: any, i: number) => ({ id: `off_${i}`, uri: c.uri, type: 'video' })),
      defensiveVideos: formData.defensiveClips.map((c: any, i: number) => ({ id: `def_${i}`, uri: c.uri, type: 'video' })),
      presentationVideo: formData.presentationVideo ? ({ id: 'pres', uri: formData.presentationVideo, type: 'video' } as any) : null,
      clubHistory: [],
      stats: {
        pointsPerGame: parseFloat(formData.ppg) || 0,
        reboundsPerGame: parseFloat(formData.rpg) || 0,
        assistsPerGame: parseFloat(formData.apg) || 0,
        stealsPerGame: parseFloat(formData.spg) || 0,
        blocksPerGame: parseFloat(formData.bpg) || 0,
        fieldGoalPercentage: parseFloat(formData.fgPercent) || 0,
        threePointPercentage: parseFloat(formData.threePercent) || 0,
        freeThrowPercentage: parseFloat(formData.ftPercent) || 0,
        gamesPlayed: 0,
        minutesPerGame: 0
      },
      email: formData.email,
      phone: formData.phone,
      instagram: formData.instagram,
      twitter: formData.twitter,
      tiktok: formData.tiktok,
      youtube: formData.youtube,
      snapchat: formData.snapchat,
      facebook: formData.facebook,
      profilePhoto: formData.profilePhoto ? ({ id: 'photo', uri: formData.profilePhoto, type: 'image' } as any) : null,
      language: i18n.language as 'fr' | 'en'
    };
    onComplete(finalData);
  };

  const renderStep1 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.identity.title')} />
      <GlassContainer>
        <FormInput label={t('cv.form.steps.identity.first_name')} value={formData.firstName} onChangeText={(v: string) => setFormData({...formData, firstName: v})} required themeColor={accentColor} />
        <FormInput label={t('cv.form.steps.identity.last_name')} value={formData.lastName} onChangeText={(v: string) => setFormData({...formData, lastName: v})} required themeColor={accentColor} />
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}><FormInput label={t('cv.form.steps.identity.height')} value={formData.height} onChangeText={(v: string) => setFormData({...formData, height: v})} keyboardType="numeric" themeColor={accentColor} /></View>
          <View style={{flex: 1}}><FormInput label={t('cv.form.steps.identity.weight')} value={formData.weight} onChangeText={(v: string) => setFormData({...formData, weight: v})} keyboardType="numeric" themeColor={accentColor} /></View>
        </View>
        <FormSelector label={t('cv.form.steps.identity.lateralization')} options={[{ label: t('cv.form.steps.identity.right'), value: 'right' }, { label: t('cv.form.steps.identity.left'), value: 'left' }, { label: t('cv.form.steps.identity.ambi'), value: 'ambi' }]} selectedValue={formData.lateralization} onSelect={(v: string) => setFormData({...formData, lateralization: v})} themeColor={accentColor} themeTextColor={accentTextColor} />
        <TouchableOpacity style={styles.photoUpload} onPress={() => pickImage('profilePhoto')}>
          {formData.profilePhoto ? <Image source={{ uri: formData.profilePhoto }} style={styles.previewImage} /> : <><Ionicons name="camera" size={32} color="#AAA" /><ThemedText style={{color: '#AAA'}}>{t('cv.form.steps.identity.upload_photo')}</ThemedText></>}
        </TouchableOpacity>
        
        <ThemedText style={styles.label}>{t('cv.form.steps.identity.presentation_video')}</ThemedText>
        <TouchableOpacity style={styles.photoUpload} onPress={recordPresentationVideo}>
          {formData.presentationVideo ? (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={32} color={accentColor} />
              <ThemedText style={{color: '#FFF'}}>{t('common.video_selected') || 'Vidéo sélectionnée'}</ThemedText>
            </View>
          ) : (
            <>
              <Ionicons name="videocam" size={32} color="#AAA" />
              <ThemedText style={{color: '#AAA'}}>{t('cv.form.steps.identity.upload_presentation_video')}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </GlassContainer>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.sport.title')} />
      <GlassContainer>
        <FormSelector 
          label={t('cv.form.steps.sport.main_position')} 
          options={[
            { label: t('cv.options.positions.PG'), value: 'PG' }, 
            { label: t('cv.options.positions.SG'), value: 'SG' }, 
            { label: t('cv.options.positions.SF'), value: 'SF' }, 
            { label: t('cv.options.positions.PF'), value: 'PF' }, 
            { label: t('cv.options.positions.C'), value: 'C' }
          ]} 
          selectedValue={formData.mainPosition} 
          onSelect={(v: string) => setFormData({...formData, mainPosition: v})} 
          required 
          themeColor={accentColor}
          themeTextColor={accentTextColor}
        />
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}><FormInput label={t('cv.form.steps.sport.wingspan')} value={formData.wingspan} onChangeText={(v: string) => setFormData({...formData, wingspan: v})} keyboardType="numeric" themeColor={accentColor} /></View>
          <View style={{flex: 1}}><FormInput label={t('cv.form.steps.sport.vertical_leap')} value={formData.verticalLeap} onChangeText={(v: string) => setFormData({...formData, verticalLeap: v})} keyboardType="numeric" themeColor={accentColor} /></View>
        </View>
        <FormSelector 
          label={t('cv.form.steps.sport.category')} 
          options={[
            { label: t('cv.options.categories.U13'), value: 'U13' }, 
            { label: t('cv.options.categories.U15'), value: 'U15' }, 
            { label: t('cv.options.categories.U17'), value: 'U17' }, 
            { label: t('cv.options.categories.U18'), value: 'U18' },
            { label: t('cv.options.categories.U20'), value: 'U20' },
            { label: t('cv.options.categories.U21'), value: 'U21' },
            { label: t('cv.options.categories.SENIOR'), value: 'SENIOR' },
            { label: t('cv.options.categories.ELITE'), value: 'ELITE' },
            { label: t('cv.options.categories.PRO'), value: 'PRO' }
          ]} 
          selectedValue={formData.category} 
          onSelect={(v: string) => setFormData({...formData, category: v})} 
          themeColor={accentColor}
          themeTextColor={accentTextColor}
        />
        <FormInput label={t('cv.form.steps.sport.club')} value={formData.club} onChangeText={(v: string) => setFormData({...formData, club: v})} required themeColor={accentColor} />
        <FormSelector 
          label={t('cv.form.steps.sport.level')} 
          options={[
            { label: t('cv.options.levels.DEPT'), value: 'DEPT' }, 
            { label: t('cv.options.levels.REG'), value: 'REG' }, 
            { label: t('cv.options.levels.NAT'), value: 'NAT' }, 
            { label: t('cv.options.levels.FED'), value: 'FED' },
            { label: t('cv.options.levels.INT'), value: 'INT' }
          ]} 
          selectedValue={formData.level} 
          onSelect={(v: string) => setFormData({...formData, level: v})} 
          themeColor={accentColor}
          themeTextColor={accentTextColor}
        />

        <ThemedText style={styles.label}>{t('cv.form.steps.sport.club_logo')}</ThemedText>
        <TouchableOpacity style={styles.logoUpload} onPress={() => pickImage('clubLogo')}>
          {formData.clubLogo ? (
            <Image source={{ uri: formData.clubLogo }} style={styles.previewLogo} />
          ) : (
            <>
              <Ionicons name="image" size={24} color="#AAA" />
              <ThemedText style={{color: '#AAA', fontSize: 12}}>{t('cv.form.steps.sport.upload_club_logo')}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </GlassContainer>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.stats.title')} />
      <GlassContainer>
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}><FormInput label={t('cv.form.steps.stats.ppg')} value={formData.ppg} onChangeText={(v: string) => setFormData({...formData, ppg: v})} keyboardType="numeric" themeColor={accentColor} /></View>
          <View style={{flex: 1}}><FormInput label={t('cv.form.steps.stats.rpg')} value={formData.rpg} onChangeText={(v: string) => setFormData({...formData, rpg: v})} keyboardType="numeric" themeColor={accentColor} /></View>
        </View>
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}><FormInput label={t('cv.form.steps.stats.apg')} value={formData.apg} onChangeText={(v: string) => setFormData({...formData, apg: v})} keyboardType="numeric" themeColor={accentColor} /></View>
          <View style={{flex: 1}}><FormInput label={t('cv.form.steps.stats.spg')} value={formData.spg} onChangeText={(v: string) => setFormData({...formData, spg: v})} keyboardType="numeric" themeColor={accentColor} /></View>
        </View>
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}><FormInput label={t('cv.form.steps.stats.bpg')} value={formData.bpg} onChangeText={(v: string) => setFormData({...formData, bpg: v})} keyboardType="numeric" themeColor={accentColor} /></View>
          <View style={{flex: 1}}><FormInput label={t('cv.form.steps.stats.fg_percent')} value={formData.fgPercent} onChangeText={(v: string) => setFormData({...formData, fgPercent: v})} keyboardType="numeric" themeColor={accentColor} /></View>
        </View>
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}><FormInput label={t('cv.form.steps.stats.three_percent')} value={formData.threePercent} onChangeText={(v: string) => setFormData({...formData, threePercent: v})} keyboardType="numeric" themeColor={accentColor} /></View>
          <View style={{flex: 1}}><FormInput label={t('cv.form.steps.stats.ft_percent')} value={formData.ftPercent} onChangeText={(v: string) => setFormData({...formData, ftPercent: v})} keyboardType="numeric" themeColor={accentColor} /></View>
        </View>
      </GlassContainer>
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.palmares.title')} />
      <GlassContainer>
        <ThemedText style={styles.label}>{t('cv.form.steps.palmares.title')}</ThemedText>
        {formData.achievements.map((item: any, index: number) => (
          <View key={index} style={styles.achievementItem}>
            <View style={styles.achievementHeader}>
              <ThemedText style={styles.achievementNumber}>#{index + 1}</ThemedText>
              <TouchableOpacity onPress={() => {
                const newAch = [...formData.achievements];
                newAch.splice(index, 1);
                setFormData({...formData, achievements: newAch});
              }}>
                <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
            <FormInput 
              label={t('cv.form.steps.palmares.title_label')} 
              value={item.title} 
              onChangeText={(v: string) => {
                const newAch = [...formData.achievements];
                newAch[index].title = v;
                setFormData({...formData, achievements: newAch});
              }} 
              themeColor={accentColor}
            />
            <View style={styles.row}>
              <View style={{flex: 1, marginRight: 10}}>
                <FormInput 
                  label={t('cv.form.steps.palmares.year_label')} 
                  value={item.year} 
                  onChangeText={(v: string) => {
                    const newAch = [...formData.achievements];
                    newAch[index].year = v;
                    setFormData({...formData, achievements: newAch});
                  }} 
                  themeColor={accentColor}
                />
              </View>
              <View style={{flex: 2}}>
                <FormInput 
                  label={t('cv.form.steps.palmares.competition_label')} 
                  value={item.competition} 
                  onChangeText={(v: string) => {
                    const newAch = [...formData.achievements];
                    newAch[index].competition = v;
                    setFormData({...formData, achievements: newAch});
                  }} 
                  themeColor={accentColor}
                />
              </View>
            </View>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.addAchievementBtn} 
          onPress={() => setFormData({...formData, achievements: [...formData.achievements, { title: '', year: '', competition: '' }]})}
        >
          <Ionicons name="add-circle-outline" size={24} color={accentColor} />
          <ThemedText style={[styles.addAchievementText, { color: accentColor }]}>
            {t('cv.form.steps.palmares.add_title')}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.divider} />

        <FormInput label={t('cv.form.steps.palmares.personal_message')} value={formData.personalMessage} onChangeText={(v: string) => setFormData({...formData, personalMessage: v})} multiline placeholder={t('cv.form.steps.palmares.gemini_button')} themeColor={accentColor} />
        <TouchableOpacity style={[styles.geminiBtn, { backgroundColor: accentColor }]} onPress={generateAIScouting}>
          <Ionicons name="sparkles" size={20} color={accentTextColor} />
          <ThemedText style={[styles.geminiBtnText, { color: accentTextColor }]}>{t('cv.form.steps.palmares.gemini_button')}</ThemedText>
        </TouchableOpacity>
      </GlassContainer>
    </Animated.View>
  );

  const renderStep5 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.videos.title_off')} />
      <QuotaIndicator current={formData.offensiveClips.length} max={currentQuota.off} label={t('cv.form.steps.videos.upload_quota', { current: formData.offensiveClips.length, max: currentQuota.off || '∞' })} themeColor={accentColor} />
      <View style={styles.videoGrid}>
        {formData.offensiveClips.map((clip: any, i: number) => (
          <View key={i} style={styles.videoThumb}>
            <Image source={{ uri: clip.uri }} style={styles.videoPreview} />
            <TouchableOpacity style={styles.deleteClip} onPress={() => setFormData((prev: any) => ({ ...prev, offensiveClips: prev.offensiveClips.filter((_: any, idx: number) => idx !== i) }))}><Ionicons name="close-circle" size={24} color="#FF4D4D" /></TouchableOpacity>
          </View>
        ))}
        {(currentQuota.off === null || formData.offensiveClips.length < currentQuota.off) && (
          <TouchableOpacity style={[styles.addVideoBtn, { borderColor: accentColor, backgroundColor: accentColor + '0D' }]} onPress={() => pickVideo('off')}>{galleryLoading ? <ActivityIndicator color={accentColor} /> : <Ionicons name="add" size={40} color={accentColor} />}</TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderStep6 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.videos.title_def')} />
      <QuotaIndicator current={formData.defensiveClips.length} max={currentQuota.def} label={t('cv.form.steps.videos.upload_quota', { current: formData.defensiveClips.length, max: currentQuota.def || '∞' })} themeColor={accentColor} />
      <View style={styles.videoGrid}>
        {formData.defensiveClips.map((clip: any, i: number) => (
          <View key={i} style={styles.videoThumb}>
            <Image source={{ uri: clip.uri }} style={styles.videoPreview} />
            <TouchableOpacity style={styles.deleteClip} onPress={() => setFormData((prev: any) => ({ ...prev, defensiveClips: prev.defensiveClips.filter((_: any, idx: number) => idx !== i) }))}><Ionicons name="close-circle" size={24} color="#FF4D4D" /></TouchableOpacity>
          </View>
        ))}
        {(currentQuota.def === null || formData.defensiveClips.length < currentQuota.def) && (
          <TouchableOpacity style={[styles.addVideoBtn, { borderColor: accentColor, backgroundColor: accentColor + '0D' }]} onPress={() => pickVideo('def')}>{galleryLoading ? <ActivityIndicator color={accentColor} /> : <Ionicons name="add" size={40} color={accentColor} />}</TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderStep7 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContent}>
      <AnimatedTitle title={t('cv.form.steps.contact.title')} />
      <GlassContainer>
        <FormInput label={t('cv.form.steps.contact.email') || 'Email'} value={formData.email} onChangeText={(v: string) => setFormData({...formData, email: v})} keyboardType="email-address" themeColor={accentColor} />
        <FormInput label={t('cv.form.steps.contact.phone') || 'Téléphone'} value={formData.phone} onChangeText={(v: string) => setFormData({...formData, phone: v})} keyboardType="phone-pad" themeColor={accentColor} />
        <View style={styles.divider} />
        <FormInput label="Instagram" value={formData.instagram} onChangeText={(v: string) => setFormData({...formData, instagram: v})} themeColor={accentColor} />
        <FormInput label="TikTok" value={formData.tiktok} onChangeText={(v: string) => setFormData({...formData, tiktok: v})} themeColor={accentColor} />
        <FormInput label="Facebook" value={formData.facebook} onChangeText={(v: string) => setFormData({...formData, facebook: v})} themeColor={accentColor} />
        <FormInput label="X (Twitter)" value={formData.twitter} onChangeText={(v: string) => setFormData({...formData, twitter: v})} themeColor={accentColor} />
        <FormInput label="YouTube" value={formData.youtube} onChangeText={(v: string) => setFormData({...formData, youtube: v})} themeColor={accentColor} />
        <FormInput label="Snapchat" value={formData.snapchat} onChangeText={(v: string) => setFormData({...formData, snapchat: v})} themeColor={accentColor} />
      </GlassContainer>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={['#0F0F0F', '#1A1A1A']} style={StyleSheet.absoluteFill} />
      <FormStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} themeColor={accentColor} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
          {currentStep === 7 && renderStep7()}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={currentStep > 1 ? () => setCurrentStep(currentStep - 1) : onCancel}>
          <ThemedText style={styles.backBtnText}>{t('cv.form.previous')}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: accentColor }]} 
          onPress={currentStep === TOTAL_STEPS ? handleComplete : () => setCurrentStep(currentStep + 1)} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={accentTextColor} /> : <ThemedText style={[styles.nextBtnText, { color: accentTextColor }]}>{currentStep === TOTAL_STEPS ? t('cv.form.steps.contact.submit') : t('cv.form.next')}</ThemedText>}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  stepContent: { flex: 1 },
  row: { flexDirection: 'row' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
    color: '#CCC',
  },
  photoUpload: { height: 120, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginVertical: 10, overflow: 'hidden' },
  logoUpload: { height: 100, width: 100, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginVertical: 10, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewLogo: { width: '100%', height: '100%', resizeMode: 'contain' },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10 },
  videoThumb: { width: '30%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#333', overflow: 'hidden', position: 'relative' },
  videoPreview: { width: '100%', height: '100%' },
  deleteClip: { position: 'absolute', top: 5, right: 5, zIndex: 10 },
  addVideoBtn: { width: '30%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  geminiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, marginTop: 10 },
  geminiBtnText: { fontWeight: 'bold', marginLeft: 8 },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: 'rgba(0,0,0,0.8)', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'absolute', bottom: 0, left: 0, right: 0 },
  nextBtn: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { fontWeight: 'bold', fontSize: 16 },
  backBtn: { flex: 1, padding: 16, marginRight: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  backBtnText: { color: '#FFF', fontWeight: '600' },
  achievementItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementNumber: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  addAchievementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
  },
  addAchievementText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 15,
  },
});