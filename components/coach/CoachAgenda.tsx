import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachSessionsByDate, reserveSession } from '@/services/bookingService';
import { BookingSession } from '@/types/booking';

interface CoachAgendaProps {
  coachId: string;
}

export const CoachAgenda = ({ coachId }: CoachAgendaProps) => {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sync calendar locale with i18n
    LocaleConfig.defaultLocale = i18n.language.startsWith('fr') ? 'fr' : 'en';
    loadSessions(selectedDate);
  }, [coachId, selectedDate, i18n.language]);

  const loadSessions = async (date: string) => {
    setLoading(true);
    try {
      const data = await getCoachSessionsByDate(coachId, date);
      // For players, we only show available or sessions THEY reserved
      setSessions(data.filter(s => s.status === 'available' || s.playerId === user?.uid));
    } catch (error) {
      console.error('Error loading coach sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleReserve = async (session: BookingSession) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver une séance.');
      return;
    }

    Alert.alert(
      t('coach.agenda.reserve'),
      `${t('coach.agenda.confirm_reserve')}\n\n${session.startTime} - ${session.endTime}\n${session.price}€`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('coach.agenda.reserve'), 
          onPress: async () => {
            try {
              setLoading(true);
              await reserveSession(session.id, user.uid, profile?.displayName || user.email || 'Joueur');
              Alert.alert('Succès !', 'Votre séance a été réservée.');
              loadSessions(selectedDate);
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de réserver ce créneau');
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
        minDate={format(new Date(), 'yyyy-MM-dd')}
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
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '400',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
      />

      <View style={styles.sessionHeader}>
        <ThemedText type="defaultSemiBold">
          {format(parseISO(selectedDate), 'EEEE d MMMM')}
        </ThemedText>
      </View>

      <ScrollView style={styles.sessionList} scrollEnabled={false}>
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
                {session.playerId === user?.uid ? (
                    <View style={[styles.statusBadge, { backgroundColor: tintColor }]}>
                        <ThemedText style={styles.statusText}>Ma Réservation</ThemedText>
                    </View>
                ) : (
                    <ThemedText style={styles.locationText} numberOfLines={1}>
                        <Ionicons name="location-outline" size={12} /> {session.location}
                    </ThemedText>
                )}
              </View>

              {session.status === 'available' && (
                <TouchableOpacity 
                    style={[styles.reserveButton, { backgroundColor: tintColor }]} 
                    onPress={() => handleReserve(session)}
                >
                    <ThemedText style={styles.reserveButtonText}>{t('coach.agenda.reserve')}</ThemedText>
                </TouchableOpacity>
              )}
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
    paddingBottom: 20,
  },
  sessionHeader: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.3)',
  },
  sessionList: {
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
  locationText: {
    fontSize: 12,
    opacity: 0.8,
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
  reserveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.5,
    paddingBottom: 20,
  }
});
