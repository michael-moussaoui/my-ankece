/**
 * Web stub for pro-mimic/[id] — TensorFlow + expo-camera TensorCamera are native-only.
 * Metro picks this over [id].tsx on web builds.
 */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProMimicWebScreen() {
  const router = useRouter();
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="phone-portrait-outline" size={64} color="#666" style={styles.icon} />
        <ThemedText type="title" style={styles.title}>Fonctionnalité mobile uniquement</ThemedText>
        <ThemedText style={styles.desc}>
          Le mode Pro Mimic avec analyse IA de posture nécessite un appareil mobile. Ouvre l'application sur ton téléphone pour utiliser cette fonctionnalité.
        </ThemedText>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <ThemedText style={styles.btnText}>Retour</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', maxWidth: 400, gap: 16 },
  icon: { marginBottom: 8, opacity: 0.5 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: 'bold' },
  desc: { textAlign: 'center', opacity: 0.6, lineHeight: 22 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
