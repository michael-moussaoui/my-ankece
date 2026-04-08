import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressChartProps {
  data: number[]; // Array of values (e.g., % shooting)
  height?: number;
  max?: number;
  unit?: string;
}

export const ProgressLineChart = ({ data, height = 160, max: providedMax, unit = '' }: ProgressChartProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor: tintColor } = useAppTheme();
  const width = SCREEN_WIDTH - 48;
  const paddingVertical = 30; // Extra space for labels
  const chartHeight = height - paddingVertical * 2;

  if (!data || data.length < 2) return null;

  const max = providedMax ?? Math.max(...data, 1);
  const min = 0;
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    // Normalize Y with padding
    const y = paddingVertical + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y, value: val };
  });

  const pathData = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
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
            <Stop offset="0" stopColor={tintColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={tintColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Grid Lines */}
        {[0, 0.5, 1].map((level) => {
          const y = paddingVertical + chartHeight - level * chartHeight;
          return (
            <React.Fragment key={`grid-${level}`}>
                <Rect 
                    x="0" y={y} width={width} height="0.5" 
                    fill={colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                />
            </React.Fragment>
          );
        })}

        <Path d={areaData} fill="url(#grad)" />
        <Path d={pathData} stroke={tintColor} strokeWidth="3" fill="none" />
        
        {/* All points indicators and labels */}
        {points.map((p, i) => (
            <React.Fragment key={`point-${i}`}>
                {/* Glow effect for points */}
                <Circle cx={p.x} cy={p.y} r="8" fill={tintColor} fillOpacity="0.1" />
                
                <Circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill={tintColor} 
                    stroke={colorScheme === 'dark' ? '#1C1C1E' : '#fff'} 
                    strokeWidth="2" 
                />
                
                {/* Data Label */}
                <SvgText
                    x={p.x}
                    y={p.y - 12}
                    fontSize="10"
                    fontWeight="bold"
                    fill={colorScheme === 'dark' ? '#fff' : '#000'}
                    textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                >
                    {p.value}{unit}
                </SvgText>
            </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
});
