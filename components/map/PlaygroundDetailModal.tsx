import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cloudinaryService } from '@/services/cloudinaryService';
import { stopLiveStream } from '@/services/playgroundService';
import { DB_COLLECTIONS } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { PlaygroundEvent as EventData, getPlaygroundEvents, toggleEventRSVP } from '@/services/eventService';
import { getPlaygroundVibes, getUserVibeVotes, votePlaygroundStyle } from '@/services/playgroundService';
import { trackerService } from '@/services/trackerService';
import { ShootingSession } from '@/types/tracker';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { EventCreationModal } from './EventCreationModal';

import * as Location from 'expo-location';

const MAX_STORY_DISTANCE = 30; // 30 meters tolerance

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

interface PlaygroundDetailModalProps {
  visible: boolean;
  playground: any;
  onClose: () => void;
}

export const PlaygroundDetailModal = ({ visible, playground, onClose }: PlaygroundDetailModalProps) => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor, accentTextColor } = useAppTheme();
  const tintColor = accentColor;
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vibeCounts, setVibeCounts] = useState<{[key: string]: number}>({});
  const [userVibes, setUserVibes] = useState<string[]>([]);
  const [voting, setVoting] = useState(false);
  
  // Events state
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  // Address state
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  
  // Proximity state
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const [bestSessions, setBestSessions] = useState<ShootingSession[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const dateLocale = i18n.language === 'fr' ? fr : enUS;

  useEffect(() => {
    if (visible && playground) {
      loadStories();
      loadEvents();
      loadAddress();
      checkProximity();
      loadVibes();
      loadLeaderboard();
    }
  }, [visible, playground]);

  const loadLeaderboard = async () => {
    if (!playground) return;
    setLoadingLeaderboard(true);
    try {
      const data = await trackerService.getPlaygroundBestSessions(playground.id.toString());
      setBestSessions(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const checkProximity = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc);
      const dist = getDistance(
        loc.coords.latitude,
        loc.coords.longitude,
        playground.lat,
        playground.lon
      );
      setDistance(dist);
    } catch (error) {
      // Silent fail for proximity if permission is not granted
    }
  };

  const loadVibes = async () => {
    if (!playground) return;
    const vibes = await getPlaygroundVibes(playground.id.toString());
    setVibeCounts(vibes);
    
    if (user) {
        const myVibes = await getUserVibeVotes(playground.id.toString(), user.uid);
        setUserVibes(myVibes);
    }
  };

  const handleVoteStyle = async (styleId: string) => {
    if (!user) {
        Alert.alert(t('auth.login_required'), t('auth.event_login_msg'));
        return;
    }

    if (voting) return;

    // Condition check: max 3 styles (only if adding a new one)
    const isAlreadySelected = userVibes.includes(styleId);
    if (!isAlreadySelected && userVibes.length >= 3) {
        Alert.alert(t('common.error'), t('map.error_max_vibes'));
        return;
    }

    setVoting(true);
    try {
        const { selectedStyles, vibeCounts } = await votePlaygroundStyle(playground.id.toString(), user.uid, styleId);
        setUserVibes(selectedStyles);
        setVibeCounts(vibeCounts);
    } catch (error: any) {
        Alert.alert('Oups', error.message || 'Impossible de voter pour ce style.');
    } finally {
        setVoting(false);
    }
  };

  // Predefined Styles
  const COURT_STYLES = [
    { id: 'familial', label: t('map.style_familial'), icon: 'people', color: '#34C759' },
    { id: 'chill', label: t('map.style_chill'), icon: 'leaf', color: '#007AFF' },
    { id: 'hard', label: t('map.style_hard'), icon: 'flame', color: '#FF3B30' },
    { id: 'cosy', label: t('map.style_cosy'), icon: 'cafe', color: '#5856D6' },
    { id: 'elite', label: t('map.style_elite'), icon: 'trophy', color: '#FFD60A' },
    { id: 'street', label: t('map.style_street'), icon: 'musical-notes', color: '#AF52DE' },
  ];

  const loadEvents = async () => {
    if (!playground) return;
    setLoadingEvents(true);
    const fetchedEvents = await getPlaygroundEvents(playground.id.toString());
    setEvents(fetchedEvents);
    setLoadingEvents(false);
  };

  const loadStories = async () => {
    if (!playground) return;
    setLoadingStories(true);
    try {
      const q = query(
        collection(db, DB_COLLECTIONS.POSTS), 
        where('playgroundId', '==', playground.id.toString()),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const querySnapshot = await getDocs(q);
      const fetchedStories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStories(fetchedStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const loadAddress = async () => {
      if (!playground) return;

      // First check tags
      const street = playground.tags?.['addr:street'];
      const houseNumber = playground.tags?.['addr:housenumber'];
      const city = playground.tags?.['addr:city'];
      const postcode = playground.tags?.['addr:postcode'];
      
      if (street) {
          setAddress([houseNumber, street, postcode, city].filter(Boolean).join(' '));
          return;
      }

      // Fallback to reverse geocoding
      setLoadingAddress(true);
      try {
          const result = await Location.reverseGeocodeAsync({
              latitude: playground.lat,
              longitude: playground.lon
          });

          if (result && result.length > 0) {
              const addr = result[0];
              const formatted = [
                  addr.streetNumber,
                  addr.street,
                  addr.postalCode,
                  addr.city
              ].filter(Boolean).join(' ');
              setAddress(formatted || t('map.unknown_address'));
          } else {
              setAddress(t('map.unknown_address'));
          }
      } catch (error) {
          console.error('Error reverse geocoding:', error);
          setAddress(t('map.unknown_address'));
      } finally {
          setLoadingAddress(false);
      }
  };


  const handlePublishVideo = async () => {
    if (!user) {
      Alert.alert(t('auth.login_required'), t('auth.event_login_msg'));
      return;
    }

    if (distance === null || distance > MAX_STORY_DISTANCE) {
      Alert.alert('Trop loin', `Vous devez être à proximité du terrain pour publier une story (Distance actuelle : ${distance ? Math.round(distance) : '?'}m)`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour enregistrer une vidéo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 10,
    });

    if (!result.canceled) {
      uploadVideo(result.assets[0].uri);
    }
  };

  const uploadVideo = async (uri: string) => {
    setUploading(true);
    try {
      const videoUrl = await cloudinaryService.uploadVideo(uri);
      if (videoUrl) {
        const city = playground.tags?.['addr:city'];
        const postcode = playground.tags?.['addr:postcode'];
        
        let locationDetail = '';
        if (postcode && city) {
          locationDetail = `${postcode} ${city}`;
        } else if (city) {
          locationDetail = city;
        } else if (address) {
          // Use computed address if tags are missing (handles reverse geocoding result)
          locationDetail = address;
        }

        const postDescription = `${playground.name}${locationDetail ? ' - ' + locationDetail : ''} 🏀`;

        await addDoc(collection(db, DB_COLLECTIONS.POSTS), {
          userId: user!.uid,
          userName: profile?.displayName || 'Utilisateur Ankece',
          videoUri: videoUrl,
          description: postDescription,
          playgroundId: playground.id.toString(),
          likes: [],
          createdAt: Date.now(),
        });

        Alert.alert('Succès', 'Votre story a été publiée dans le fil d\'actu !');
        loadStories(); // Refresh modal view
      }
    } catch (error) {
      console.error('Video upload error:', error);
      Alert.alert('Erreur', 'Impossible de publier la vidéo.');
    } finally {
      setUploading(false);
    }
  };

  const handleGoLive = async () => {
    if (!user) {
      Alert.alert(t('auth.login_required'), t('auth.event_login_msg'));
      return;
    }

    if (distance === null || distance > MAX_STORY_DISTANCE) {
      Alert.alert('Trop loin', `Vous devez être à proximité du terrain pour lancer un live (Distance actuelle : ${distance ? Math.round(distance) : '?'}m)`);
      return;
    }

    onClose();
    router.push({
      pathname: '/live-broadcast',
      params: { 
        playgroundId: playground.id.toString(),
        playgroundName: playground.name
      }
    });
  };

  const handleStopLive = async (postId: string) => {
    setUploading(true);
    try {
      await stopLiveStream(postId);
      Alert.alert('Succès', 'Le live a été arrêté et supprimé.');
      loadStories(); // Refresh modal view
    } catch (error) {
      console.error('Stop live error:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter le live.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleRSVP = async (event: EventData, type: 'interested' | 'present') => {
      if (!user) {
          Alert.alert(t('auth.login_required'), t('auth.event_login_msg'));
          return;
      }

      const isJoining = !event[type]?.some(p => p.uid === user.uid);
      
      try {
          await toggleEventRSVP(
              playground.id.toString(),
              event.id,
              { uid: user.uid, displayName: profile?.displayName || user.email || 'Utilisateur' },
              type,
              isJoining
          );
          loadEvents(); // Refresh to see changes
      } catch (error) {
          Alert.alert(t('common.error'), t('common.rsvp_error'));
      }
  };

  if (!playground) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.title} numberOfLines={1}>{playground.name}</ThemedText>
          <View style={{ width: 24 }} /> 
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 40}}>
            {playground.tags?.image ? (
              <Image 
                  source={{ uri: playground.tags.image }} 
                  style={styles.primaryImage}
                  resizeMode="cover"
              />
            ) : (
              <View style={[styles.primaryImage, styles.placeholderContainer]}>
                <Ionicons name="camera-outline" size={48} color="#ccc" />
                <ThemedText style={styles.placeholderText}>{t('map.no_photo')}</ThemedText>
              </View>
            )}

            <View style={styles.addressSection}>
                <Ionicons name="location-outline" size={16} color={tintColor} />
                {loadingAddress ? (
                    <ActivityIndicator size="small" style={{marginLeft: 8}} />
                ) : (
                    <ThemedText style={styles.addressText}>{address || t('map.loading_address')}</ThemedText>
                )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.storyButton, { backgroundColor: tintColor, shadowColor: tintColor }, (distance === null || distance > MAX_STORY_DISTANCE) && styles.storyButtonDisabled]} 
                onPress={handlePublishVideo}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={accentTextColor} size="small" />
                ) : (
                  <>
                    <Ionicons name="videocam" size={20} color={accentTextColor} />
                    <ThemedText style={[styles.storyButtonText, { color: accentTextColor }]}>
                      {distance !== null && distance > MAX_STORY_DISTANCE ? 'Trop loin' : 'Publier une story'}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>

              {stories.some(s => s.isLive && s.userId === user?.uid) ? (
                <TouchableOpacity 
                  style={[styles.liveButton, { backgroundColor: '#FF9500' }]} 
                  onPress={() => {
                    const myLive = stories.find(s => s.isLive && s.userId === user?.uid);
                    if (myLive) handleStopLive(myLive.id);
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="stop-circle" size={20} color="#fff" />
                      <ThemedText style={[styles.storyButtonText, { color: '#fff' }]}>Arrêter le Live</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.liveButton, (distance === null || distance > MAX_STORY_DISTANCE) && styles.storyButtonDisabled]} 
                  onPress={handleGoLive}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="radio" size={20} color="#fff" />
                      <ThemedText style={[styles.storyButtonText, { color: '#fff' }]}>
                        {distance !== null && distance > MAX_STORY_DISTANCE ? t('map.too_far_live') : t('map.go_live')}
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.detailsContainer}>
                {stories.some(s => s.isLive) && (
                    <View style={[styles.detailBadge, {backgroundColor: '#FF3B30', borderColor: '#FF3B30'}]}>
                        <Ionicons name="radio" size={12} color="#fff" />
                        <ThemedText style={[styles.detailBadgeText, {color: '#fff', fontWeight: 'bold'}]}>{t('map.is_live')}</ThemedText>
                    </View>
                )}
                {playground.tags?.surface && (
                    <ThemedText style={styles.detailText}>{t('map.surface')}: {playground.tags.surface}</ThemedText>
                )}
                {playground.tags?.access && (
                    <ThemedText style={styles.detailText}>{t('map.access')}: {t(`map.${playground.tags.access}`, {defaultValue: playground.tags.access})}</ThemedText>
                )}
                 {playground.tags?.hoops && (
                    <ThemedText style={styles.detailText}>{t('map.hoops')}: {playground.tags.hoops}</ThemedText>
                )}
                {(playground.tags?.club === 'sport' || playground.name?.toLowerCase().includes('club')) && (
                    <ThemedText style={[styles.detailText, {backgroundColor: '#34C75920', color: '#34C759', fontWeight: 'bold'}]}>
                        {t('map.category_club')}
                    </ThemedText>
                )}
                {(playground.tags?.indoor === 'yes' || playground.tags?.leisure === 'sports_centre' || playground.name?.toLowerCase().includes('hoop')) && (
                    <ThemedText style={[styles.detailText, {backgroundColor: '#5856D620', color: '#5856D6', fontWeight: 'bold'}]}>
                        {t('map.category_indoor')}
                    </ThemedText>
                )}
                {playground.tags?.fee === 'yes' && (
                    <ThemedText style={[styles.detailText, {backgroundColor: '#FF950020', color: '#FF9500', fontWeight: 'bold'}]}>
                        {t('map.paid')}
                    </ThemedText>
                )}
                {playground.tags?.showers === 'yes' && (
                    <View style={styles.detailBadge}>
                        <Ionicons name="water-outline" size={12} color="#4A90E2" />
                        <ThemedText style={styles.detailBadgeText}>{t('map.showers')}</ThemedText>
                    </View>
                )}
                {playground.tags?.changing_rooms && playground.tags?.changing_rooms !== '0' && (
                    <View style={styles.detailBadge}>
                        <Ionicons name="shirt-outline" size={12} color="#8E8E93" />
                        <ThemedText style={styles.detailBadgeText}>{t('map.changing_rooms')} ({playground.tags.changing_rooms})</ThemedText>
                    </View>
                )}
            </View>

            {playground.tags?.handicap && (
                <View style={styles.handicapSection}>
                    <Ionicons name="accessibility-outline" size={16} color="#007AFF" />
                    <ThemedText style={styles.handicapText}>{t('map.handicap_access')}: {playground.tags.handicap}</ThemedText>
                </View>
            )}

            {(playground.tags?.phone || playground.tags?.website) && (
                <View style={[styles.detailsContainer, {marginTop: -10, marginBottom: 16}]}>
                    {playground.tags?.phone && (
                        <TouchableOpacity style={styles.contactItem} onPress={() => Alert.alert(t('map.phone'), playground.tags.phone)}>
                            <Ionicons name="call-outline" size={16} color={tintColor} />
                            <ThemedText style={{fontSize: 12, marginLeft: 4}}>{playground.tags.phone}</ThemedText>
                        </TouchableOpacity>
                    )}
                    {playground.tags?.website && (
                        <TouchableOpacity style={styles.contactItem} onPress={() => Alert.alert(t('map.website'), playground.tags.website)}>
                            <Ionicons name="globe-outline" size={16} color={tintColor} />
                            <ThemedText style={{fontSize: 12, marginLeft: 4}} numberOfLines={1}>{playground.tags.website}</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Events Section */}
            <View style={styles.sectionHeader}>
                <ThemedText type="defaultSemiBold">{t('map.events')}</ThemedText>
                <TouchableOpacity 
                    onPress={() => {
                        if (!user) {
                            Alert.alert(t('auth.login_required'), t('auth.propose_login_msg'));
                            return;
                        }
                        setEventModalVisible(true);
                    }} 
                    style={styles.addButton}
                >
                    <Ionicons name="add-circle-outline" size={20} color={tintColor} />
                    <ThemedText style={{color: tintColor, marginLeft: 5}}>{t('common.propose')}</ThemedText>
                </TouchableOpacity>
            </View>

            {loadingEvents ? (
                <ActivityIndicator size="small" style={{marginVertical: 10}} />
            ) : (
                <View style={styles.eventList}>
                    {events.length === 0 ? (
                        <ThemedText style={styles.emptyText}>{t('map.no_events')}</ThemedText>
                    ) : (
                        events.map((event) => {
                            const isInterested = event.interested?.some(p => p.uid === user?.uid);
                            const isPresent = event.present?.some(p => p.uid === user?.uid);

                            return (
                                <View key={event.id} style={styles.eventCard}>
                                    <View style={styles.eventHeader}>
                                        <View style={[styles.eventIcon, { backgroundColor: tintColor + '20' }]}>
                                            <Ionicons 
                                                name={
                                                    event.type === 'Match' ? 'basketball' : 
                                                    event.type === 'Coaching' ? 'school' :
                                                    event.type === '3x3' ? 'people' :
                                                    event.type === '1vs1' ? 'person' :
                                                    'flash'
                                                } 
                                                size={20} 
                                                color={tintColor} 
                                            />
                                        </View>
                                        <View style={styles.eventInfo}>
                                            <ThemedText type="defaultSemiBold">{event.title}</ThemedText>
                                            <ThemedText style={styles.eventTime}>
                                                {format(event.date.toDate(), i18n.language === 'fr' ? "eeee d MMMM 'à' HH:mm" : "eeee, MMMM do 'at' h:mm a", { locale: dateLocale })}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    
                                    {event.description && (
                                        <ThemedText style={styles.eventDesc}>{event.description}</ThemedText>
                                    )}

                                    <View style={styles.rsvpRow}>
                                        <TouchableOpacity 
                                            style={[styles.rsvpButton, isInterested && { backgroundColor: tintColor + '30' }]} 
                                            onPress={() => handleToggleRSVP(event, 'interested')}
                                        >
                                            <Ionicons name={isInterested ? "star" : "star-outline"} size={16} color={tintColor} />
                                            <ThemedText style={styles.rsvpText}>{t('map.interested')} ({event.interested?.length || 0})</ThemedText>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.rsvpButton, isPresent && { backgroundColor: '#4CAF5030' }]} 
                                            onPress={() => handleToggleRSVP(event, 'present')}
                                        >
                                            <Ionicons name={isPresent ? "checkmark-circle" : "checkmark-circle-outline"} size={16} color={isPresent ? "#4CAF50" : tintColor} />
                                            <ThemedText style={[styles.rsvpText, isPresent && { color: '#4CAF50' }]}>{t('map.present')} ({event.present?.length || 0})</ThemedText>
                                        </TouchableOpacity>
                                    </View>

                                    {((event.interested?.length || 0) > 0 || (event.present?.length || 0) > 0) && (
                                        <View style={styles.participantsList}>
                                            <ThemedText style={styles.participantsTitle}>{t('map.participants')} :</ThemedText>
                                            <View style={styles.participantsGrid}>
                                                {[...(event.present || []), ...(event.interested || [])]
                                                    .filter((v, i, a) => a.findIndex(t => t.uid === v.uid) === i) // Unique UIDs
                                                    .map(participant => (
                                                        <TouchableOpacity 
                                                            key={participant.uid} 
                                                            style={styles.participantBadge}
                                                            onPress={() => {
                                                                onClose();
                                                                router.push({
                                                                    pathname: '/public-profile/[id]',
                                                                    params: { id: participant.uid }
                                                                });
                                                            }}
                                                        >
                                                            <ThemedText style={styles.participantName}>{participant.name}</ThemedText>
                                                            {event.present?.some(p => p.uid === participant.uid) && (
                                                                <Ionicons name="checkmark-circle" size={12} color="#4CAF50" style={{marginLeft: 2}} />
                                                            )}
                                                        </TouchableOpacity>
                                                    ))
                                                }
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            )}

            {/* Leaderboard Section */}
            <View style={styles.galleryHeader}>
                <ThemedText type="defaultSemiBold">Records du Terrain 🏆</ThemedText>
            </View>
            <View style={styles.leaderboardSection}>
                {bestSessions.map((s: ShootingSession, idx: number) => (
                    <View key={s.id} style={styles.leaderboardItem}>
                        <ThemedText style={styles.rankText}>#{idx + 1}</ThemedText>
                        <ThemedText style={styles.rankName}>{s.userName || 'Joueur'}</ThemedText>
                        <ThemedText style={styles.rankScore}>{s.totalMade} tirs</ThemedText>
                    </View>
                ))}
                {bestSessions.length === 0 && (
                    <ThemedText style={styles.emptyText}>Aucun record pour le moment. Soyez le premier !</ThemedText>
                )}
            </View>

            {/* Stories Section */}
            <View style={styles.galleryHeader}>
                <ThemedText type="defaultSemiBold">Stories (Vidéos)</ThemedText>
            </View>

            {loadingStories ? (
                <ActivityIndicator size="small" style={{marginTop: 10}} />
            ) : (
                <FlatList
                    data={stories}
                    horizontal
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.storyCard}
                            onPress={() => setSelectedStory(item)}
                        >
                            <Image source={{ uri: item.videoUri }} style={styles.storyVideoThumbnail} />
                            <View style={styles.storyOverlay}>
                                <Ionicons name="play" size={24} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <ThemedText style={{marginTop: 10, fontStyle: 'italic', opacity: 0.6}}>Aucune vidéo récente.</ThemedText>
                    }
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom: 20}}
                />
            )}

            <View style={styles.galleryHeader}>
                <ThemedText type="defaultSemiBold">{t('map.court_style')}</ThemedText>
            </View>

            <View style={styles.styleGrid}>
                {COURT_STYLES.map((style) => {
                    const isSelected = userVibes.includes(style.id);
                    const count = vibeCounts[style.id] || 0;
                    
                    return (
                        <TouchableOpacity 
                            key={style.id} 
                            onPress={() => handleVoteStyle(style.id)}
                            style={[
                                styles.styleBadge, 
                                { backgroundColor: style.color + '15', borderColor: style.color + (isSelected ? 'CC' : '40') },
                                isSelected && { borderWidth: 1.5 }
                            ]}
                            disabled={voting}
                        >
                            <Ionicons name={style.icon as any} size={16} color={style.color} />
                            <ThemedText style={[styles.styleBadgeText, { color: style.color }]}>{style.label}</ThemedText>
                            {count > 0 && (
                                <View style={[styles.countBadge, { backgroundColor: style.color }]}>
                                    <ThemedText style={styles.countText}>{count}</ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

        </ScrollView>

        <EventCreationModal 
            visible={eventModalVisible}
            playgroundId={playground.id.toString()}
            userId={user?.uid || ''}
            onClose={() => setEventModalVisible(false)}
            onSuccess={loadEvents}
        />


        {/* Player Modal */}
        <Modal
            visible={!!selectedStory}
            transparent={false}
            animationType="slide"
            onRequestClose={() => setSelectedStory(null)}
        >
            <StoryPlayerOverlay 
                uri={selectedStory?.videoUri} 
                onClose={() => setSelectedStory(null)} 
                userName={selectedStory?.userName}
                description={selectedStory?.description}
                createdAt={selectedStory?.createdAt}
            />
        </Modal>
      </ThemedView>
    </Modal>
  );
};

// Sub-component for Story Playback
const StoryPlayerOverlay = ({ uri, onClose, userName, description, createdAt }: { uri: string, onClose: () => void, userName?: string, description?: string, createdAt?: number }) => {
    const { i18n } = useTranslation();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;

    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.play();
    });

    return (
        <View style={styles.playerContainer}>
            <VideoView
                style={styles.fullVideo}
                player={player}
                nativeControls={false}
                contentFit="cover"
            />
            
            <TouchableOpacity style={styles.closePlayer} onPress={onClose}>
                <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <View style={styles.playerInfo}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                    <ThemedText style={styles.playerUser}>{userName || 'Utilisateur'}</ThemedText>
                    {createdAt && (
                        <ThemedText style={styles.playerTime}>
                            • {formatDistanceToNow(createdAt, { addSuffix: true, locale: dateLocale })}
                        </ThemedText>
                    )}
                </View>
                <ThemedText style={styles.playerDesc}>{description}</ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
      flex: 1,
      textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  content: {
      flex: 1,
      paddingHorizontal: 16,
  },
  primaryImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 16,
  },
  addressSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      opacity: 0.8,
  },
  addressText: {
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
  },
  detailsContainer: {
      marginBottom: 24,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
  },
  detailText: {
      backgroundColor: 'rgba(150, 150, 150, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  storyButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#7c3aed', // Updated shadow color to match new background
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  liveButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  storyButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  storyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  galleryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 24,
  },
  galleryImage: {
      width: 120,
      height: 120,
      borderRadius: 8,
      marginRight: 10,
  },
  storyCard: {
      width: 100,
      height: 160,
      borderRadius: 12,
      marginRight: 12,
      overflow: 'hidden',
      backgroundColor: '#000',
      position: 'relative',
  },
  storyVideoThumbnail: {
      width: '100%',
      height: '100%',
      opacity: 0.7,
  },
  storyOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
  },
  playerContainer: {
      flex: 1,
      backgroundColor: '#000',
  },
  fullVideo: {
      flex: 1,
  },
  closePlayer: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
  },
  playerInfo: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
  },
  playerUser: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 18,
  },
  playerTime: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 14,
      marginLeft: 8,
  },
  playerDesc: {
      color: '#fff',
      fontSize: 14,
      opacity: 0.9,
  },
  placeholderContainer: {
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
  },
  placeholderText: {
      marginTop: 8,
      opacity: 0.5,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  addButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  eventList: {
      gap: 12,
  },
  eventCard: {
      padding: 12,
      backgroundColor: 'rgba(150, 150, 150, 0.1)',
      borderRadius: 12,
      marginBottom: 12,
  },
  eventHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  eventIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  eventInfo: {
      flex: 1,
  },
  eventTime: {
      fontSize: 12,
      opacity: 0.6,
      marginTop: 2,
      textTransform: 'capitalize',
  },
  eventDesc: {
      fontSize: 13,
      opacity: 0.8,
      marginBottom: 12,
  },
  rsvpRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
  },
  rsvpButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(150, 150, 150, 0.2)',
      backgroundColor: 'rgba(150, 150, 150, 0.05)',
      gap: 6,
  },
  rsvpText: {
      fontSize: 12,
      fontWeight: '600',
  },
  participantsList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(150, 150, 150, 0.2)',
      paddingTop: 8,
  },
  participantsTitle: {
      fontSize: 11,
      opacity: 0.6,
      marginBottom: 6,
  },
  participantsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
  },
  participantBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(150, 150, 150, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  participantName: {
      fontSize: 11,
      fontWeight: '500',
  },
  emptyText: {
      fontStyle: 'italic',
      opacity: 0.5,
      textAlign: 'center',
      paddingVertical: 10,
  },
  reportModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  reportModalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 12,
      padding: 20,
  },
  reportOption: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(150, 150, 150, 0.05)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 8,
  },
  detailBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(150, 150, 150, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
  },
  detailBadgeText: {
      fontSize: 12,
  },
  handicapSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: 'rgba(0, 122, 255, 0.05)',
      padding: 10,
      borderRadius: 8,
      gap: 8,
  },
  handicapText: {
      fontSize: 12,
      color: '#007AFF',
      flex: 1,
  },
  styleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      marginTop: 8,
  },
  styleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      gap: 6,
  },
  styleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
  },
  countBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 20, // Match height of countBadge for vertical centering
    marginBottom: 1, // Slight adjustment if still too low
  },
  leaderboardSection: {
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  rankText: {
    width: 30,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  rankName: {
    flex: 1,
    fontWeight: '500',
  },
  rankScore: {
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
