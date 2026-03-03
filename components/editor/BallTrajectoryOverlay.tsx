import { BallPosition, TrajectoryAnalysis } from '@/services/ai/trajectoryAnalyzer';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BallTrajectoryOverlayProps {
  ballPositions: BallPosition[];
  trajectoryAnalysis: TrajectoryAnalysis | null;
  width: number;
  height: number;
}

/**
 * Overlay component to render ball trajectory with color-coded path
 */
export const BallTrajectoryOverlay: React.FC<BallTrajectoryOverlayProps> = ({
  ballPositions,
  trajectoryAnalysis,
  width,
  height,
}) => {
  const { t } = useTranslation();
  // Scale factors to convert from tensor coordinates to screen coordinates
  const scaleX = SCREEN_WIDTH / width;
  const scaleY = SCREEN_HEIGHT / height;

  /**
   * Generate SVG path from ball positions
   */
  const generatePath = (): string => {
    if (ballPositions.length < 2) return '';

    const scaledPositions = ballPositions.map(pos => ({
      x: pos.x * scaleX,
      y: pos.y * scaleY,
    }));

    // Start path
    let path = `M ${scaledPositions[0].x} ${scaledPositions[0].y}`;

    // Create smooth curve using quadratic bezier curves
    for (let i = 1; i < scaledPositions.length; i++) {
      const curr = scaledPositions[i];
      const prev = scaledPositions[i - 1];
      
      // Control point for smooth curve
      const cpX = (prev.x + curr.x) / 2;
      const cpY = (prev.y + curr.y) / 2;
      
      path += ` Q ${prev.x} ${prev.y}, ${cpX} ${cpY}`;
    }

    // End at last position
    const last = scaledPositions[scaledPositions.length - 1];
    path += ` L ${last.x} ${last.y}`;

    return path;
  };

  const trajectoryPath = generatePath();
  const trajectoryColor = trajectoryAnalysis?.color || '#FFFFFF';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Draw basket rim if detected */}
        {trajectoryAnalysis?.basketPosition && (
          <Circle
            cx={trajectoryAnalysis.basketPosition.x * scaleX}
            cy={trajectoryAnalysis.basketPosition.y * scaleY}
            r={trajectoryAnalysis.basketPosition.radius * scaleX}
            stroke="#FF3B30"
            strokeWidth={4}
            fill="rgba(255, 59, 48, 0.2)"
            opacity={0.8}
          />
        )}

        {/* Draw trajectory path */}
        {trajectoryPath && (
          <Path
            d={trajectoryPath}
            stroke={trajectoryColor}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        )}

        {/* Draw ball positions as dots */}
        {ballPositions.map((pos, index) => (
          <Circle
            key={`${pos.timestamp}-${index}`}
            cx={pos.x * scaleX}
            cy={pos.y * scaleY}
            r={6}
            fill={trajectoryColor}
            opacity={0.6}
          />
        ))}

        {/* Draw current ball position (larger) */}
        {ballPositions.length > 0 && (
          <Circle
            cx={ballPositions[ballPositions.length - 1].x * scaleX}
            cy={ballPositions[ballPositions.length - 1].y * scaleY}
            r={12}
            fill={trajectoryColor}
            opacity={0.9}
          />
        )}
      </Svg>

      {/* Trajectory metrics overlay */}
      {trajectoryAnalysis && (
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: trajectoryAnalysis.color, borderColor: '#fff', borderWidth: 1 }]}>
            <Text style={styles.metricLabel}>{t('analysis.trajectory_quality')}</Text>
            <Text style={styles.metricValue}>
              {trajectoryAnalysis.shotResult === 'made' ? `✓ ${t('analysis.made')}` :
               trajectoryAnalysis.quality === 'optimal' ? `✓ ${t('analysis.optimal')}` :
               trajectoryAnalysis.quality === 'too-low' ? `↓ ${t('analysis.too_low')}` :
               `↑ ${t('analysis.too_high')}`}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('analysis.release_angle')}</Text>
            <Text style={styles.metricValue}>
              {trajectoryAnalysis.releaseAngle.toFixed(1)}°
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('analysis.arc_analysis')}</Text>
            <Text style={styles.metricValue}>
              {trajectoryAnalysis.arcHeight.toFixed(0)}px
            </Text>
          </View>
        </View>
      )}

      {/* Shot success/miss badge */}
      {trajectoryAnalysis?.shotResult && trajectoryAnalysis.shotResult !== 'unknown' && (
        <Animated.View 
          entering={ZoomIn.duration(500)}
          style={[
            styles.resultBadge,
            { backgroundColor: trajectoryAnalysis.shotResult === 'made' ? '#00F2FF' : '#FF3B30' }
          ]}
        >
          <Text style={[styles.resultText, { color: trajectoryAnalysis.shotResult === 'made' ? '#000' : '#fff' }]}>
            {trajectoryAnalysis.shotResult === 'made' ? `✓ ${t('analysis.made').toUpperCase()}` : `✗ ${t('analysis.missed').toUpperCase()}`}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metricsContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  metricCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  resultBadge: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
