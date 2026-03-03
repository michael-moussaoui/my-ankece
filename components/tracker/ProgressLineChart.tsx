import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressChartProps {
  data: number[]; // Array of values (e.g., % shooting)
  height?: number;
}

export const ProgressLineChart = ({ data, height = 150 }: ProgressChartProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor: tintColor } = useAppTheme();
  const width = SCREEN_WIDTH - 48;

  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = 0;
  const range = max - min;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return { x, y };
  });

  const pathData = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Smooth curves (cubic bezier)
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cp1x} ${prev.y}, ${cp1x} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tintColor} stopOpacity="0.4" />
            <Stop offset="1" stopColor={tintColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Grid Lines */}
        {[0, 0.5, 1].map((level) => {
          const y = height - level * height;
          return (
            <Rect 
              key={`grid-${level}`}
              x="0" y={y} width={width} height="0.5" 
              fill={colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
            />
          );
        })}

        <Path d={areaData} fill="url(#grad)" />
        <Path d={pathData} stroke={tintColor} strokeWidth="3" fill="none" />
        
        {/* Last point indicator */}
        <Circle 
          cx={points[points.length - 1].x} 
          cy={points[points.length - 1].y} 
          r="5" 
          fill={tintColor} 
          stroke={colorScheme === 'dark' ? '#1C1C1E' : '#fff'} 
          strokeWidth="2" 
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
});
