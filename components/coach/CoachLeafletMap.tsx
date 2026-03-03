import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Coach } from '@/types/coach';

interface CoachLeafletMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  coaches: Coach[];
  onCoachSelect: (coach: Coach) => void;
  tintColor: string;
  layerType?: 'standard' | 'dark' | 'satellite';
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const CoachLeafletMap = forwardRef(({ region, coaches, onCoachSelect, tintColor, layerType = 'standard', userLocation }: CoachLeafletMapProps, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    setRegion: (latitude: number, longitude: number) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'setRegion', latitude, longitude }));
      }
    }
  }));

  const mapData = coaches.map(c => ({
    id: c.id,
    lat: c.location.latitude,
    lon: c.location.longitude,
    name: c.name,
    rating: c.rating,
  }));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #000; }
          #map { height: 100vh; width: 100vw; }
          
          /* Custom Coach Marker Style */
          .coach-marker-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .coach-bubble {
            background: white;
            border-radius: 20px;
            border: 2px solid ${tintColor};
            padding: 4px 8px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            white-space: nowrap;
          }
          
          .rating-badge {
            background-color: ${tintColor};
            color: white;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: bold;
            margin-right: 6px;
          }
          
          .coach-icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .marker-arrow {
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${tintColor};
            margin-top: -2px;
          }

          /* User position marker */
          .user-position-marker {
            width: 20px;
            height: 20px;
            background-color: #007AFF;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
          }
          .user-position-marker::after {
            content: '';
            position: absolute;
            top: -3px;
            left: -3px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #007AFF;
            opacity: 0.4;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.4; }
            100% { transform: scale(3); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { 
            zoomControl: false,
            attributionControl: false 
          }).setView([${region.latitude}, ${region.longitude}], 14);
          
          let currentLayer;
          const layers = {
            standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          };

          function setLayer(type) {
            if (currentLayer) map.removeLayer(currentLayer);
            currentLayer = L.tileLayer(layers[type] || layers.standard, {
              maxZoom: 19
            }).addTo(map);
          }

          setLayer('${layerType}');

          let markers = {};
          let userMarker;

          function updateUserLocation(lat, lon) {
            if (!lat || !lon) return;
            if (userMarker) {
              userMarker.setLatLng([lat, lon]);
            } else {
              const userIcon = L.divIcon({
                className: 'user-marker-wrapper',
                html: '<div class="user-position-marker"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              userMarker = L.marker([lat, lon], { 
                icon: userIcon, 
                zIndexOffset: 1000,
                interactive: false 
              }).addTo(map);
            }
          }

          if (${!!userLocation}) {
            updateUserLocation(${userLocation?.latitude}, ${userLocation?.longitude});
          }

          function updateMarkers(data) {
            // Remove old markers
            const newDataIds = new Set(data.map(d => d.id));
            Object.keys(markers).forEach(id => {
               if (!newDataIds.has(id)) {
                 map.removeLayer(markers[id]);
                 delete markers[id];
                }
            });

            // Add/Update markers
            data.forEach(item => {
              if (markers[item.id]) {
                markers[item.id].setLatLng([item.lat, item.lon]);
                return;
              }

              const html = \`
                <div class="coach-marker-container">
                  <div class="coach-bubble">
                    <span class="rating-badge">\${item.rating}</span>
                    <div class="coach-icon-container">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${tintColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <div class="marker-arrow"></div>
                </div>
              \`;

              const icon = L.divIcon({
                className: 'custom-coach-marker',
                html: html,
                iconSize: [60, 45],
                iconAnchor: [30, 45]
              });

              markers[item.id] = L.marker([item.lat, item.lon], { icon: icon })
                .addTo(map)
                .on('click', () => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'coachPress', id: item.id }));
                });
            });
          }

          updateMarkers(${JSON.stringify(mapData)});

          window.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'updateData') {
              updateMarkers(message.data);
            } else if (message.type === 'setLayer') {
              setLayer(message.layerType);
            } else if (message.type === 'setUserLocation') {
              updateUserLocation(message.latitude, message.longitude);
            } else if (message.type === 'setRegion') {
              map.setView([message.latitude, message.longitude], 14);
            }
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'setLayer', layerType }));
    }
  }, [layerType]);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ 
        type: 'updateData', 
        data: mapData 
      }));
    }
  }, [coaches]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'coachPress') {
              const coach = coaches.find(c => c.id === message.id);
              if (coach) onCoachSelect(coach);
            }
          } catch (e) {
            console.warn('Coach Leaflet message error:', e);
          }
        }}
        style={styles.map}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
});
