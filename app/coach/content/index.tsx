import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { contentService, Drill, TrainingProgram } from '@/services/contentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ConcreteLabScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { accentColor: orangeColor } = useAppTheme(); // Using a vibrant orange for street theme
  
  const [activeTab, setActiveTab] = useState<'drills' | 'programs'>('drills');
  const [loading, setLoading] = useState(true);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);

  useEffect(() => {
    if (user) {
      loadContent();
    }
  }, [user, activeTab]);

  const loadContent = async () => {
    setLoading(true);
    try {
      console.log('Loading lab content. contentService keys:', Object.keys(contentService));
      if (activeTab === 'drills') {
        const data = await contentService.getCoachDrills(user!.uid);
        setDrills(data);
      } else {
        const data = await contentService.getCoachPrograms(user!.uid);
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error loading lab content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrill = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('academy.alerts.deleteDrillConfirm', 'Supprimer ce drill définitivement ?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await contentService.deleteDrill(id);
              setDrills(prev => prev.filter(d => d.id !== id));
            } catch (error) {
              console.error('Error deleting drill:', error);
              Alert.alert(t('common.error'), t('academy.alerts.deleteError'));
            }
          }
        }
      ]
    );
  };

  const handleDeleteProgram = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('academy.alerts.deleteProgramConfirm', 'Supprimer ce programme définitivement ?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await contentService.deleteProgram(id);
              setPrograms(prev => prev.filter(p => p.id !== id));
            } catch (error) {
              console.error('Error deleting program:', error);
              Alert.alert(t('common.error'), t('academy.alerts.deleteError'));
            }
          }
        }
      ]
    );
  };

  const renderDrillItem = ({ item, index }: { item: Drill, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)} 
      layout={Layout.springify()}
      style={styles.drillCard}
    >
      <View style={styles.drillInfo}>
        <ThemedText type="defaultSemiBold" style={styles.drillTitle}>{item.title}</ThemedText>
        <View style={styles.tagRow}>
          <View style={[styles.miniTag, { backgroundColor: '#333' }]}>
            <Text style={styles.miniTagText}>{item.difficulty.toUpperCase()}</Text>
          </View>
          <ThemedText style={styles.durationText}>{item.duration}</ThemedText>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/coach/content/drills/${item.id}`)}
        >
          <Ionicons name="pencil" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDeleteDrill(item.id!)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => { /* Preview Drill */ }}
        >
          <Ionicons name="play" size={24} color={orangeColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderProgramItem = ({ item, index }: { item: TrainingProgram, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)} 
      layout={Layout.springify()}
      style={styles.drillCard}
    >
      <View style={styles.drillInfo}>
        <ThemedText type="defaultSemiBold" style={styles.drillTitle}>{item.title}</ThemedText>
        <View style={styles.tagRow}>
          <View style={[styles.miniTag, { backgroundColor: orangeColor }]}>
            <Text style={[styles.miniTagText, { color: '#000' }]}>{item.price > 0 ? `${item.price}${item.currency}` : t('academy.free')}</Text>
          </View>
          <ThemedText style={styles.durationText}>{t('academy.weeksCount', { count: item.weeksCount })}</ThemedText>
          <ThemedText style={[styles.durationText, { color: orangeColor }]}>{t('academy.drillsCount', { count: item.drills.length })}</ThemedText>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/coach/content/programs/${item.id}`)}
        >
          <Ionicons name="pencil" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDeleteProgram(item.id!)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => router.push(`/coach/content/programs/${item.id}`)}
        >
          <Ionicons name="settings-outline" size={24} color={orangeColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header Street Style */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View>
            <ThemedText style={styles.headerTitle}>{t('academy.lab').toUpperCase()}</ThemedText>
            <ThemedText style={styles.headerSub}>{t('academy.title').toUpperCase()}</ThemedText>
          </View>
        </View>

        {/* Custom Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => setActiveTab('drills')}
            style={[styles.tab, activeTab === 'drills' && { backgroundColor: orangeColor }]}
          >
            <ThemedText style={[styles.tabText, activeTab === 'drills' && { color: '#000' }]}>
              {t('academy.drills').toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('programs')}
            style={[styles.tab, activeTab === 'programs' && { backgroundColor: orangeColor }]}
          >
            <ThemedText style={[styles.tabText, activeTab === 'programs' && { color: '#000' }]}>
              {t('academy.programs').toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={orangeColor} />
          </View>
        ) : (
          <FlatList
            data={(activeTab === 'drills' ? drills : programs) as any[]}
            renderItem={activeTab === 'drills' ? renderDrillItem : (renderProgramItem as any)}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="construct-outline" size={64} color="#444" />
                <ThemedText style={styles.emptyText}>{t('academy.noContent')}</ThemedText>
              </View>
            }
          />
        )}

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: orangeColor }]}
          onPress={() => {
            if (activeTab === 'drills') {
              router.push('/coach/content/create-drill' as any);
            } else {
              router.push('/coach/content/create-program' as any);
            }
          }}
        >
          <Ionicons name="add" size={32} color="#000" />
        </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF4500', // Street Orange
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
    color: '#FFF',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF4500',
  },
  tabText: {
    fontWeight: '900',
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  drillCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  drillInfo: {
    flex: 1,
  },
  drillTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#FFF',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  miniTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: 12,
    opacity: 0.5,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});
