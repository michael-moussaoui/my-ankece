import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { db } from '@/config/firebase';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cancelSession } from '@/services/bookingService';
import { BookingSession } from '@/types/booking';

interface PlayerBookingsProps {
  playerId: string;
}

export const PlayerBookings = ({ playerId }: PlayerBookingsProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('playerId', '==', playerId),
        orderBy('date', 'desc'),
        orderBy('startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingSession));
      setBookings(data);
    } catch (error) {
      console.error('Error loading player bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [playerId]);

  const handleCancel = (sessionId: string) => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette séance ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, annuler', 
          onPress: async () => {
            try {
              setLoading(true);
              await cancelSession(sessionId);
              loadBookings();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && bookings.length === 0) {
    return <ActivityIndicator color={tintColor} style={{ marginTop: 20 }} />;
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>Vous n'avez pas encore de réservations.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookings.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.dateInfo}>
            <ThemedText type="defaultSemiBold">{format(parseISO(item.date), 'dd/MM/yyyy')}</ThemedText>
            <ThemedText style={styles.timeText}>{item.startTime} - {item.endTime}</ThemedText>
          </View>
          
          <View style={styles.details}>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'reserved' ? tintColor : '#FF3B30' }]}>
              <ThemedText style={styles.statusText}>
                {t(`coach.agenda.status.${item.status}`)}
              </ThemedText>
            </View>
            <ThemedText style={styles.location} numberOfLines={1}>
                <Ionicons name="location" size={12} /> {item.location}
            </ThemedText>
          </View>

          {item.status === 'reserved' && (
            <TouchableOpacity onPress={() => handleCancel(item.id)} style={styles.cancelBtn}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150,150,150,0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  details: {
    flex: 1.5,
    alignItems: 'flex-start',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  location: {
    fontSize: 12,
    opacity: 0.8,
  },
  cancelBtn: {
    padding: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  }
});
