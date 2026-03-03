import { useAppTheme } from '@/context/ThemeContext';
import { expertAiService, ExpertAnalysisResponse } from '@/services/ai/expertAiService';
import { EditedVideo, ShotAnalysisData, TextOverlay, VideoEditorProps } from '@/types/editor';
import { formatDuration } from '@/utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';
import { ExpertAnalysisReport } from '../analysis/ExpertAnalysisReport';
import { ShotAnalysisEditor } from './ShotAnalysisEditor';
import { TextEditor } from './TextEditor';
import { Timeline } from './Timeline';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Éditeur vidéo complet avec timeline, trim et overlays
 */
export const VideoEditor: React.FC<VideoEditorProps> = ({
  video,
  template,
  onSave,
  onCancel,
}) => {
  const { accentColor } = useAppTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(video.duration || 30000);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [editingOverlay, setEditingOverlay] = useState<TextOverlay | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  
  // Shot Analysis State
  const [showShotAnalysis, setShowShotAnalysis] = useState(false);
  const [shotAnalysisData, setShotAnalysisData] = useState<ShotAnalysisData | undefined>(undefined);
  
  // Expert AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expertReport, setExpertReport] = useState<ExpertAnalysisResponse | null>(null);
  const [showExpertReport, setShowExpertReport] = useState(false);

  // Initialiser le lecteur vidéo
  const player = useVideoPlayer(video.uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Mise à jour du temps actuel
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (player && isPlaying) {
        setCurrentTime(player.currentTime * 1000); // Convertir en ms
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlaying]);

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (player) {
      player.currentTime = time / 1000; // Convertir en secondes
      setCurrentTime(time);
    }
  };

  const handleTrimChange = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  };

  const handleAddText = () => {
    setEditingOverlay(null);
    setShowTextEditor(true);
  };

  const handleEditOverlay = (overlay: TextOverlay) => {
    setEditingOverlay(overlay);
    setShowTextEditor(true);
  };

  const handleSaveTextOverlay = (overlay: TextOverlay) => {
    if (editingOverlay) {
      // Modifier un overlay existant
      setTextOverlays(textOverlays.map(o => o.id === overlay.id ? overlay : o));
    } else {
      // Ajouter un nouveau overlay
      setTextOverlays([...textOverlays, overlay]);
    }
    setShowTextEditor(false);
    setEditingOverlay(null);
  };

  const handleDeleteOverlay = (overlayId: string) => {
    Alert.alert(
      'Supprimer le texte',
      'Voulez-vous vraiment supprimer ce texte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setTextOverlays(textOverlays.filter(o => o.id !== overlayId));
          },
        },
      ]
    );
  };

  const handleSaveShotAnalysis = (data: ShotAnalysisData) => {
      setShotAnalysisData(data);
      setShowShotAnalysis(false);
  };

  const handleSave = () => {
    const editedVideo: EditedVideo = {
      originalVideo: video,
      template,
      trim: {
        startTime: trimStart,
        endTime: trimEnd,
      },
      textOverlays,
      statsOverlays: [],
      shotAnalysis: shotAnalysisData,
    };

    onSave(editedVideo);
  };

  const handleExpertAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const result = await expertAiService.analyzeVideo(video.uri);
      setExpertReport(result);
      setShowExpertReport(true);
    } catch (error) {
      console.error('Expert Analysis Error:', error);
      Alert.alert('Erreur', "Impossible de contacter le service d'analyse IA. Vérifiez que le serveur Python est lancé.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filtrer les overlays visibles au temps actuel
  const visibleOverlays = textOverlays.filter(
    overlay => currentTime >= overlay.startTime && currentTime <= overlay.endTime
  );
  
  // Générer le path SVG pour l'analyse (même logique que ShotAnalysisEditor, duplication pour l'instant)
    const trajectoryPath = useMemo(() => {
        if (!shotAnalysisData?.releasePoint || !shotAnalysisData?.hoopPoint) return '';
        
        const w = SCREEN_WIDTH;
        const h = SCREEN_WIDTH * (9/16);
        
        const sx = (shotAnalysisData.releasePoint.x / 100) * w;
        const sy = (shotAnalysisData.releasePoint.y / 100) * h;
        
        const ex = (shotAnalysisData.hoopPoint.x / 100) * w;
        const ey = (shotAnalysisData.hoopPoint.y / 100) * h;

        if (shotAnalysisData.apexPoint) {
            const ax = (shotAnalysisData.apexPoint.x / 100) * w;
            const ay = (shotAnalysisData.apexPoint.y / 100) * h;
            
            const cx = 2 * ax - 0.5 * sx - 0.5 * ex;
            const cy = 2 * ay - 0.5 * sy - 0.5 * ey;
            
            return `M ${sx},${sy} Q ${cx},${cy} ${ex},${ey}`;
        }
        
        return '';
    }, [shotAnalysisData]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container} testID="video-editor">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="cancel-button"
            onPress={onCancel}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Éditeur</Text>
          
          <TouchableOpacity
            testID="save-button"
            onPress={handleSave}
            style={styles.headerButton}
          >
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Template appliqué */}
          {template && (
            <View style={styles.templateInfo} testID="applied-template-indicator">
              <Ionicons name="layers-outline" size={20} color={accentColor} />
              <Text style={[styles.templateText, { color: accentColor }]}>Template: {template.name}</Text>
            </View>
          )}

          {/* Prévisualisation vidéo */}
          <View style={styles.videoContainer} testID="editor-video-preview">
            <VideoView
              style={styles.video}
              player={player}
              nativeControls={false}
            />
            
            {/* Visualisation de l'analyse (statique) */}
            {shotAnalysisData && !showShotAnalysis && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Svg height="100%" width="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_WIDTH * (9/16)}`}>
                        {trajectoryPath ? (
                            <Path
                                d={trajectoryPath}
                                stroke={shotAnalysisData.isGoodShot ? "#34C759" : "#FF3B30"}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={[10, 5]}
                            />
                        ) : null}
                         {shotAnalysisData.releasePoint && (
                            <Circle
                                cx={(shotAnalysisData.releasePoint.x / 100) * SCREEN_WIDTH}
                                cy={(shotAnalysisData.releasePoint.y / 100) * (SCREEN_WIDTH * (9/16))}
                                r="4"
                                fill="#FFFFFF"
                            />
                        )}
                        {shotAnalysisData.hoopPoint && (
                            <Circle
                                cx={(shotAnalysisData.hoopPoint.x / 100) * SCREEN_WIDTH}
                                cy={(shotAnalysisData.hoopPoint.y / 100) * (SCREEN_WIDTH * (9/16))}
                                r="6"
                                stroke="#FF3B30"
                                strokeWidth="2"
                                fill="none"
                            />
                        )}
                    </Svg>
                </View>
            )}

            {/* Overlays de texte */}
            {visibleOverlays.map(overlay => (
              <TouchableOpacity
                key={overlay.id}
                testID={`text-overlay-${overlay.id}`}
                style={[
                  styles.textOverlay,
                  {
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                  },
                ]}
                onPress={() => handleEditOverlay(overlay)}
                onLongPress={() => handleDeleteOverlay(overlay.id)}
              >
                <Text
                  style={[
                    styles.overlayText,
                    {
                      fontSize: overlay.fontSize,
                      color: overlay.color,
                      fontWeight: overlay.fontWeight,
                    },
                  ]}
                >
                  {overlay.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contrôles de lecture */}
          <View style={styles.playbackControls}>
            <TouchableOpacity
              testID="play-pause-button"
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color={accentColor}
              />
            </TouchableOpacity>
            <Text style={styles.timeDisplay} testID="current-time-display">
              {formatDuration(currentTime)} / {formatDuration(video.duration || 0)}
            </Text>
          </View>

          {/* Timeline */}
          <View testID="trim-controls">
            <Timeline
              duration={video.duration || 30000}
              currentTime={currentTime}
              trimStart={trimStart}
              trimEnd={trimEnd}
              onSeek={handleSeek}
              onTrimChange={handleTrimChange}
              textOverlays={textOverlays}
              statsOverlays={[]}
            />
          </View>

          {/* Barre d'outils */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              testID="add-text-button"
              style={styles.toolButton}
              onPress={handleAddText}
            >
              <Ionicons name="text" size={24} color={accentColor} />
              <Text style={[styles.toolButtonText, { color: accentColor }]}>Texte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => setShowShotAnalysis(true)}
            >
              <Ionicons name="basketball-outline" size={24} color={accentColor} />
              <Text style={[styles.toolButtonText, { color: accentColor }]}>Analyse Tir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, styles.toolButtonDisabled]}
              disabled
            >
              <Ionicons name="stats-chart" size={24} color="#ccc" />
              <Text style={[styles.toolButtonText, styles.toolButtonTextDisabled]}>
                Stats
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleExpertAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color={accentColor} />
              ) : (
                <Ionicons name="diamond-outline" size={24} color={accentColor} />
              )}
              <Text style={[styles.toolButtonText, { color: accentColor }]}>Expert AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, styles.toolButtonDisabled]}
              disabled
            >
              <Ionicons name="color-filter" size={24} color="#ccc" />
              <Text style={[styles.toolButtonText, styles.toolButtonTextDisabled]}>
                Filtre
              </Text>
            </TouchableOpacity>
          </View>

          {/* Liste des overlays */}
          {textOverlays.length > 0 && (
            <View style={styles.overlaysList}>
              <Text style={styles.overlaysListTitle}>Textes ajoutés ({textOverlays.length})</Text>
              {textOverlays.map(overlay => (
                <TouchableOpacity
                  key={overlay.id}
                  style={styles.overlayItem}
                  onPress={() => handleEditOverlay(overlay)}
                >
                  <View style={styles.overlayItemLeft}>
                    <Ionicons name="text" size={20} color="#666" />
                    <Text style={styles.overlayItemText} numberOfLines={1}>
                      {overlay.text}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID="delete-text-button"
                    onPress={() => handleDeleteOverlay(overlay.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Éditeur de texte */}
        <TextEditor
          visible={showTextEditor}
          overlay={editingOverlay || undefined}
          onSave={handleSaveTextOverlay}
          onCancel={() => {
            setShowTextEditor(false);
            setEditingOverlay(null);
          }}
          currentTime={currentTime}
          videoDuration={video.duration || 30000}
        />
        
        {/* Éditeur d'analyse de tir */}
        <ShotAnalysisEditor
            visible={showShotAnalysis}
            currentTime={currentTime}
            onSave={handleSaveShotAnalysis}
            onCancel={() => setShowShotAnalysis(false)}
            initialData={shotAnalysisData}
        />

        {/* Modal pour le rapport d'expert */}
        <Modal
            visible={showExpertReport}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowExpertReport(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {expertReport && (
                        <ExpertAnalysisReport 
                            data={expertReport} 
                            onClose={() => setShowExpertReport(false)} 
                        />
                    )}
                </View>
            </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
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
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  templateText: {
    fontSize: 14,
    color: '#007AFF', // Replaced #7c3aed with accentColor (represented by #007AFF for consistency with other accentColor uses)
    fontWeight: '500',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9 / 16),
    backgroundColor: '#000',
    marginVertical: 16,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
  },
  overlayText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    gap: 16,
  },
  playButton: {
    padding: 8,
  },
  timeDisplay: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
  },
  toolButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'transparent'
  },
  toolButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  toolButtonTextDisabled: {
    color: '#ccc',
  },
  overlaysList: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginTop: 16,
  },
  overlaysListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  overlayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  overlayItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  overlayItemText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});