import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { suggestionService } from '@/services/suggestionService';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { LeafletMap } from './LeafletMap';
import { PlaygroundDetailModal } from './PlaygroundDetailModal';
import { ProposePlaygroundModal } from './ProposePlaygroundModal';

interface Playground {
  id: string | number;
  lat: number;
  lon: number;
  name?: string;
  image?: string;
  tags?: {
    [key: string]: string;
  };
  source?: 'OSM' | 'DataES';
  isLive?: boolean;
}

interface Suggestion {
  id: string;
  label: string;
  city: string;
  postcode: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export const PlaygroundMap = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlaygrounds, setLoadingPlaygrounds] = useState(false);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const cache = React.useRef<Map<string, Playground[]>>(new Map());
  const [modalVisible, setModalVisible] = useState(false);
  const [proposeModalVisible, setProposeModalVisible] = useState(false);
  const [layerType, setLayerType] = useState<'standard' | 'dark' | 'satellite'>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeLives, setActiveLives] = useState<any[]>([]);
  const mapRef = React.useRef<any>(null);
  const { t } = useTranslation();
  
  const fetchActiveLives = async () => {
    try {
      const { getActiveLiveStreams } = await import('@/services/playgroundService');
      const lives = await getActiveLiveStreams();
      setActiveLives(lives);
    } catch (error) {
      console.error('Error fetching lives:', error);
    }
  };

  useEffect(() => {
    fetchActiveLives();
    const interval = setInterval(fetchActiveLives, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const cardBackground = Colors[colorScheme].card;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('map.permission_denied'), 
          t('map.permission_denied_desc'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.settings'), onPress: () => Linking.openSettings() }
          ]
        );
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setLoading(false);
      fetchPlaygrounds(location.coords.latitude, location.coords.longitude);
    })();
  }, []);



  
  const fetchDataES = async (lat: number, lon: number): Promise<Playground[]> => {
    try {
      const radius = 5000;
      const url = `https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?limit=100&where=aps_name%20like%20%22Basket-ball%22%20AND%20within_distance(equip_coordonnees%2C%20geom'POINT(${lon}%20${lat})'%2C%20${radius}m)`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Data ES API error');
      
      const data = await response.json();
      
      return (data.results || []).map((item: any) => {
          const fullName = item.inst_nom === item.equip_nom 
            ? item.inst_nom 
            : `${item.inst_nom} - ${item.equip_nom}`;
            
          return {
              id: item.equip_numero || item.inst_numero,
              lat: item.equip_coordonnees.lat,
              lon: item.equip_coordonnees.lon,
              name: fullName,
              source: 'DataES',
              tags: {
                  surface: item.equip_sol,
                  nature: item.equip_nature,
                  indoor: item.equip_nature === 'Intérieur' ? 'yes' : 'no',
                  access: item.equip_acc_libre === 'true' ? 'yes' : 'private',
                  fee: item.equip_prop_type?.toLowerCase().includes('privé') ? 'yes' : 'no',
                  'addr:street': item.inst_adresse,
                  'addr:postcode': item.inst_cp,
                  'addr:city': item.new_name,
                  phone: item.inst_tel,
                  website: item.equip_url,
                  showers: item.equip_douche === 'true' ? 'yes' : 'no',
                  changing_rooms: item.equip_vest_sport?.toString(),
                  handicap: item.equip_acces_handi_mobilite
              }
          };
      });
    } catch (error) {
      console.error('Error fetching from Data ES:', error);
      return [];
    }
  };

  const fetchOSM = async (lat: number, lon: number): Promise<Playground[]> => {
    const query = `
      [out:json][timeout:15];
      (
        nwr["sport"="basketball"](around:3000, ${lat}, ${lon});
        nwr["leisure"="sports_centre"]["sport"="basketball"](around:3000, ${lat}, ${lon});
        nwr["name"~"Hoop|Basket",i](around:3000, ${lat}, ${lon});
      );
      out center;
    `;
    
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];
    
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return (data.elements || []).map((element: any) => ({
              id: element.id,
              lat: element.lat || element.center?.lat,
              lon: element.lon || element.center?.lon,
              name: element.tags?.name || t('map.default_court_name'),
              tags: element.tags,
              source: 'OSM'
          }));
        }
      } catch (e) {
        console.log(`Failed with ${endpoint}`);
      }
    }
    return [];
  };
  
  const fetchPlaygrounds = async (lat: number, lon: number, forceRefresh = false) => {
    const cacheKey = `${lat.toFixed(3)}-${lon.toFixed(3)}`;
    if (!forceRefresh && cache.current.has(cacheKey)) {
        setPlaygrounds(cache.current.get(cacheKey)!);
        return;
    }

    setLoadingPlaygrounds(true);
    if (forceRefresh) {
        setPlaygrounds([]);
    }

    const updateResults = (newResults: Playground[]) => {
        setPlaygrounds(prev => {
            const merged = [...prev];
            newResults.forEach(nr => {
                const exists = merged.some(existing => 
                    Math.abs(existing.lat - nr.lat) < 0.0005 && 
                    Math.abs(existing.lon - nr.lon) < 0.0005
                );
                if (!exists) merged.push(nr);
            });
            cache.current.set(cacheKey, merged);
            return merged;
        });
    };

    try {
        // 1. Start fetching Data ES and Community suggestions in parallel (faster)
        const fastFetchPromise = Promise.allSettled([
            fetchDataES(lat, lon),
            suggestionService.getApprovedSuggestions()
        ]).then(results => {
            const dataES = results[0].status === 'fulfilled' ? results[0].value : [];
            const community = results[1].status === 'fulfilled' ? 
                results[1].value.map(s => ({
                    id: s.id,
                    lat: s.lat,
                    lon: s.lon,
                    name: s.name,
                    source: 'DataES',
                    tags: {
                        image: s.photoUrl,
                        note: 'Suggéré par la communauté'
                    }
                } as Playground)) : [];
            
            updateResults([...dataES, ...community]);
        });

        // 2. Start OSM fetch in parallel
        const osmPromise = fetchOSM(lat, lon).then(osmCourts => {
            updateResults(osmCourts);
        });

        // Wait for at least the fast results to finish loading state if they were extremely fast
        // but we'll let OSM finish in background anyway.
        await Promise.allSettled([fastFetchPromise, osmPromise]);
    } catch (error) {
       console.error('Error fetching playgrounds:', error);
       Alert.alert(t('map.error'), t('map.api_error'));
    } finally {
      setLoadingPlaygrounds(false);
    }
  };

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&type=municipality&limit=5`);
      const data = await response.json();
      const formatted = data.features.map((f: any) => ({
        id: f.properties.id,
        label: `${f.properties.name} (${f.properties.postcode})`,
        city: f.properties.name,
        postcode: f.properties.postcode,
        coords: {
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0]
        }
      }));
      setSuggestions(formatted);
      setShowSuggestions(formatted.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3 && !searchingLocation) {
        fetchSuggestions(searchQuery);
      } else if (searchQuery.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSuggestions]);

  const refreshMap = async () => {
     try {
        setLoadingPlaygrounds(true);
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
           const currentLocation = await Location.getCurrentPositionAsync({});
           setLocation(currentLocation);
           setSearchQuery('');
           if (mapRef.current) {
              mapRef.current.setRegion(currentLocation.coords.latitude, currentLocation.coords.longitude);
           }
           await fetchPlaygrounds(currentLocation.coords.latitude, currentLocation.coords.longitude, true);
        } else if (location) {
           await fetchPlaygrounds(location.coords.latitude, location.coords.longitude, true);
        }
     } catch (error) {
        console.error('Refresh error:', error);
     } finally {
        setLoadingPlaygrounds(false);
     }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // If we have suggestions, use the first one as default if user just presses Enter
    if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
        return;
    }

    setSearchingLocation(true);
    setShowSuggestions(false);
    try {
        const results = await Location.geocodeAsync(searchQuery);
        if (results && results.length > 0) {
            const { latitude, longitude } = results[0];
            
            // Move map
            if (mapRef.current) {
                mapRef.current.setRegion(latitude, longitude);
            }
            
            fetchPlaygrounds(latitude, longitude, true);
            
            setLocation({
                coords: {
                    latitude,
                    longitude,
                    altitude: null,
                    accuracy: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: Date.now()
            } as any);
            Keyboard.dismiss();
        } else {
            Alert.alert(t('common.error'), t('map.search_no_results') || 'Aucun résultat trouvé');
        }
    } catch (error) {
        console.error('Search error:', error);
        Alert.alert(t('common.error'), t('map.search_error') || 'Erreur lors de la recherche');
    } finally {
        setSearchingLocation(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const { latitude, longitude } = suggestion.coords;
    setSearchQuery(suggestion.label);
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (mapRef.current) {
        mapRef.current.setRegion(latitude, longitude);
    }
    
    fetchPlaygrounds(latitude, longitude, true);
    
    setLocation({
        coords: {
            latitude,
            longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
        },
        timestamp: Date.now()
    } as any);
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText>{t('map.locating')}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location ? (
        <LeafletMap
          ref={mapRef}
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          playgrounds={playgrounds.map(p => ({
            ...p,
            isLive: activeLives.some(live => live.playgroundId === p.id.toString())
          }))}
          onPlaygroundSelect={(playground: Playground) => {
            setSelectedPlayground(playground);
            setModalVisible(true);
          }}
          tintColor={tintColor}
          layerType={layerType}
          userLocation={location.coords}
        />
      ) : (
         <View style={styles.centered}>
             <ThemedText>{t('map.location_unavailable')}</ThemedText>
         </View>
       )}

       <View style={styles.searchContainer}>
          <View style={{ flex: 1 }}>
            <View style={[styles.searchBar, { backgroundColor: cardBackground }]}>
               <Ionicons name="search" size={20} color={tintColor} style={{ marginRight: 8 }} />
               <TextInput
                  style={[styles.searchInput, { color: Colors[colorScheme].text }]}
                  placeholder={t('map.search_placeholder')}
                  placeholderTextColor="rgba(150, 150, 150, 0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
               />
               {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => {
                     setSearchQuery('');
                     setSuggestions([]);
                     setShowSuggestions(false);
                  }}>
                     <Ionicons name="close-circle" size={20} color="#ccc" />
                  </TouchableOpacity>
               )}
            </View>

            {showSuggestions && (
               <View style={[styles.suggestionsDropdown, { backgroundColor: cardBackground }]}>
                  <FlatList
                     data={suggestions}
                     keyExtractor={(item) => item.id}
                     renderItem={({ item }: { item: Suggestion }) => (
                        <TouchableOpacity 
                           style={styles.suggestionItem}
                           onPress={() => handleSelectSuggestion(item)}
                        >
                           <Ionicons name="location-outline" size={18} color={tintColor} style={{ marginRight: 8 }} />
                           <ThemedText style={styles.suggestionText}>{item.label}</ThemedText>
                        </TouchableOpacity>
                     )}
                     keyboardShouldPersistTaps="handled"
                  />
               </View>
            )}
          </View>

          {searchingLocation && (
             <View style={styles.searchLoader}>
                <ActivityIndicator size="small" color={tintColor} />
             </View>
          )}
       </View>
 
       {loadingPlaygrounds && (
         <View style={styles.loaderOverlay}>
             <ActivityIndicator size="small" color="#fff" />
             <ThemedText style={{color: '#fff', marginLeft: 8}}>{t('map.searching')}</ThemedText>
         </View>
       )}

      <TouchableOpacity 
        style={[styles.layerButton, { backgroundColor: cardBackground }]} 
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
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity 
          style={[styles.proposeButton, { backgroundColor: '#34C759' }]} 
          onPress={() => setProposeModalVisible(true)}
      >
          <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <PlaygroundDetailModal 
        visible={modalVisible} 
        playground={selectedPlayground} 
        onClose={() => setModalVisible(false)} 
      />

      <ProposePlaygroundModal
          visible={proposeModalVisible}
          onClose={() => setProposeModalVisible(false)}
          currentCoords={location?.coords || { latitude: 0, longitude: 0 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutContainer: {
    padding: 12,
    borderRadius: 12,
    width: 200,
    backgroundColor: '#1C1C1E', // Dark background for premium look and high contrast
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  calloutTitle: {
    fontSize: 14,
    marginBottom: 4,
    color: '#FFFFFF', // Force white text on dark background
  },
  calloutDetail: {
    fontSize: 12,
    color: '#EBEBF5', // Forced light grey
    opacity: 0.8,
    marginTop: 2,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
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
  },
  proposeButton: {
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
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1001,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  searchLoader: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  suggestionText: {
    fontSize: 15,
  }
});


