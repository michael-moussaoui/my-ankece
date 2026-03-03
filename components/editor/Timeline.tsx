import { TimelineProps } from '@/types/editor';
import { formatDuration } from '@/utils/timeUtils';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_WIDTH = SCREEN_WIDTH - 32;
const HANDLE_SIZE = 20;

/**
 * Composant Timeline pour naviguer et découper la vidéo
 */
export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  trimStart,
  trimEnd,
  onSeek,
  onTrimChange,
  textOverlays,
  statsOverlays,
}) => {
  const playheadPosition = useSharedValue((currentTime / duration) * TIMELINE_WIDTH);
  const trimStartPosition = useSharedValue((trimStart / duration) * TIMELINE_WIDTH);
  const trimEndPosition = useSharedValue((trimEnd / duration) * TIMELINE_WIDTH);

  // Mise à jour de la position du playhead
  React.useEffect(() => {
    playheadPosition.value = withSpring((currentTime / duration) * TIMELINE_WIDTH);
  }, [currentTime, duration]);

  // Gesture pour déplacer le playhead
  const playheadGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(TIMELINE_WIDTH, event.translationX + playheadPosition.value));
      playheadPosition.value = newPosition;
    })
    .onEnd(() => {
      const newTime = (playheadPosition.value / TIMELINE_WIDTH) * duration;
      runOnJS(onSeek)(newTime);
    });

  // Gesture pour le trim start
  const trimStartGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(trimEndPosition.value - 20, event.translationX + trimStartPosition.value));
      trimStartPosition.value = newPosition;
    })
    .onEnd(() => {
      const newStart = (trimStartPosition.value / TIMELINE_WIDTH) * duration;
      const newEnd = (trimEndPosition.value / TIMELINE_WIDTH) * duration;
      runOnJS(onTrimChange)(newStart, newEnd);
    });

  // Gesture pour le trim end
  const trimEndGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newPosition = Math.max(trimStartPosition.value + 20, Math.min(TIMELINE_WIDTH, event.translationX + trimEndPosition.value));
      trimEndPosition.value = newPosition;
    })
    .onEnd(() => {
      const newStart = (trimStartPosition.value / TIMELINE_WIDTH) * duration;
      const newEnd = (trimEndPosition.value / TIMELINE_WIDTH) * duration;
      runOnJS(onTrimChange)(newStart, newEnd);
    });

  const playheadStyle = useAnimatedStyle(() => ({
    left: playheadPosition.value,
  }));

  const trimStartStyle = useAnimatedStyle(() => ({
    left: trimStartPosition.value,
  }));

  const trimEndStyle = useAnimatedStyle(() => ({
    left: trimEndPosition.value,
  }));

  const trimAreaStyle = useAnimatedStyle(() => ({
    left: trimStartPosition.value,
    width: trimEndPosition.value - trimStartPosition.value,
  }));

  return (
    <View style={styles.container} testID="video-timeline">
      {/* Durée totale */}
      <View style={styles.durationInfo}>
        <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
      </View>

      {/* Timeline principale */}
      <View style={styles.timeline}>
        {/* Zone de trim */}
        <Animated.View style={[styles.trimArea, trimAreaStyle]} />

        {/* Overlays de texte sur la timeline */}
        {textOverlays.map((overlay) => {
          const left = (overlay.startTime / duration) * TIMELINE_WIDTH;
          const width = ((overlay.endTime - overlay.startTime) / duration) * TIMELINE_WIDTH;
          
          return (
            <View
              key={overlay.id}
              testID={`timeline-text-${overlay.id}`}
              style={[
                styles.timelineOverlay,
                { left, width, backgroundColor: overlay.color },
              ]}
            />
          );
        })}

        {/* Handle de trim start */}
        <GestureDetector gesture={trimStartGesture}>
          <Animated.View
            testID="trim-start-handle"
            style={[styles.trimHandle, styles.trimHandleStart, trimStartStyle]}
          >
            <View style={styles.trimHandleBar} />
          </Animated.View>
        </GestureDetector>

        {/* Handle de trim end */}
        <GestureDetector gesture={trimEndGesture}>
          <Animated.View
            testID="trim-end-handle"
            style={[styles.trimHandle, styles.trimHandleEnd, trimEndStyle]}
          >
            <View style={styles.trimHandleBar} />
          </Animated.View>
        </GestureDetector>

        {/* Playhead */}
        <GestureDetector gesture={playheadGesture}>
          <Animated.View style={[styles.playhead, playheadStyle]}>
            <View style={styles.playheadHandle} />
            <View style={styles.playheadLine} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Durée du trim */}
      <View style={styles.trimDuration} testID="trim-duration-display">
        <Text style={styles.trimDurationText}>
          Durée sélectionnée: {formatDuration(trimEnd - trimStart)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  durationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeline: {
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 16,
    position: 'relative',
    overflow: 'visible',
  },
  trimArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderRadius: 8,
  },
  timelineOverlay: {
    position: 'absolute',
    top: 5,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
  trimHandle: {
    position: 'absolute',
    top: -5,
    width: HANDLE_SIZE,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  trimHandleStart: {
    marginLeft: -HANDLE_SIZE / 2,
  },
  trimHandleEnd: {
    marginLeft: -HANDLE_SIZE / 2,
  },
  trimHandleBar: {
    width: 4,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    top: -10,
    width: 2,
    height: 80,
    alignItems: 'center',
    zIndex: 5,
  },
  playheadHandle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginBottom: 2,
  },
  playheadLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  trimDuration: {
    marginTop: 8,
    alignItems: 'center',
  },
  trimDurationText: {
    fontSize: 12,
    color: '#666',
  },
});