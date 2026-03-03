import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createSession, deleteSession, getCoachSessionsByDate } from '@/services/bookingService';
import { BookingSession } from '@/types/booking';

// Configure calendar locale
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: "Aujourd'hui"
};

interface AgendaManagerProps {
  coachId: string;
}

export const AgendaManager = ({ coachId }: AgendaManagerProps) => {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [slotPrice, setSlotPrice] = useState('50');
  const [isFree, setIsFree] = useState(false);
  const [location, setLocation] = useState('');

  const handleAddSlot = async () => {
    try {
      setLoading(true);
      await createSession({
        coachId,
        date: selectedDate,
        startTime,
        endTime,
        price: isFree ? 0 : parseFloat(slotPrice) || 0,
        location: location || 'Terrain par défaut',
      });
      setModalVisible(false);
      loadSessions(selectedDate);
      // Reset form
      setStartTime('10:00');
      setEndTime('11:00');
      setSlotPrice('50');
      setIsFree(false);
      setLocation('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le créneau');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = (sessionId: string, isReserved: boolean) => {
    if (isReserved) {
      Alert.alert('Impossible', 'Vous ne pouvez pas supprimer un créneau déjà réservé.');
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

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: tintColor }
        }}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: tintColor,
          selectedDayTextColor: '#ffffff',
          todayTextColor: tintColor,
          dayTextColor: colorScheme === 'dark' ? '#ffffff' : '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: tintColor,
          selectedDotColor: '#ffffff',
          arrowColor: tintColor,
          disabledArrowColor: '#d9e1e8',
          monthTextColor: tintColor,
          indicatorColor: tintColor,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
      />

      <View style={styles.sessionHeader}>
        <ThemedText type="defaultSemiBold">
          {format(parseISO(selectedDate), 'EEEE d MMMM')}
        </ThemedText>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: tintColor }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">{t('coach.agenda.add_session')}</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t('coach.agenda.startTime')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:mm"
                  placeholderTextColor="#8e8e93"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t('coach.agenda.endTime')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:mm"
                  placeholderTextColor="#8e8e93"
                />
              </View>

              <View style={styles.switchRow}>
                <ThemedText style={styles.label}>{t('coach.agenda.price_free')}</ThemedText>
                <Switch 
                  value={isFree} 
                  onValueChange={setIsFree} 
                  trackColor={{ true: tintColor }}
                />
              </View>

              {!isFree && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('coach.agenda.price')} (€)</ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
                    value={slotPrice}
                    onChangeText={setSlotPrice}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor="#8e8e93"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{t('coach.agenda.location')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('coach.agenda.location_placeholder')}
                  placeholderTextColor="#8e8e93"
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: tintColor }]}
                onPress={handleAddSlot}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>{t('coach.agenda.save_session')}</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.sessionList}>
        {loading ? (
          <ActivityIndicator color={tintColor} style={{ marginTop: 20 }} />
        ) : sessions.length === 0 ? (
          <ThemedText style={styles.emptyText}>{t('coach.agenda.no_sessions')}</ThemedText>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.timeInfo}>
                <ThemedText type="defaultSemiBold">{session.startTime} - {session.endTime}</ThemedText>
                <ThemedText style={styles.priceText}>{session.price}€</ThemedText>
              </View>
              
              <View style={styles.statusInfo}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: session.status === 'available' ? '#4CAF50' : '#FF9800' }
                ]}>
                  <ThemedText style={styles.statusText}>
                    {t(`coach.agenda.status.${session.status}`)}
                  </ThemedText>
                </View>
                {session.status === 'reserved' && (
                  <ThemedText style={styles.bookedBy}>
                    {t('coach.agenda.booked_by')}: {session.playerName}
                  </ThemedText>
                )}
              </View>

              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteSlot(session.id, session.status === 'reserved')}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.3)',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150,150,150,0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flex: 0.3,
  },
  priceText: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  bookedBy: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalForm: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
