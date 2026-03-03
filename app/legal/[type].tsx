import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();

  // Get content based on type
  const getContent = () => {
    switch (type) {
      case 'mentions':
        return t('legal.mentions_content');
      case 'cgu':
        return t('legal.cgu_content');
      case 'cgv':
        return t('legal.cgv_content');
      case 'privacy':
        return t('legal.privacy_content');
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'mentions':
        return t('legal.mentions');
      case 'cgu':
        return t('legal.cgu');
      case 'cgv':
        return t('legal.cgv');
      case 'privacy':
        return t('legal.privacy');
      default:
        return t('legal.title');
    }
  };

  const markdownStyles = {
    body: {
      color: Colors[colorScheme].text,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: accentColor,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      marginTop: 8,
    },
    heading2: {
      color: Colors[colorScheme].text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      marginTop: 24,
    },
    paragraph: {
      marginBottom: 16,
    },
  };

  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>{getTitle()}</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Markdown style={markdownStyles}>
            {getContent()}
          </Markdown>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc3',
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
});
