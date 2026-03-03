import { CoachCard } from '@/components/coach/CoachCard';
import { CoachFilterModal } from '@/components/coach/CoachFilterModal';
import { CoachLeafletMap } from '@/components/coach/CoachLeafletMap';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserIconButton } from '@/components/UserIconButton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCoachByUserId, getCoachesByStatus } from '@/services/coachService';
import { notificationService } from '@/services/notificationService';
import { Coach } from '@/types/coach';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function CoachDiscoveryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [layerType, setLayerType] = useState<'standard' | 'dark' | 'satellite'>('standard');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const mapRef = React.useRef<any>(null);
  const { user } = useAuth();
  const [userCoach, setUserCoach] = useState<Coach | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = async () => {
    try {
      setLoadingCoaches(true);
      const [activeCoaches, myCoach] = await Promise.all([
        getCoachesByStatus('active'),
        user ? getCoachByUserId(user.uid) : Promise.resolve(null)
      ]);
      setCoaches(activeCoaches);
      setUserCoach(myCoach);
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoadingCoaches(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();

    loadData();

    if (user) {
      // Subscribe to notifications to show the badge
      const unsubscribe = notificationService.subscribeToUserNotifications(user.uid, (notifs) => {
        const unread = notifs.filter(n => !n.readBy.includes(user.uid) && !n.archivedBy.includes(user.uid)).length;
        setUnreadCount(unread);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const refreshMap = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        if (mapRef.current) {
          mapRef.current.setRegion(currentLocation.coords.latitude, currentLocation.coords.longitude);
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const filteredCoaches = useMemo(() => {
    return (coaches || []).filter((coach: Coach) => {
      const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           coach.location.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!activeFilters) return matchesSearch;

      const matchesSpecialty = activeFilters.specialties.length === 0 || 
                               coach.specialties.some((s: any) => activeFilters.specialties.includes(s));
      
      const matchesLevel = activeFilters.levels.length === 0 || 
                           coach.levels.some((l: any) => activeFilters.levels.includes(l));
      
      const matchesPrice = coach.priceRange.max <= activeFilters.budgetRange[1];

      return matchesSearch && matchesSpecialty && matchesLevel && matchesPrice;
    });
  }, [searchQuery, activeFilters, coaches]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <ThemedText type="title" style={styles.headerTitle}>{t('tabs.coach')}</ThemedText>
            <View style={styles.headerIcons}>
              {user && unreadCount > 0 && (
                <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
                  <IconSymbol name="bell.fill" size={26} color={Colors[colorScheme].text} />
                  <View style={[styles.badge, { backgroundColor: tintColor }]}>
                    <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                  </View>
                </TouchableOpacity>
              )}
              <UserIconButton color={Colors[colorScheme].text} size={32} />
            </View>
          </View>
          <View style={styles.searchRow}>
            <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={[styles.input, { color: Colors[colorScheme].text }]}
                placeholder={t('coach.search_placeholder')}
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity 
                style={[styles.filterButton, { backgroundColor: activeFilters ? tintColor : (colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7') }]}
                onPress={() => setIsFilterVisible(true)}
            >
              <Ionicons name="options" size={22} color={activeFilters ? '#FFF' : Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'list' && { borderBottomColor: tintColor, borderBottomWidth: 3 }]}
              onPress={() => setViewMode('list')}
            >
              <ThemedText style={[styles.tabText, viewMode === 'list' && { color: tintColor, fontWeight: '700' }]}>{t('coach.view_list')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'map' && { borderBottomColor: tintColor, borderBottomWidth: 3 }]}
              onPress={() => setViewMode('map')}
            >
              <ThemedText style={[styles.tabText, viewMode === 'map' && { color: tintColor, fontWeight: '700' }]}>{t('coach.view_map')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section */}
        {loadingCoaches ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 16 }}>{t('common.loading') || 'Chargement...'}</ThemedText>
          </View>
        ) : viewMode === 'list' ? (
          <FlatList
            data={filteredCoaches}
            renderItem={({ item }) => (
              <CoachCard 
                coach={item} 
                onPress={() => router.push(`/coach/${item.id}` as any)} 
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#8E8E93" />
                <ThemedText style={styles.emptyText}>{t('coach.no_results')}</ThemedText>
              </View>
            }
            refreshing={loadingCoaches}
            onRefresh={loadData}
          />
        ) : (
          <View style={styles.mapContainer}>
            <CoachLeafletMap
              ref={mapRef}
              region={{
                latitude: location?.coords.latitude || 46.2276,
                longitude: location?.coords.longitude || 2.2137,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              coaches={filteredCoaches}
              onCoachSelect={(coach) => router.push(`/coach/${coach.id}` as any)}
              tintColor={tintColor}
              layerType={layerType}
              userLocation={location?.coords}
            />

            <TouchableOpacity 
              style={[styles.layerButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#FFF' }]} 
              onPress={() => {
                  const types: ('standard' | 'dark' | 'satellite')[] = ['standard', 'dark', 'satellite'];
                  const nextIndex = (types.indexOf(layerType) + 1) % types.length;
                  setLayerType(types[nextIndex]);
              }}
            >
              <Ionicons 
                  name={layerType === 'standard' ? "map" : layerType === 'dark' ? "moon" : "earth"} 
                  size={24} 
                  color={tintColor} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: tintColor }]} 
              onPress={refreshMap}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="refresh" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: userCoach?.status === 'pending' ? '#8E8E93' : '#FF9500' }]} 
          onPress={() => {
            if (!userCoach) {
                router.push('/coach/create' as any);
            } else if (userCoach.status === 'rejected') {
                router.push({ pathname: '/coach/create', params: { id: userCoach.id } } as any);
            } else {
                router.push(`/coach/${userCoach.id}` as any);
            }
          }}
        >
          <Ionicons 
            name={
                !userCoach ? "add" : 
                userCoach.status === 'pending' ? "help-circle-outline" : 
                userCoach.status === 'rejected' ? "alert-circle-outline" :
                "person-outline"
            } 
            size={30} 
            color="#fff" 
          />
        </TouchableOpacity>
      </SafeAreaView>

      <CoachFilterModal 
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={setActiveFilters}
      />
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC5',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 18,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  listContent: {
    padding: 16,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  layerButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1001,
  },
});
