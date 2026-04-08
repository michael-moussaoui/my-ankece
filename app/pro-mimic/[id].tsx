
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
import { RadarChart } from '@/components/tracker/RadarChart';
import { PRO_MOVES } from '@/constants/pro-moves';
import { useAppTheme } from '@/context/ThemeContext';
import { poseService } from '@/services/ai/poseService';
import { starComparisonService } from '@/services/ai/starComparisonService';
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
    const { accentColor } = useAppTheme();

    // Comparison State
    const [comparisonResult, setComparisonResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

                {/* Capture & Compare Button */}
                <View style={styles.captureContainer}>
                    <TouchableOpacity 
                        style={[styles.captureButton, { backgroundColor: accentColor }]} 
                        onPress={async () => {
                            if (poses.length === 0) return;
                            setIsAnalyzing(true);
                            
                            // Extract metrics from current pose
                            const kp = poses[0].keypoints;
                            const calculateAngle = (A: any, B: any, C: any) => {
                                const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
                                const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
                                const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
                                return Math.round(Math.acos((AB * AB + BC * BC - AC * AC) / (2 * AB * BC)) * (180 / Math.PI));
                            };

                            const metrics = {
                                release_angle: calculateAngle(kp[12], kp[14], kp[16]), // Shoulder-Elbow-Wrist (as proxy)
                                knee_bend_angle: calculateAngle(kp[24], kp[26], kp[28]),
                                follow_through_score: 85 // Mocked for single frame
                            };

                            try {
                                const result = await starComparisonService.compareShot(metrics, proMove.player.toLowerCase().includes('curry') ? 'steph_curry' : 'klay_thompson');
                                setComparisonResult(result.comparison);
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setIsAnalyzing(false);
                            }
                        }}
                    >
                        {isAnalyzing ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="analytics" size={24} color="#fff" />
                                <ThemedText style={{color: '#fff', fontWeight: 'bold', marginLeft: 8}}>ANALYSER MON TIR</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Similarity Result Overlay */}
                {comparisonResult && (
                    <View style={styles.resultOverlay}>
                        <View style={styles.resultCard}>
                            <View style={styles.cardHeader}>
                                <ThemedText type="subtitle">Similarité : {comparisonResult.overall_similarity}%</ThemedText>
                                <TouchableOpacity onPress={() => setComparisonResult(null)}>
                                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>

                            <RadarChart 
                                data={[
                                    { label: "Angle", value: (comparisonResult.breakdown?.release_similarity || 0) / 100 },
                                    { label: "Genoux", value: (comparisonResult.breakdown?.knee_similarity || 0) / 100 },
                                    { label: "Extension", value: (comparisonResult.breakdown?.follow_through_similarity || 0) / 100 },
                                    { label: "Timing", value: 0.8 },
                                    { label: "Stabilité", value: 0.75 }
                                ]} 
                                size={180}
                            />
                            
                            <ThemedText style={styles.proTip}>{comparisonResult.pro_tip}</ThemedText>
                        </View>
                    </View>
                )}
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
    },
    captureContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 30,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    resultOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    resultCard: {
        width: width * 0.85,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    cardHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    proTip: {
        marginTop: 15,
        textAlign: 'center',
        color: '#EBEBF5',
        fontStyle: 'italic',
        fontSize: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 10,
    }
});
