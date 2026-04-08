import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { Module, contentService, ChecklistItem } from '@/services/contentService';
import Markdown from 'react-native-markdown-display';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgramViewerProps {
  programId: string;
  userId: string;
  modules: Module[];
  onDrillPress?: (drillId: string) => void;
}

export const ProgramViewer: React.FC<ProgramViewerProps> = ({ programId, userId, modules, onDrillPress }) => {
  const { accentColor } = useAppTheme();
  const [activeModuleIndex, setActiveModuleIndex] = React.useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = React.useState(0);
  const [showFullImage, setShowFullImage] = React.useState(false);
  const [selectedImageSource, setSelectedImageSource] = React.useState<any>(null);
  
  // État de progression : map de { lessonId: string[] }
  const [programProgress, setProgramProgress] = React.useState<Record<string, string[]>>({});
  const [loadingProgress, setLoadingProgress] = React.useState(true);

  const currentModule = modules[activeModuleIndex];
  const currentLesson = currentModule?.lessons[activeLessonIndex];

  // Charger la progression au démarrage
  React.useEffect(() => {
    loadProgress();
  }, [programId, userId]);

  const loadProgress = async () => {
    try {
      setLoadingProgress(true);
      const progress = await contentService.getProgramProgress(userId, programId);
      setProgramProgress(progress);
    } catch (err) {
      console.error("Erreur chargement progression:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Calculer le % de complétion du module actuel
  const getModuleCompletion = (moduleIndex: number) => {
    const targetModule = modules[moduleIndex];
    if (!targetModule) return 0;
    
    let totalItems = 0;
    let completedItemsCount = 0;

    targetModule.lessons.forEach(lesson => {
      if (lesson.checklist) {
        totalItems += lesson.checklist.length;
        const completedInLesson = programProgress[lesson.id] || [];
        completedItemsCount += completedInLesson.length;
      }
    });

    if (totalItems === 0) return 100; // Pas de checklist = accès libre
    return (completedItemsCount / totalItems) * 100;
  };

  const toggleChecklistItem = async (lessonId: string, itemId: string) => {
    const currentCompleted = programProgress[lessonId] || [];
    const isCompleted = currentCompleted.includes(itemId);
    
    let newCompleted;
    if (isCompleted) {
      newCompleted = currentCompleted.filter(id => id !== itemId);
    } else {
      newCompleted = [...currentCompleted, itemId];
    }

    // Mise à jour optimiste UI
    const newProgress = { ...programProgress, [lessonId]: newCompleted };
    setProgramProgress(newProgress);

    // Sauvegarde Firestore
    try {
      await contentService.saveLessonProgress(userId, programId, lessonId, newCompleted);
    } catch (err) {
      console.error("Erreur sauvegarde progression:", err);
    }
  };

  if (!currentModule || !currentLesson) return null;

  // Helper for image rendering
  const renderLessonImage = (imageUrl: string) => {
    // For bundled images (starting with assets/) or remote URLs
    const isRemote = imageUrl.startsWith('http');
    const isLocal = imageUrl.startsWith('assets/');
    
    // Fallback images based on naming if possible
    let source;
    if (isRemote) {
        source = { uri: imageUrl };
    } else if (imageUrl.includes('confidence_cover')) {
        source = require('../../assets/images/academy/confidence_cover.png');
    } else if (imageUrl.includes('shooting_curry')) {
        source = require('../../assets/images/academy/shooting_curry.png');
    } else if (imageUrl.includes('shooting_klay')) {
        source = require('../../assets/images/academy/shooting_klay.png');
    } else if (imageUrl.includes('shooting_pro_stars')) {
        source = require('../../assets/images/academy/shooting_pro_stars.png');
    } else if (imageUrl.includes('shooting_hybrid')) {
        source = require('../../assets/images/academy/shooting_hybrid.png');
    } else if (imageUrl.includes('dribble_kyrie')) {
        source = require('../../assets/images/academy/dribble_kyrie.png');
    } else if (imageUrl.includes('dribble_curry_2ball')) {
        source = require('../../assets/images/academy/dribble_curry_2ball.png');
    } else if (imageUrl.includes('dribble_cp3_cones')) {
        source = require('../../assets/images/academy/dribble_cp3_cones.png');
    } else if (imageUrl.includes('dribble_hybrid')) {
        source = require('../../assets/images/academy/dribble_hybrid.png');
    } else if (imageUrl.includes('wnba_sabrina')) {
        source = require('../../assets/images/academy/wnba_sabrina.png');
    } else if (imageUrl.includes('wnba_stewie')) {
        source = require('../../assets/images/academy/wnba_stewie.png');
    } else if (imageUrl.includes('wnba_caitlin')) {
        source = require('../../assets/images/academy/wnba_caitlin.png');
    } else if (imageUrl.includes('wnba_hybrid')) {
        source = require('../../assets/images/academy/wnba_hybrid.png');
    } else if (imageUrl.includes('pick_and_roll')) {
        source = require('../../assets/images/academy/pick_and_roll_schema.png');
    } else if (imageUrl.includes('flex_cut')) {
        source = require('../../assets/images/academy/flex_cut_schema.png');
    } else if (imageUrl.includes('defense_tactique')) {
        source = require('../../assets/images/academy/defense_tactique_schema.png');
    } else if (imageUrl.includes('mental_routine')) {
        source = require('../../assets/images/academy/mental_routine.png');
    } else if (imageUrl.includes('leadership')) {
        source = require('../../assets/images/academy/leadership.png');
    } else if (imageUrl.includes('recovery_routine')) {
        source = require('../../assets/images/academy/recovery_routine.png');
    } else {
        source = require('../../assets/images/academy/confidence_cover.png');
    }

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => {
          setSelectedImageSource(source);
          setShowFullImage(true);
        }}
      >
        <Image 
          source={source} 
          style={styles.lessonImage}
          contentFit="contain"
        />
        <View style={styles.zoomIconOverlay}>
          <Ionicons name="expand-outline" size={20} color="#FFF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Module Title Indicator */}
      <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
        <ThemedText style={{ color: accentColor, fontWeight: '900', fontSize: 13, letterSpacing: 1.5 }}>
          MODULE {activeModuleIndex + 1} : {currentModule.title.toUpperCase()}
        </ThemedText>
        {currentModule.duration && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <ThemedText style={{ color: '#666', fontSize: 12, fontWeight: 'bold' }}>
              Durée estimée : {currentModule.duration}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Navigation des Leçons du module actif (Dots) */}
      <View style={styles.lessonNav}>
        {currentModule.lessons.map((lesson, idx) => (
          <TouchableOpacity 
            key={lesson.id}
            onPress={() => setActiveLessonIndex(idx)}
            style={[
              styles.lessonDot,
              activeLessonIndex === idx ? { backgroundColor: accentColor, width: 20 } : { backgroundColor: '#333' }
            ]}
          />
        ))}
      </View>

      {/* Contenu de la Leçon */}
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.lessonTitle}>{currentLesson.title}</ThemedText>
        
        {currentLesson.imageUrl && renderLessonImage(currentLesson.imageUrl)}

        <View style={styles.markdownContainer}>
          <Markdown style={markdownStyles}>
            {currentLesson.content}
          </Markdown>
        </View>

        {currentLesson.drills && currentLesson.drills.length > 0 && (
          <View style={styles.drillsContainer}>
            <ThemedText type="defaultSemiBold" style={styles.drillsTitle}>EXERCICES SUGGÉRÉS</ThemedText>
            {currentLesson.drills.map((drillId, idx) => (
              <TouchableOpacity 
                key={drillId + idx} 
                style={[styles.drillActionBtn, { borderColor: accentColor + '30' }]}
                onPress={() => onDrillPress?.(drillId)}
              >
                <View style={[styles.drillIconCircle, { backgroundColor: accentColor + '15' }]}>
                    <Ionicons name="play" size={20} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Session d'Entraînement</ThemedText>
                    <ThemedText style={{ color: '#888', fontSize: 12 }}>Tracker automatique Ankece</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#444" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Section Checklist de Progression */}
        {currentLesson.checklist && currentLesson.checklist.length > 0 && (
          <Animated.View layout={LinearTransition} style={styles.checklistContainer}>
            <ThemedText style={styles.checklistTitle}>TA CHECKLIST DE PROGRESSION</ThemedText>
            {currentLesson.checklist.map((item) => {
              const isDone = (programProgress[currentLesson.id] || []).includes(item.id);
              return (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.checkItem, isDone && { borderColor: accentColor + '40', backgroundColor: accentColor + '05' }]}
                  onPress={() => toggleChecklistItem(currentLesson.id, item.id)}
                >
                  <Ionicons 
                    name={isDone ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={isDone ? accentColor : "#444"} 
                  />
                  <ThemedText style={[styles.checkText, isDone && { color: '#FFF', opacity: 0.8, textDecorationLine: 'line-through' }]}>
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation Bas de page (Suivant/Précédent) */}
      <View style={styles.footerNav}>
          <TouchableOpacity 
            disabled={activeLessonIndex === 0 && activeModuleIndex === 0}
            onPress={() => {
                if (activeLessonIndex > 0) setActiveLessonIndex(activeLessonIndex - 1);
                else if (activeModuleIndex > 0) {
                    const prevModIdx = activeModuleIndex - 1;
                    setActiveModuleIndex(prevModIdx);
                    setActiveLessonIndex(modules[prevModIdx].lessons.length - 1);
                }
            }}
            style={[styles.navBtn, (activeLessonIndex === 0 && activeModuleIndex === 0) && { opacity: 0.3 }]}
          >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <ThemedText style={styles.progressText}>
              {activeLessonIndex + 1} / {currentModule.lessons.length}
          </ThemedText>

          <TouchableOpacity 
            disabled={activeLessonIndex === currentModule.lessons.length - 1 && activeModuleIndex === modules.length - 1}
            onPress={() => {
                if (activeLessonIndex < currentModule.lessons.length - 1) {
                  setActiveLessonIndex(activeLessonIndex + 1);
                } else if (activeModuleIndex < modules.length - 1) {
                  // Vérification du blocage pour passer au module suivant
                  const completion = getModuleCompletion(activeModuleIndex);
                  if (completion < 70) {
                    alert(`Bloqué ! Tu dois compléter au moins 70% de cette phase pour débloquer la suivante (Actuel: ${Math.round(completion)}%).`);
                    return;
                  }
                  setActiveModuleIndex(activeModuleIndex + 1);
                  setActiveLessonIndex(0);
                }
            }}
            style={[
              styles.navBtn, 
              { borderColor: accentColor }, 
              (activeLessonIndex === currentModule.lessons.length - 1 && activeModuleIndex === modules.length - 1) && { opacity: 0.3 }
            ]}
          >
              <Ionicons 
                name={activeLessonIndex === currentModule.lessons.length - 1 && getModuleCompletion(activeModuleIndex) < 70 ? "lock-closed" : "arrow-forward"} 
                size={22} 
                color={accentColor} 
              />
          </TouchableOpacity>
      </View>
      
      {/* Modal de Zoom Plein Écran */}
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
          <Pressable 
            style={styles.modalBackground} 
            onPress={() => setShowFullImage(false)} 
          />
          
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.modalContent}
          >
            <Image 
              source={selectedImageSource} 
              style={styles.fullImage}
              contentFit="contain"
            />
            
            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: accentColor }]}
              onPress={() => setShowFullImage(false)}
            >
              <Ionicons name="contract-outline" size={24} color="#000" />
              <ThemedText style={styles.closeBtnText}>RÉDUIRE</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  moduleNavContainer: {
    display: 'none', // Removed as per request
    height: 60,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  moduleNavContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 20,
  },
  moduleTab: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  moduleTabText: {
    fontSize: 12,
    fontWeight: '900',
    opacity: 0.4,
    letterSpacing: 1,
  },
  lessonNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  lessonDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
    lineHeight: 34,
  },
  lessonImage: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    marginBottom: 24,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  zoomIconOverlay: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '95%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  closeBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  markdownContainer: {
    marginBottom: 40,
  },
  drillsContainer: {
    backgroundColor: '#0A0A0A',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 20,
  },
  drillsTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  drillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  drillIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  footerNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 90,
      backgroundColor: 'rgba(0,0,0,0.9)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 30,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
      borderTopWidth: 1,
      borderTopColor: '#1A1A1A',
  },
  navBtn: {
      width: 50,
      height: 50,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0A0A0A',
  },
  progressText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#666',
  },
  checklistContainer: {
    backgroundColor: '#0A0A0A',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 40,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 10,
  },
  checkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#AAA',
    flex: 1,
  }
});

const markdownStyles: any = {
  body: {
    color: '#CCC',
    fontSize: 16,
    lineHeight: 26,
  },
  heading1: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 20 },
  heading2: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 30, marginBottom: 15 },
  heading3: { color: '#EEE', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  strong: { color: '#FFF', fontWeight: '900' },
  em: { color: '#FFF', fontStyle: 'italic' },
  bullet_list: { marginTop: 10, marginBottom: 10 },
  list_item: { marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start' },
  bullet_list_icon: { color: '#FF4500', marginRight: 10, fontWeight: '900' },
  paragraph: { marginBottom: 15 },
  blockquote: {
      backgroundColor: '#111',
      borderLeftWidth: 4,
      borderLeftColor: '#FF4500',
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginVertical: 15,
      borderRadius: 8,
  },
  hr: { backgroundColor: '#222', height: 1, marginVertical: 30 },
};
