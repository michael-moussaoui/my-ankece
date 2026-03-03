import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadImageToCloudinary } from '@/services/cloudinaryService';
import { DB_COLLECTIONS } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image as RNImage, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlayerBookings } from '@/components/profile/PlayerBookings';
import { getCoachByUserId } from '@/services/coachService';
import { Coach } from '@/types/coach';

const PERSONALITIES = [
  { id: 'lockdown', label: 'Lockdown Defender', emoji: '🧱' },
  { id: 'clutch', label: 'Clutch Shooter', emoji: '🔥' },
  { id: 'fastbreak', label: 'Fast Break Monster', emoji: '⚡' },
  { id: 'sniper', label: 'Sniper', emoji: '🎯' },
  { id: 'protector', label: 'Paint Protector', emoji: '🛡️' },
  { id: 'playmaker', label: 'Playmaker', emoji: '🪄' },
];

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const cardBackground = colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7';

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [pseudo, setPseudo] = useState(profile?.pseudo || '');
  const [personality, setPersonality] = useState(profile?.personality || '');
  const [position, setPosition] = useState(profile?.position || '');
  const [height, setHeight] = useState(profile?.height || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);

  useEffect(() => {
    const fetchCoach = async () => {
      if (!user) return;
      try {
        const coachData = await getCoachByUserId(user.uid);
        setCoach(coachData);
      } catch (error) {
        console.error('Error fetching coach in profile:', error);
      }
    };
    fetchCoach();
  }, [user]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'L\'accès à votre galerie est nécessaire pour changer votre photo de profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(uri);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, DB_COLLECTIONS.USERS, user.uid);
      await updateDoc(userRef, {
        displayName,
        pseudo,
        personality,
        position,
        height,
        bio,
        city,
        avatarUrl,
      });
      Alert.alert('Succès', 'Votre profil a été mis à jour.');
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', `Impossible de mettre à jour le profil: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
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
          <ThemedText type="subtitle" style={styles.headerTitle}>Modifier mon Profil</ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={tintColor} />
            ) : (
              <ThemedText style={[styles.saveText, { color: tintColor }]}>Enregistrer</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.avatarSection} 
            onPress={handlePickImage}
            disabled={uploading}
          >
            <View style={[styles.avatarCircle, { backgroundColor: cardBackground }]}>
              {uploading ? (
                <ActivityIndicator size="small" color={tintColor} />
              ) : avatarUrl ? (
                <RNImage source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="camera" size={40} color={colorScheme === 'dark' ? '#8e8e93' : '#aeb2b5'} />
              )}
              <View style={[styles.editBadge, { backgroundColor: tintColor }]}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </View>
            <ThemedText style={styles.emailText}>{user?.email}</ThemedText>
            <ThemedText style={[styles.changePhotoText, { color: tintColor }]}>Changer la photo</ThemedText>
          </TouchableOpacity>
          
          {coach && coach.status === 'active' && (
            <View style={[styles.agendaSection, { backgroundColor: cardBackground }]}>
              <View style={styles.agendaInfo}>
                <Ionicons name="calendar" size={24} color={tintColor} />
                <View style={styles.agendaTextContainer}>
                  <ThemedText type="defaultSemiBold">Gestion de l'Agenda</ThemedText>
                  <ThemedText style={styles.agendaSubText}>Gérez vos disponibilités et réservations</ThemedText>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.agendaButton, { backgroundColor: tintColor }]}
                onPress={() => router.push('/coach/agenda')}
              >
                <ThemedText style={styles.agendaButtonText}>Mon Agenda</ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Nom d'affichage</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: cardBackground }]}>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme].text }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Votre nom ou prénom..."
                placeholderTextColor="#8e8e93"
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Pseudo / Surnom</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: cardBackground }]}>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme].text }]}
                value={pseudo}
                onChangeText={setPseudo}
                placeholder="Votre pseudo sur le terrain..."
                placeholderTextColor="#8e8e93"
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Personnalité Basket</ThemedText>
            <View style={styles.personalityGrid}>
              {PERSONALITIES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.personalityItem,
                    { backgroundColor: cardBackground },
                    personality === p.label && { borderColor: tintColor, borderWidth: 2 }
                  ]}
                  onPress={() => setPersonality(p.label)}
                >
                  <ThemedText style={styles.personalityEmoji}>{p.emoji}</ThemedText>
                  <ThemedText style={styles.personalityLabel}>{p.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <ThemedText style={styles.sectionTitle}>Position</ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: cardBackground }]}>
                {/* Simplified for now, could be a picker */}
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={position}
                  onChangeText={setPosition}
                  placeholder="Ex: PG"
                  placeholderTextColor="#8e8e93"
                />
              </View>
            </View>
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={styles.sectionTitle}>Taille (cm)</ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: cardBackground }]}>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Ex: 185"
                  keyboardType="numeric"
                  placeholderTextColor="#8e8e93"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Bio / Description</ThemedText>
            <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: cardBackground }]}>
              <TextInput
                style={[styles.input, styles.textArea, { color: Colors[colorScheme].text }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Parlez-nous de votre jeu..."
                placeholderTextColor="#8e8e93"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Mes Réservations</ThemedText>
            <PlayerBookings playerId={user!.uid} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc3',
  },
  headerTitle: {
    fontWeight: '700',
  },
  backButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
  },
  textAreaContainer: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  textArea: {
    textAlignVertical: 'top',
    width: '100%',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  personalityItem: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personalityEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  personalityLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  agendaSection: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  agendaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  agendaTextContainer: {
    flex: 1,
  },
  agendaSubText: {
    fontSize: 12,
    opacity: 0.6,
  },
  agendaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  agendaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
