
import { Ionicons } from '@expo/vector-icons';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AIPoseOverlay } from '@/components/editor/AIPoseOverlay';
import { ThemedText } from '@/components/themed-text';
import { PRO_MOVES } from '@/constants/pro-moves';
import { poseService } from '@/services/ai/poseService';

// Tensor Camera
// @ts-ignore
const TensorCamera = cameraWithTensors(CameraView);

const { width } = Dimensions.get('window');

export default function ProMimicScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const proMove = PRO_MOVES.find(m => m.id === id);

    const [permission, requestPermission] = useCameraPermissions();
    const [isModelReady, setIsModelReady] = useState(false);
    const [poses, setPoses] = useState<any[]>([]);
    const [facing, setFacing] = useState<'front' | 'back'>('front');
    const [mirror, setMirror] = useState(false);

    // Video Player
    const player = useVideoPlayer(proMove?.videoUrl || '', player => {
        player.loop = true;
        player.play();
    });

    const textureDims = { width: 1600, height: 1200 };
    const tensorDims = { width: 152, height: 200 };

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
        
        const initAI = async () => {
            await poseService.init();
            setIsModelReady(true);
        };
        initAI();
    }, []);

    const handleCameraStream = (images: IterableIterator<tf.Tensor3D>, updatePreview: () => void, gl: any) => {
        const loop = async () => {
            const nextImageTensor = images.next().value;
            if (nextImageTensor) {
                const detectedPoses = await poseService.detectPose(nextImageTensor);
                setPoses(detectedPoses);
                tf.dispose([nextImageTensor]);
            }
            requestAnimationFrame(loop);
        };
        loop();
    };

    if (!proMove) return <ThemedText>Move not found</ThemedText>;

    if (!permission || !permission.granted) {
        return (
            <View style={styles.container}>
                <ThemedText>Camera permission required</ThemedText>
                <TouchableOpacity onPress={requestPermission}><ThemedText>Grant</ThemedText></TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top Half: Pro Video */}
            <View style={styles.videoContainer}>
                <VideoView 
                    style={styles.video} 
                    player={player} 
                    contentFit="contain"
                    nativeControls={false}
                />
                <View style={styles.overlayText}>
                    <ThemedText type="subtitle" style={{color: '#fff'}}>{proMove.player} - Model</ThemedText>
                </View>
                
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

                {/* Bottom Half: User Camera + AI */}
            <View style={styles.cameraContainer}>
                 {!isModelReady ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <ThemedText style={{color: '#fff', marginTop: 10}}>Loading AI...</ThemedText>
                    </View>
                ) : (
                    <TensorCamera
                        // @ts-ignore
                        key={`${facing}-${mirror}`}
                        style={styles.camera}
                        facing={facing}
                        mirror={mirror}
                        cameraTextureHeight={textureDims.height}
                        cameraTextureWidth={textureDims.width}
                        resizeHeight={tensorDims.height}
                        resizeWidth={tensorDims.width}
                        resizeDepth={3}
                        onReady={handleCameraStream}
                        autorender={true}
                        useCustomShadersToResize={false}
                    />
                )}

                {/* AI Overlay put on top of camera */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                     <AIPoseOverlay 
                        poses={poses} 
                        width={tensorDims.width} 
                        height={tensorDims.height} 
                        showAngles={true}
                    />
                </View>

                <View style={styles.overlayTextBottom}>
                    <ThemedText type="subtitle" style={{color: '#fff'}}>You - AI Analysis</ThemedText>
                </View>

                {/* Controls Container */}
                <View style={styles.controlsContainer}>
                    <TouchableOpacity 
                        style={styles.controlButton} 
                        onPress={() => setMirror(!mirror)}
                    >
                        <Ionicons name="scan-outline" size={24} color="#fff" />
                        <ThemedText style={styles.controlText}>Miroir</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.controlButton} 
                        onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
                    >
                        <Ionicons name="camera-reverse" size={24} color="#fff" />
                        <ThemedText style={styles.controlText}>Flip</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoContainer: {
        flex: 1,
        position: 'relative',
        borderBottomWidth: 2,
        borderColor: '#333',
    },
    video: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#111',
    },
    camera: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8,
    },
    overlayTextBottom: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8,
        zIndex: 10,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    controlsContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'column',
        gap: 12,
        zIndex: 20,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlText: {
        color: '#fff', 
        fontSize: 10,
        marginTop: 2,
    }
});
