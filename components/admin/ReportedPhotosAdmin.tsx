import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deletePlaygroundImage, getPlaygroundImages } from '@/services/playgroundService';
import { getAllPhotoReports, PhotoReport } from '@/services/reportService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface PlaygroundWithReports {
  playgroundId: string;
  imageId: string;
  imageUrl: string;
  reportCount: number;
  reports: PhotoReport[];
}

export const ReportedPhotosAdmin = () => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [loading, setLoading] = useState(false);
  const [reportedPhotos, setReportedPhotos] = useState<PlaygroundWithReports[]>([]);

  const loadReportedPhotos = async () => {
    setLoading(true);
    try {
      // Get all reports from centralized collection
      const allReports = await getAllPhotoReports();
      
      // Group reports by playground + image
      const groupedReports = new Map<string, PhotoReport[]>();
      allReports.forEach(report => {
        const key = `${report.playgroundId}_${report.imageId}`;
        if (!groupedReports.has(key)) {
          groupedReports.set(key, []);
        }
        groupedReports.get(key)!.push(report);
      });

      // Convert to array with image data
      const reportedPhotosArray: PlaygroundWithReports[] = [];
      for (const [key, reports] of groupedReports.entries()) {
        const [playgroundId, imageId] = key.split('_');
        
        // Get image URL from Firestore
        const images = await getPlaygroundImages(playgroundId);
        const image = images.find(img => img.id === imageId);
        
        if (image) {
          reportedPhotosArray.push({
            playgroundId,
            imageId,
            imageUrl: image.url,
            reportCount: reports.length,
            reports: reports,
          });
        }
      }

      setReportedPhotos(reportedPhotosArray);
    } catch (error) {
      console.error('Error loading reported photos:', error);
      Alert.alert('Erreur', 'Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (playgroundId: string, imageId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaygroundImage(playgroundId, imageId);
              Alert.alert('Succès', 'Photo supprimée avec succès');
              loadReportedPhotos();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadReportedPhotos();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Photos signalées</ThemedText>
        <TouchableOpacity onPress={loadReportedPhotos}>
          <Ionicons name="refresh" size={24} color={tintColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={tintColor} style={{marginTop: 20}} />
      ) : reportedPhotos.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
          <ThemedText style={{marginTop: 16, opacity: 0.5}}>
            Aucune photo signalée
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={reportedPhotos}
          keyExtractor={(item) => item.playgroundId + item.imageId}
          renderItem={({ item }) => (
            <ThemedView style={styles.reportCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
              <View style={styles.reportInfo}>
                <ThemedText type="defaultSemiBold">Terrain #{item.playgroundId}</ThemedText>
                <ThemedText style={{fontSize: 12, opacity: 0.7}}>
                  {item.reportCount} signalement{item.reportCount > 1 ? 's' : ''}
                </ThemedText>
                {item.reports.slice(0, 3).map((report, idx) => (
                  <ThemedText key={idx} style={{fontSize: 11, opacity: 0.6}}>
                    • {report.reason}
                  </ThemedText>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: '#ff6b6b' }]}
                onPress={() => handleDeletePhoto(item.playgroundId, item.imageId)}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
              </TouchableOpacity>
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
  },
});
