import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Dimensions,
  Text,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  Layout, 
  SlideInRight 
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CoachingProgram, ProgramSession, Drill } from '@/services/programService';

interface ProgramBuilderProps {
  initialProgram?: CoachingProgram;
  onSave: (program: Omit<CoachingProgram, 'coachId' | 'createdAt' | 'updatedAt' | 'salesCount'>) => void;
  loading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProgramBuilder = ({ initialProgram, onSave, loading }: ProgramBuilderProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor: tintColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const inputBg = isDark ? '#000' : '#F2F2F7';
  const textPrimary = isDark ? '#FFF' : '#111';
  const textSecondary = isDark ? '#888' : '#666';

  const [title, setTitle] = useState(initialProgram?.title || '');
  const [description, setDescription] = useState(initialProgram?.description || '');
  const [price, setPrice] = useState(initialProgram?.price.toString() || '0');
  const [duration, setDuration] = useState(initialProgram?.durationWeeks.toString() || '4');
  const [level, setLevel] = useState<CoachingProgram['level']>(initialProgram?.level || 'intermediate');
  const [sessions, setSessions] = useState<ProgramSession[]>(initialProgram?.sessions || []);

  const addSession = () => {
    const newSession: ProgramSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      drills: [],
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const updateSessionTitle = (sessionId: string, newTitle: string) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  };

  const addDrill = (sessionId: string) => {
    const newDrill: Drill = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      sets: '3',
      reps: '10',
      duration: '5 min',
      intensity: 'medium',
    };
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, drills: [...s.drills, newDrill] } : s));
  };

  const removeDrill = (sessionId: string, drillId: string) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, drills: s.drills.filter(d => d.id !== drillId) };
      }
      return s;
    }));
  };

  const updateDrill = (sessionId: string, drillId: string, updates: Partial<Drill>) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          drills: s.drills.map(d => d.id === drillId ? { ...d, ...updates } : d)
        };
      }
      return s;
    }));
  };

  const handleSave = () => {
    onSave({
      id: initialProgram?.id,
      title,
      description,
      price: parseFloat(price),
      currency: '€',
      level,
      durationWeeks: parseInt(duration),
      sessions,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Basic Info Section */}
      <Animated.View entering={FadeInDown} style={[styles.section, { backgroundColor: cardBg }]}>
        <ThemedText style={styles.sectionTitle}>{t('coach.programs.form.basic_info')}</ThemedText>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textSecondary }]}>{t('coach.programs.form.title_label')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
            placeholder={t('coach.programs.form.title_placeholder')}
            placeholderTextColor={textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textSecondary }]}>{t('coach.programs.form.desc_label')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: textPrimary }]}
            placeholder={t('coach.programs.form.desc_placeholder')}
            placeholderTextColor={textSecondary}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: textSecondary }]}>{t('coach.programs.form.price_label')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: textSecondary }]}>{t('coach.programs.form.duration_label')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
          </View>
        </View>
      </Animated.View>

      {/* Sessions Section */}
      <View style={styles.sessionsHeader}>
        <ThemedText style={styles.sectionTitle}>{t('coach.programs.title')}</ThemedText>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: tintColor + '15' }]} onPress={addSession}>
          <Ionicons name="add-circle" size={20} color={tintColor} />
          <Text style={{ color: tintColor, fontWeight: '700', marginLeft: 6 }}>{t('coach.programs.builder.add_session')}</Text>
        </TouchableOpacity>
      </View>

      {sessions.map((session, sIndex) => (
        <Animated.View 
          key={session.id} 
          entering={SlideInRight.delay(sIndex * 100)} 
          layout={Layout.springify()}
          style={[styles.sessionCard, { backgroundColor: cardBg }]}
        >
          <View style={styles.sessionHeaderRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.sessionTitleInput, { color: textPrimary }]}
                placeholder={t('coach.programs.builder.session_placeholder')}
                placeholderTextColor={textSecondary}
                value={session.title}
                onChangeText={(text) => updateSessionTitle(session.id, text)}
              />
            </View>
            <TouchableOpacity onPress={() => removeSession(session.id)}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>

          {/* Drills List */}
          <View style={styles.drillsContainer}>
            {session.drills.map((drill, dIndex) => (
              <Animated.View 
                key={drill.id} 
                entering={FadeInDown} 
                exiting={FadeOutUp}
                style={[styles.drillItem, { borderLeftColor: tintColor }]}
              >
                <View style={styles.drillHeader}>
                  <TextInput
                    style={[styles.drillNameInput, { color: textPrimary }]}
                    placeholder={t('coach.programs.builder.drill.name')}
                    placeholderTextColor={textSecondary}
                    value={drill.name}
                    onChangeText={(text) => updateDrill(session.id, drill.id, { name: text })}
                  />
                  <TouchableOpacity onPress={() => removeDrill(session.id, drill.id)}>
                    <Ionicons name="close-circle-outline" size={18} color={textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.drillStatsRow}>
                  <View style={styles.statInput}>
                    <Text style={styles.statLabel}>{t('coach.programs.builder.drill.sets')}</Text>
                    <TextInput
                      style={[styles.smallInput, { color: textPrimary }]}
                      value={drill.sets}
                      onChangeText={(text) => updateDrill(session.id, drill.id, { sets: text })}
                    />
                  </View>
                  <View style={styles.statInput}>
                    <Text style={styles.statLabel}>{t('coach.programs.builder.drill.reps')}</Text>
                    <TextInput
                      style={[styles.smallInput, { color: textPrimary }]}
                      value={drill.reps}
                      onChangeText={(text) => updateDrill(session.id, drill.id, { reps: text })}
                    />
                  </View>
                  <View style={styles.statInput}>
                    <Text style={styles.statLabel}>{t('coach.programs.builder.drill.duration')}</Text>
                    <TextInput
                      style={[styles.smallInput, { color: textPrimary }]}
                      value={drill.duration}
                      onChangeText={(text) => updateDrill(session.id, drill.id, { duration: text })}
                    />
                  </View>
                </View>
              </Animated.View>
            ))}
            
            <TouchableOpacity 
              style={[styles.addDrillBtn, { borderStyle: 'dashed', borderColor: textSecondary + '40' }]} 
              onPress={() => addDrill(session.id)}
            >
              <Ionicons name="add" size={20} color={textSecondary} />
              <Text style={{ color: textSecondary, fontWeight: '600', marginLeft: 4 }}>{t('coach.programs.builder.add_drill')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}

      <TouchableOpacity 
        style={[styles.saveButton, { backgroundColor: tintColor }]} 
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{t('common.confirm')}</Text>
      </TouchableOpacity>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  section: { padding: 20, borderRadius: 24, marginBottom: 24, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },
  textArea: { height: 100, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 16 },
  
  sessionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  
  sessionCard: { padding: 16, borderRadius: 24, marginBottom: 16 },
  sessionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sessionTitleInput: { fontSize: 17, fontWeight: '800', borderBottomWidth: 1, borderBottomColor: '#8883', paddingBottom: 4 },
  
  drillsContainer: { gap: 12 },
  drillItem: { padding: 12, backgroundColor: '#8881', borderRadius: 16, borderLeftWidth: 4 },
  drillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  drillNameInput: { fontSize: 15, fontWeight: '700', flex: 1 },
  drillStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statInput: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  smallInput: { fontSize: 14, fontWeight: '800', textAlign: 'center', width: '80%' },
  
  addDrillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 16, borderWidth: 1 },
  
  saveButton: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
});
