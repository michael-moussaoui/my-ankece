import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MediaAsset, MediaPickerProps } from '@/types/media';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Composant pour sélectionner des médias (vidéos/images) depuis la galerie
 */
export const MediaPicker: React.FC<MediaPickerProps> = ({
  onMediaSelected,
  mediaType = 'video',
  maxDuration = 120,
  maxFileSize,
  color,
}) => {
  const { accentColor } = useAppTheme();
  const colorScheme = useColorScheme();
  const tintColor = color || accentColor || Colors[colorScheme].tint;
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pickMedia = async () => {
    try {
      setIsLoading(true);

      // Demander les permissions
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!granted) {
        setPermissionDenied(true);
        Alert.alert(
          'Permission requise',
          'Vous devez autoriser l\'accès à la galerie pour sélectionner des médias.'
        );
        return;
      }

      setPermissionDenied(false);

      // Déterminer le type de média à sélectionner
      let pickerMediaTypes: string[];
      if (mediaType === 'video') {
        pickerMediaTypes = ['videos'];
      } else if (mediaType === 'image') {
        pickerMediaTypes = ['images'];
      } else {
        pickerMediaTypes = ['images', 'videos'];
      }

      // Ouvrir le sélecteur
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: pickerMediaTypes,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: maxDuration,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Vérifier la durée maximale pour les vidéos
        if (asset.type === 'video' && asset.duration && asset.duration > maxDuration * 1000) {
          Alert.alert(
            'Vidéo trop longue',
            `La vidéo ne doit pas dépasser ${maxDuration} secondes.`
          );
          return;
        }

        // Vérifier la taille du fichier si spécifiée
        if (maxFileSize && asset.fileSize && asset.fileSize > maxFileSize * 1024 * 1024) {
          Alert.alert(
            'Fichier trop volumineux',
            `Le fichier ne doit pas dépasser ${maxFileSize} MB.`
          );
          return;
        }

        const mediaAsset: MediaAsset = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type as 'video' | 'image',
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        };

        onMediaSelected(mediaAsset);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du média:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le média');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Chargement...';
    if (mediaType === 'video') return 'Sélectionner une vidéo';
    if (mediaType === 'image') return 'Sélectionner une image';
    return 'Sélectionner un média';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="media-picker-button"
        style={[
          styles.button,
          { backgroundColor: tintColor },
          isLoading && styles.buttonDisabled
        ]}
        onPress={pickMedia}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
      
      {permissionDenied && (
        <Text style={styles.errorText}>
          Permission d&apos;accès à la galerie refusée
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});