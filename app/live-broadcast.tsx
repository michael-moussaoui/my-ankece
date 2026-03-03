import { ThemedText } from '@/components/themed-text';
import { AGORA_CONFIG } from '@/config/agora';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { cloudinaryService } from '@/services/cloudinaryService';
import { startLiveStream, stopLiveStream } from '@/services/playgroundService';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';



const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LiveBroadcastScreen() {
  const router = useRouter();
  const { playgroundId, playgroundName } = useLocalSearchParams<{ playgroundId: string, playgroundName: string }>();
  const { user, profile } = useAuth();
  const { accentColor, accentTextColor } = useAppTheme();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [torch, setTorch] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agoraAvailable, setAgoraAvailable] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const engineRef = useRef<any | null>(null);
  const abortControllerRef = useRef<boolean>(false);
  const SurfaceViewRef = useRef<any>(null);
  const AgoraTypesRef = useRef<any>(null);

  // Initialize Agora Engine
  const init = async () => {
    try {
      if (!engineRef.current) {
        const Agora = require('react-native-agora');
        const { createAgoraRtcEngine } = Agora;
        SurfaceViewRef.current = Agora.RtcSurfaceView;
        AgoraTypesRef.current = Agora;

        engineRef.current = createAgoraRtcEngine();
        engineRef.current.initialize({
          appId: AGORA_CONFIG.appId,
        });

        engineRef.current.registerEventHandler({
          onJoinChannelSuccess: (connection: any, elapsed: any) => {
            console.log('Successfully joined channel: ', connection.channelId);
            setIsLive(true);
            setLoading(false);
          },
          onError: (err: any, msg: string) => {
            console.error('Agora error:', err, msg);
          }
        });

        engineRef.current.enableVideo();
        engineRef.current.startPreview();
      }
    } catch (e) {
      console.warn('Agora Native Module not available (Expo Go?):', e);
      setAgoraAvailable(false);
    }
  };

  useEffect(() => {
    init();
    return () => {
      engineRef.current?.release();
    };
  }, []);

  // Auto-terminate live if the component unmounts
  useEffect(() => {
    const currentPostId = postId;
    return () => {
      if (currentPostId) {
        stopLiveStream(currentPostId).catch(err => console.error('Auto-cleanup error:', err));
      }
      engineRef.current?.leaveChannel();
    };
  }, [postId]);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color={accentColor} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.message}>Nous avons besoin de votre permission pour utiliser la caméra</ThemedText>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <ThemedText style={styles.buttonText}>Autoriser</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleTorch = () => {
    setTorch(prev => !prev);
  };

  const handleStartLive = async () => {
    if (!playgroundId || !engineRef.current || !AgoraTypesRef.current) return;
    setLoading(true);
    abortControllerRef.current = false;

    try {
      // 1. First record a quick 2s video for the "story/preview" in Firestore
      if (cameraRef.current) {
        const video = await cameraRef.current.recordAsync({ maxDuration: 2 });
        if (video && !abortControllerRef.current) {
          const videoUrl = await cloudinaryService.uploadVideo(video.uri);
          
          const description = `${playgroundName} 🔴 LIVE 🏀`;
          const newPostId = await startLiveStream(
            playgroundId,
            user!.uid,
            profile?.displayName || 'Utilisateur Ankece',
            description,
            videoUrl || ''
          );
          setPostId(newPostId);

          const { ChannelProfileType, ClientRoleType } = AgoraTypesRef.current;

          // 2. Join Agora Channel
          engineRef.current.joinChannel(AGORA_CONFIG.token || '', playgroundId as string, (user!.uid as any), {
            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          });
        }
      }
    } catch (error) {
      console.error('Start live error:', error);
      if (!abortControllerRef.current) {
        Alert.alert('Erreur', 'Impossible de lancer le direct.');
      }
      setLoading(false);
    }
  };

  const handleStopLive = async () => {
    const currentPostId = postId;
    setLoading(true);
    try {
      engineRef.current?.leaveChannel();
      if (currentPostId) {
        await stopLiveStream(currentPostId);
        setPostId(null);
      }
      setIsLive(false);
      Alert.alert('Succès', 'Le direct a été arrêté.');
      router.back();
    } catch (error) {
      console.error('Stop live error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLive) {
    const RtcSurfaceView = SurfaceViewRef.current;
    return (
      <View style={styles.container}>
        {/* Local Preview Surface */}
        {RtcSurfaceView && (
          <RtcSurfaceView
            style={styles.fullVideo}
            canvas={{ uid: 0 }}
          />
        )}
        <View style={styles.customOverlay}>
          <TouchableOpacity style={styles.stopButtonFloating} onPress={handleStopLive}>
            <Ionicons name="stop-circle" size={32} color="#fff" />
            <ThemedText style={styles.stopText}>Arrêter le Direct</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        ref={cameraRef}
        mode="video"
        enableTorch={torch}
      >
        <View style={styles.overlay}>
          <View style={styles.topControls}>
            <TouchableOpacity 
              style={styles.controlIcon} 
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlIcon} 
              onPress={toggleTorch}
            >
              <Ionicons 
                name={torch ? 'flash' : 'flash-off'} 
                size={24} 
                color={torch ? '#FFD60A' : '#fff'} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            {!agoraAvailable && (
              <ThemedText style={styles.warningText}>
                Le mode direct nécessite un build natif et n'est pas disponible dans Expo Go.
              </ThemedText>
            )}
            <TouchableOpacity 
              style={[styles.actionButton, styles.startButton, { backgroundColor: accentColor }, !agoraAvailable && styles.disabledButton]} 
              onPress={handleStartLive}
              disabled={loading || !agoraAvailable}
            >
              {loading ? (
                <ActivityIndicator color={accentTextColor} />
              ) : (
                <>
                  <Ionicons name="radio" size={24} color={accentTextColor} />
                  <ThemedText style={[styles.buttonText, { color: accentTextColor }]}>Lancer le Direct</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  fullVideo: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 20,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  controlIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  runningControls: {
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  stopButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
  },
  warningText: {
    color: '#FF9500',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  customOverlay: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stopButtonFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  stopText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
