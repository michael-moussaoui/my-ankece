import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { challengeService } from '@/services/challengeService';

export default function CreateChallengeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [pointsSuccess, setPointsSuccess] = useState('50');
  const [pointsFailure, setPointsFailure] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    if (!title || !description || !objective) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setLoading(true);
      await challengeService.createChallenge(user.uid, profile?.displayName || 'Joueur', {
        title,
        description,
        objective,
        pointsSuccess: parseInt(pointsSuccess),
        pointsFailure: parseInt(pointsFailure),
        pointsCreator: 5,
      });

      Alert.alert('Succès', 'Challenge créé avec succès !');
      router.back();
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Erreur', 'Impossible de créer le challenge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <ThemedText type="title">Nouveau Challenge</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Titre du challenge *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA', color: colorScheme === 'dark' ? '#FFF' : '#000' }]}
              placeholder="Ex: 50 paniers à 3 pts"
              placeholderTextColor="#8E8E93"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA', color: colorScheme === 'dark' ? '#FFF' : '#000' }]}
              placeholder="Décrit ton défi à la communauté..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Objectif précis *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA', color: colorScheme === 'dark' ? '#FFF' : '#000' }]}
              placeholder="Ex: Réussir 50 tirs en moins de 10 min"
              placeholderTextColor="#8E8E93"
              value={objective}
              onChangeText={setObjective}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Points (Succès)</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA', color: colorScheme === 'dark' ? '#FFF' : '#000' }]}
                keyboardType="numeric"
                value={pointsSuccess}
                onChangeText={setPointsSuccess}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Points (Échec)</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA', color: colorScheme === 'dark' ? '#FFF' : '#000' }]}
                keyboardType="numeric"
                value={pointsFailure}
                onChangeText={setPointsFailure}
              />
            </View>
          </View>

          <ThemedText style={styles.infoText}>
            Tu gagneras 5 points à chaque fois qu'un joueur participera à ton challenge !
          </ThemedText>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: accentColor }]}
            onPress={handleCreate}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Création...' : 'Publier le challenge'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  submitButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
