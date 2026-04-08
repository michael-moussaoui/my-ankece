import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createSession, deleteSession, getCoachSessionsByDate } from '@/services/bookingService';
import { BookingSession } from '@/types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── CONFIG ───────────────────────────────────────────────────────────────────
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: "Aujourd'hui"
};

const SESSION_TYPES = [
  { id: 'shooting', icon: 'basketball-outline', color: '#FF4500' },
  { id: 'physical', icon: 'fitness-outline', color: '#FFD700' },
  { id: 'technical', icon: 'construct-outline', color: '#00E5FF' },
  { id: 'mental', icon: 'brain-outline', color: '#A855F7' },
  { id: 'live', icon: 'videocam-outline', color: '#22C55E' },
  { id: 'other', icon: 'apps-outline', color: '#888' },
];

interface AgendaManagerProps {
  coachId: string;
}

export const AgendaManager = ({ coachId }: AgendaManagerProps) => {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const { accentColor } = useAppTheme();
  
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBorder = isDark ? '#2A2A2A' : '#E5E7EB';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#888888' : '#666666';

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 3600000));
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  const [slotPrice, setSlotPrice] = useState('50');
  const [isFree, setIsFree] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedType, setSelectedType] = useState('shooting');

  useEffect(() => {
    LocaleConfig.defaultLocale = i18n.language.startsWith('fr') ? 'fr' : 'en';
    loadSessions(selectedDate);
  }, [coachId, selectedDate, i18n.language]);

  const loadSessions = async (date: string) => {
    setLoading(true);
    try {
      const data = await getCoachSessionsByDate(coachId, date);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      setLoading(true);
      await createSession({
        coachId,
        date: selectedDate,
        startTime: format(startTime, 'HH:mm'),
        endTime: format(endTime, 'HH:mm'),
        price: isFree ? 0 : parseFloat(slotPrice) || 0,
        location: location || 'Terrain par défaut',
        notes: JSON.stringify({ type: selectedType }), 
      });
      setModalVisible(false);
      loadSessions(selectedDate);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le créneau');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = (sessionId: string, isReserved: boolean) => {
    if (isReserved) {
      Alert.alert('Impossible', 'Ce créneau est déjà réservé.');
      return;
    }

    Alert.alert(
      t('coach.agenda.delete_session'),
      t('coach.agenda.confirm_delete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteSession(sessionId);
              loadSessions(selectedDate);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le créneau');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getSessionStyle = (typeId: string) => {
    const type = SESSION_TYPES.find(t => t.id === typeId) || SESSION_TYPES[5];
    return type;
  };

  const dateLocale = i18n.language.startsWith('fr') ? fr : enUS;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: accentColor }
          }}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: textSecondary,
            selectedDayBackgroundColor: accentColor,
            selectedDayTextColor: '#ffffff',
            todayTextColor: accentColor,
            dayTextColor: textPrimary,
            textDisabledColor: isDark ? '#444' : '#CCC',
            dotColor: accentColor,
            selectedDotColor: '#ffffff',
            arrowColor: accentColor,
            monthTextColor: accentColor,
            textDayFontWeight: '500',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 15,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 12
          }}
        />
      </Animated.View>

      <View style={[styles.sessionHeader, { borderTopColor: cardBorder }]}>
        <View>
          <ThemedText style={styles.dateDisplay}>
            {format(parseISO(selectedDate), 'EEEE d MMMM', { locale: dateLocale })}
          </ThemedText>
          <Text style={[styles.sessionCount, { color: textSecondary }]}>
            {sessions.length} {t('coach.agenda.slots', 'créneau(x)')}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: accentColor }]} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={accentColor} style={{ marginTop: 20 }} />}
        {!loading && sessions.length === 0 && (
          <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={isDark ? '#222' : '#EEE'} />
            <ThemedText style={styles.emptyText}>{t('coach.agenda.no_sessions')}</ThemedText>
          </Animated.View>
        )}
        {!loading && sessions.map((session, i) => {
          let typeData = SESSION_TYPES[0];
          try {
            const notes = session.notes ? JSON.parse(session.notes) : {};
            typeData = getSessionStyle(notes.type || 'shooting');
          } catch (e) {
            typeData = getSessionStyle('shooting');
          }

          return (
            <Animated.View 
              key={session.id} 
              entering={FadeInRight.delay(i * 100).springify()}
              layout={Layout.springify()}
              style={[styles.sessionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={[styles.typeIndicator, { backgroundColor: typeData.color }]} />
              
              <View style={styles.sessionContent}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: typeData.color + '15' }]}>
                    <Ionicons name={typeData.icon as any} size={20} color={typeData.color} />
                  </View>
                  <View style={styles.timePrice}>
                    <ThemedText style={styles.sessionTime}>{session.startTime} — {session.endTime}</ThemedText>
                    <Text style={[styles.sessionTypeLabel, { color: textSecondary }]}>
                      {t(`coach.agenda.types.${typeData.id}`)} • {session.price}€
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionFooter}>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: session.status === 'available' ? '#22C55E15' : '#FF980015' }
                  ]}>
                    <View style={[styles.statusDot, { backgroundColor: session.status === 'available' ? '#22C55E' : '#FF9800' }]} />
                    <Text style={[styles.statusText, { color: session.status === 'available' ? '#22C55E' : '#FF9800' }]}>
                      {t(`coach.agenda.status.${session.status}`)}
                    </Text>
                  </View>
                  {session.status === 'reserved' && (
                    <View style={{ gap: 8 }}>
                      <Text style={[styles.bookedBy, { color: textSecondary }]}>
                        👤 {session.playerName}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.reportBtn, { backgroundColor: accentColor + '20' }]}
                        onPress={() => router.push(`/coach/session/${session.id}/report`)}
                      >
                        <Text style={[styles.reportBtnText, { color: accentColor }]}>
                          {t('analytics.report.title')}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={accentColor} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => handleDeleteSlot(session.id, session.status === 'reserved')}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── ADD MODAL ───────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('coach.agenda.add_session')}</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Type Selector */}
              <ThemedText style={styles.label}>{t('coach.agenda.session_type')}</ThemedText>
              <View style={styles.typeGrid}>
                {SESSION_TYPES.map(type => (
                  <TouchableOpacity 
                    key={type.id}
                    onPress={() => setSelectedType(type.id)}
                    style={[
                      styles.typeItem, 
                      { borderColor: cardBorder },
                      selectedType === type.id && { borderColor: accentColor, backgroundColor: accentColor + '10' }
                    ]}
                  >
                    <Ionicons name={type.icon as any} size={24} color={selectedType === type.id ? accentColor : textSecondary} />
                    <Text style={[styles.typeText, { color: selectedType === type.id ? accentColor : textSecondary }]}>
                      {t(`coach.agenda.types.${type.id}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Pickers */}
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <ThemedText style={styles.label}>{t('coach.agenda.startTime')}</ThemedText>
                  <TouchableOpacity 
                    style={[styles.timeInput, { borderColor: cardBorder }]}
                    onPress={() => setShowPicker('start')}
                  >
                    <Ionicons name="time-outline" size={20} color={accentColor} />
                    <Text style={{ color: textPrimary, fontWeight: '600' }}>{format(startTime, 'HH:mm')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeField}>
                  <ThemedText style={styles.label}>{t('coach.agenda.endTime')}</ThemedText>
                  <TouchableOpacity 
                    style={[styles.timeInput, { borderColor: cardBorder }]}
                    onPress={() => setShowPicker('end')}
                  >
                    <Ionicons name="time-outline" size={20} color={accentColor} />
                    <Text style={{ color: textPrimary, fontWeight: '600' }}>{format(endTime, 'HH:mm')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={showPicker === 'start' ? startTime : endTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowPicker(null);
                    if (date) {
                      if (showPicker === 'start') setStartTime(date);
                      else setEndTime(date);
                    }
                  }}
                />
              )}

              {/* Price & Location */}
              <View style={styles.switchRow}>
                <ThemedText style={styles.label}>{t('coach.agenda.price_free')}</ThemedText>
                <Switch value={isFree} onValueChange={setIsFree} trackColor={{ true: accentColor }} />
              </View>

              {!isFree && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('coach.agenda.price')}</ThemedText>
                  <TextInput
                    style={[styles.textInput, { borderColor: cardBorder, color: textPrimary }]}
                    value={slotPrice}
                    onChangeText={setSlotPrice}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor={textSecondary}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t('coach.agenda.location')}</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: cardBorder, color: textPrimary }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('coach.agenda.location_placeholder')}
                  placeholderTextColor={textSecondary}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: accentColor }]}
                onPress={handleAddSlot}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('coach.agenda.save_session')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  dateDisplay: { fontSize: 20, fontWeight: '900', textTransform: 'capitalize' },
  sessionCount: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  addButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  
  sessionList: { flex: 1, paddingHorizontal: 16 },
  sessionCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  typeIndicator: { width: 6, height: '100%' },
  sessionContent: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  timePrice: { gap: 2 },
  sessionTime: { fontSize: 16, fontWeight: '800' },
  sessionTypeLabel: { fontSize: 12, fontWeight: '600' },
  
  sessionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  bookedBy: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 16, justifyContent: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.8 },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: '600', color: '#888' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8882', justifyContent: 'center', alignItems: 'center' },
  modalScroll: { marginBottom: 20 },
  
  label: { fontSize: 15, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeItem: { width: (SCREEN_WIDTH - 68) / 2, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  typeText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  timeRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  timeField: { flex: 1 },
  timeInput: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  textInput: { height: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },
  submitBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 40 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  
  reportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    gap: 6,
    marginTop: 4
  },
  reportBtnText: { fontSize: 13, fontWeight: '800' },
});
