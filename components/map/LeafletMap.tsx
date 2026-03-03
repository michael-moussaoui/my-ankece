import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface LeafletMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  playgrounds: any[];
  onPlaygroundSelect: (playground: any) => void;
  tintColor: string;
  layerType?: 'standard' | 'dark' | 'satellite';
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const LeafletMap = forwardRef(({ region, playgrounds, onPlaygroundSelect, tintColor, layerType = 'standard', userLocation }: LeafletMapProps, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    setRegion: (latitude: number, longitude: number) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'setRegion', latitude, longitude }));
      }
    }
  }));

  // Synchronize internal logic for marker categories
  const getMarkerData = (p: any) => {
    const isIndoor = p.tags?.indoor === 'yes' || 
                   p.tags?.leisure === 'sports_centre' || 
                   p.name?.toLowerCase().includes('hoop');
    
    const isClub = p.tags?.club === 'sport' || 
                 p.name?.toLowerCase().includes('club') ||
                 p.name?.toLowerCase().includes(' b.c') ||
                 p.name?.toLowerCase().includes(' a.s') ||
                 p.name?.toUpperCase().startsWith('BC ') ||
                 p.name?.toUpperCase().startsWith('AS ');

    const isLive = p.isLive;

    return {
      id: p.id,
      lat: p.lat,
      lon: p.lon,
      name: p.name,
      color: isLive ? '#FF3B30' : (isClub ? '#34C759' : (isIndoor ? '#5856D6' : tintColor)),
      icon: isLive ? '🔴' : (isClub ? '🏆' : (isIndoor ? '🏢' : '🏀')),
      isLive: !!isLive
    };
  };

  const mapData = playgrounds.map(getMarkerData);

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
          #map { height: 100vh; width: 100vw; transition: opacity 0.3s; }
          .custom-marker {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            border: 2px solid white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .custom-marker.live {
            border-color: #FF3B30;
            animation: live-pulse 2s infinite;
          }
          @keyframes live-pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
          }
          /* Pulsing blue dot for user position */
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
            // ... (same update logic)
            const newDataIds = new Set(data.map(d => d.id));
            Object.keys(markers).forEach(id => {
               if (!newDataIds.has(id)) {
                 map.removeLayer(markers[id]);
                 delete markers[id];
                }
            });

            data.forEach(item => {
              const existingMarker = markers[item.id];
              
              // If marker exists but live status changed, we need to recreate it
              if (existingMarker) {
                const wasLive = existingMarker.options.isLive;
                if (wasLive === item.isLive) return;
                
                map.removeLayer(existingMarker);
                delete markers[item.id];
              }

              const icon = L.divIcon({
                className: 'custom-marker-wrapper',
                html: \`<div class="custom-marker \${item.isLive ? 'live' : ''}" style="background-color: \${item.color};">\${item.icon}</div>\`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });

              markers[item.id] = L.marker([item.lat, item.lon], { 
                icon: icon,
                isLive: item.isLive // Store state for comparison
              })
                .addTo(map)
                .on('click', () => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: item.id }));
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
    if (webViewRef.current && userLocation) {
      webViewRef.current.postMessage(JSON.stringify({ 
        type: 'setUserLocation', 
        latitude: userLocation.latitude, 
        longitude: userLocation.longitude 
      }));
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'markerPress') {
              const pg = playgrounds.find(p => p.id === message.id);
              if (pg) onPlaygroundSelect(pg);
            }
          } catch (e) {
            console.warn('Leaflet message error:', e);
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
