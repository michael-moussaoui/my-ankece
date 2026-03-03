import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RadarData {
  label: string;
  value: number; // 0 to 1
}

interface RadarChartProps {
  data: RadarData[];
  size?: number;
}

export const RadarChart = ({ data, size = SCREEN_WIDTH - 80 }: RadarChartProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor: tintColor } = useAppTheme();
  
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (value: number, angle: number) => {
    const x = center + radius * value * Math.cos(angle - Math.PI / 2);
    const y = center + radius * value * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Background Webs
  const webs = [0.25, 0.5, 0.75, 1].map((level) => {
    return data.map((_, i) => getPoint(level, i * angleStep));
  });

  // Data Polygon
  const points = data
    .map((d, i) => {
      const p = getPoint(d.value, i * angleStep);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Radar Web */}
        {webs.map((webPoints, i) => (
          <Polygon
            key={`web-${i}`}
            points={webPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="transparent"
            stroke={colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {data.map((_, i) => {
          const p = getPoint(1, i * angleStep);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke={colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const p = getPoint(1.2, i * angleStep);
          return (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              fill={colorScheme === 'dark' ? '#fff' : '#000'}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label}
            </SvgText>
          );
        })}

        {/* Data Area */}
        <Polygon
          points={points}
          fill={tintColor + '40'}
          stroke={tintColor}
          strokeWidth="3"
        />

        {/* Data Points */}
        {data.map((d, i) => {
          const p = getPoint(d.value, i * angleStep);
          return (
            <Circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={tintColor}
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
