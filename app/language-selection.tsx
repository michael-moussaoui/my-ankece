import { GlassContainer } from '@/components/basketball/FormComponents';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function LanguageSelectionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const selectLanguage = async (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
    
    // Persist to Firebase if user is logged in
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          language: lang
        });
      } catch (err) {
        console.warn("Failed to persist language to Firestore", err);
      }
    }
    
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient 
        colors={['#0F172A', '#1E293B', '#020617']} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
        <ThemedText type="title" style={styles.title}>CHOOSE YOUR LANGUAGE</ThemedText>
        <View style={styles.divider} />
        <ThemedText style={styles.subtitle}>CHOISISSEZ VOTRE LANGUE</ThemedText>
      </Animated.View>

      <View style={styles.grid}>
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.card} 
          onPress={() => selectLanguage('fr')}
        >
          <Animated.View entering={ZoomIn.delay(400)} style={{ flex: 1 }}>
            <GlassContainer style={styles.glass}>
              <View style={styles.flagContainer}>
                <ThemedText style={styles.flag}>🇫🇷</ThemedText>
              </View>
              <ThemedText style={styles.langName}>FRANÇAIS</ThemedText>
            </GlassContainer>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.card} 
          onPress={() => selectLanguage('en')}
        >
          <Animated.View entering={ZoomIn.delay(600)} style={{ flex: 1 }}>
            <GlassContainer style={styles.glass}>
              <View style={styles.flagContainer}>
                <ThemedText style={styles.flag}>🇬🇧</ThemedText>
              </View>
              <ThemedText style={styles.langName}>ENGLISH</ThemedText>
            </GlassContainer>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: '#3B82F6', // Blue accent
    marginVertical: 15,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8', // Muted slate
    fontWeight: '600',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 30,
    width: '100%',
  },
  card: {
    flex: 1,
    height: 180,
  },
  glass: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
  },
  flagContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flag: {
    fontSize: 40,
  },
  langName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1.5,
  }
});
