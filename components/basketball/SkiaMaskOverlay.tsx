import React from 'react';
import { Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Mask,
  Rect,
  Group,
  useComputedValue,
  Skia,
  Path,
} from '@shopify/react-native-skia';
import Animated, {
  useDerivedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const center = { x: width / 2, y: height / 2 };
const maxRadius = Math.sqrt(width ** 2 + height ** 2) / 1.5;

interface SkiaMaskOverlayProps {
  progress: Animated.SharedValue<number>;
  type?: 'circle' | 'linear';
  color?: string;
}

export const SkiaMaskOverlay: React.FC<SkiaMaskOverlayProps> = ({
  progress,
  type = 'circle',
  color = '#000',
}) => {
  // Animated values for the mask
  const radius = useDerivedValue(() => {
    if (type !== 'circle') return 0;
    // Reveal: start with 0, end with maxRadius
    // For a "mask" that hides the screen and then opens:
    // We want the mask to be the WHOLE screen with a HOLE in it.
    return progress.value * maxRadius;
  });

  const linearPath = useDerivedValue(() => {
     if (type !== 'linear') return Skia.Path.Make();
     const p = Skia.Path.Make();
     // A rectangle that grows from left to right
     p.addRect(Skia.XYWHRect(0, 0, width * progress.value, height));
     return p;
  });

  return (
    <Canvas style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Mask
        mode="luminance"
        mask={
          <Group>
            {/* White is visible, black is transparent */}
            <Rect x={0} y={0} width={width} height={height} color="white" />
            {type === 'circle' ? (
                <Circle c={center} r={radius} color="black" />
            ) : (
                <Path path={linearPath} color="black" />
            )}
          </Group>
        }
      >
        {/* The overlay color that will be "punched" by the mask */}
        <Rect x={0} y={0} width={width} height={height} color={color} />
      </Mask>
    </Canvas>
  );
};
