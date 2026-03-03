import { useAppTheme } from '@/context/ThemeContext';
import { Image, ImageStyle } from 'expo-image';
import React from 'react';
import { StyleProp } from 'react-native';

interface AnkeceLogoProps {
  style?: StyleProp<ImageStyle>;
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export function AnkeceLogo({ style, contentFit = 'contain' }: AnkeceLogoProps) {
  const { accentColor } = useAppTheme();
  
  // Use orange logo if accent color is orange (#f97316)
  const logoSource = accentColor === '#f97316' 
    ? require('@/assets/images/ankece_orange.png') 
    : require('@/assets/images/ankece.png');

  return (
    <Image
      source={logoSource}
      style={style}
      contentFit={contentFit}
    />
  );
}
