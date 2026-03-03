import { VideoPreviewProps } from '@/types/video';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  video,
  onClose,
  onEdit,
  showControls = true,
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);

  // Initialisation du lecteur
  const player = useVideoPlayer(video.uri, (player) => {
    player.loop = true;
    player.muted = isMuted;
    if (autoPlay) player.play();
  });

  // Écouteur pour synchroniser l'état si l'utilisateur utilise les contrôles natifs
  useEffect(() => {
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    return () => subscription.remove();
  }, [player]);

  // Actions de contrôle
  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    const newMuteStatus = !isMuted;
    setIsMuted(newMuteStatus);
    player.muted = newMuteStatus;
  };

  // Helpers de formatage
  const formatDuration = (ms: number | null | undefined): string => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} testID="video-preview-container">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.fileName} numberOfLines={1}>
            {video.fileName || 'Vidéo sélectionnée'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{formatDuration(video.duration)}</Text>
            <Text style={styles.infoDivider}>•</Text>
            <Text style={styles.infoText}>
              {video.width}x{video.height}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {onEdit && (
            <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
              <Ionicons name="cut-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          {onClose && (
            <TouchableOpacity style={styles.iconButton} onPress={onClose}>
              <Ionicons name="close" size={26} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Zone Vidéo - Flexible pour supporter 9:16 ou 16:9 */}
      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain" // Très important pour ne pas déformer la vidéo
        />
        
        {/* Play/Pause Overlay géant au centre (Optionnel, style pro) */}
        {!isPlaying && (
          <TouchableOpacity style={styles.centerPlayButton} onPress={handlePlayPause}>
            <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Barre de contrôles basse */}
      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleMuteToggle}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 12 },
  fileName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  infoText: { fontSize: 12, color: '#888' },
  infoDivider: { marginHorizontal: 6, color: '#ccc' },
  iconButton: { padding: 4 },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  centerPlayButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    padding: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },
  controlButton: {
    padding: 5,
  },
});