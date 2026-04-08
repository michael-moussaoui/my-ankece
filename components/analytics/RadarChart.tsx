import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Line,
  Circle,
  LinearGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';

interface SkillData {
  label: string;
  value: number; // 0 to 100
}

interface RadarChartProps {
  data: SkillData[];
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = Dimensions.get('window').width - 80;

export const RadarChart = ({ 
  data, 
  size = DEFAULT_SIZE, 
  color = '#2ECC71' 
}: RadarChartProps) => {
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const numPoints = data.length;
  const angleStep = (Math.PI * 2) / numPoints;

  // Generate background spider web paths
  const backgroundPaths = useMemo(() => {
    const paths = [];
    // 5 levels of web
    for (let i = 1; i <= 5; i++) {
        const p = Skia.Path.Make();
        const currentRadius = (radius * i) / 5;
        for (let j = 0; j < numPoints; j++) {
            const angle = j * angleStep - Math.PI / 2;
            const x = center + Math.cos(angle) * currentRadius;
            const y = center + Math.sin(angle) * currentRadius;
            if (j === 0) p.moveTo(x, y);
            else p.lineTo(x, y);
        }
        p.close();
        paths.push(p);
    }
    return paths;
  }, [numPoints, radius, center, angleStep]);

  // Generate the actual data shape path
  const dataPath = useMemo(() => {
    const p = Skia.Path.Make();
    data.forEach((item, i) => {
        const valRadius = (radius * item.value) / 100;
        const angle = i * angleStep - Math.PI / 2;
        const x = center + Math.cos(angle) * valRadius;
        const y = center + Math.sin(angle) * valRadius;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
    });
    p.close();
    return p;
  }, [data, radius, center, angleStep]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ flex: 1 }}>
        {/* Axis Lines */}
        {data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            return (
                <Line 
                    key={`line-${i}`} 
                    p1={vec(center, center)} 
                    p2={vec(x, y)} 
                    color="rgba(255,255,255,0.1)" 
                    strokeWidth={1} 
                />
            );
        })}

        {/* Web Background */}
        {backgroundPaths.map((p, i) => (
            <Path 
                key={`web-${i}`} 
                path={p} 
                color="rgba(255,255,255,0.05)" 
                style="stroke" 
                strokeWidth={1} 
            />
        ))}

        {/* Data Shape Fill */}
        <Path path={dataPath} color={color} opacity={0.3}>
            <BlurMask blur={2} style="outer" />
        </Path>
        <Path 
            path={dataPath} 
            color={color} 
            style="stroke" 
            strokeWidth={3} 
            strokeJoin="round" 
        />

        {/* Key Points */}
        {data.map((item, i) => {
            const valRadius = (radius * item.value) / 100;
            const angle = i * angleStep - Math.PI / 2;
            const x = center + Math.cos(angle) * valRadius;
            const y = center + Math.sin(angle) * valRadius;
            return <Circle key={`dot-${i}`} cx={x} cy={y} r={4} color={color} />;
        })}
      </Canvas>

      {/* React Native Labels (Safe from font issues) */}
      {data.map((item, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + Math.cos(angle) * (radius + 25);
          const y = center + Math.sin(angle) * (radius + 25);
          return (
              <View 
                key={`label-${i}`} 
                style={[styles.labelWrapper, { left: x - 40, top: y - 10 }]}
              >
                  <Text style={styles.labelText}>{item.label}</Text>
              </View>
          );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  labelWrapper: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  }
});
