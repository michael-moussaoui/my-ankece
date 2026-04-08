import { AIPoseOverlay } from '@/components/editor/AIPoseOverlay';
import { BallTrajectoryOverlay } from '@/components/editor/BallTrajectoryOverlay';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { GamificationPopup } from '@/components/ui/GamificationPopup';
import { UserIconButton } from '@/components/UserIconButton';
import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { basketDetector } from '@/services/ai/basketDetector';
import { poseService } from '@/services/ai/poseService';
import { BallPosition, BasketPosition, TrajectoryAnalysis, trajectoryAnalyzer } from '@/services/ai/trajectoryAnalyzer';
import { challengeService } from '@/services/challengeService';
import { trackerService } from '@/services/trackerService';
import { Ionicons } from '@expo/vector-icons';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tensor Camera component
// We pass CameraView which is the new component in Expo Camera v15+
// @ts-ignore
const TensorCamera = cameraWithTensors(CameraView);

export default function CameraAnalysisScreen() {
    const router = useRouter();
    const { mode, challenge } = useLocalSearchParams<{ mode: 'posture' | 'shooting' | 'dribble', challenge?: string }>();
    const { user: profile } = useUser();
    const { accentColor, accentTextColor } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [isSubModalVisible, setIsSubModalVisible] = useState(false);

    // Reward State
    const [rewardData, setRewardData] = useState<{ visible: boolean; title: string; xp?: number }>({ visible: false, title: '' });
    const [permission, requestPermission] = useCameraPermissions();
    const [isModelReady, setIsModelReady] = useState(false);
    
    const analysisMode = mode || 'shooting';
    
    // Check for subscription on mount
    useEffect(() => {
        if (profile && profile.plan !== 'elite-pro') {
            setIsSubModalVisible(true);
        }
    }, [profile]);
    const [poses, setPoses] = useState<any[]>([]);
    const [facing, setFacing] = useState<'front'|'back'>('back');
    
    // Trajectory tracking state
    const [isTrackingBall, setIsTrackingBall] = useState(false);
    const [ballPositions, setBallPositions] = useState<BallPosition[]>([]);
    const [trajectoryAnalysis, setTrajectoryAnalysis] = useState<TrajectoryAnalysis | null>(null);
    const [basket, setBasket] = useState<BasketPosition | null>(null);
    
    // Stats state
    const [stats, setStats] = useState({ made: 0, missed: 0 });
    const frameCountRef = useRef(0);
    const lastShotResultRef = useRef<'made' | 'missed' | 'unknown'>('unknown');
    
    // Texture dimensions for TensorCamera
    const textureDims = { width: 1600, height: 1200 };
    const tensorDims = { width: 256, height: 256 }; 

    // Dribble state
    const [dribbleCount, setDribbleCount] = useState(0);
    const [dribbleMoves, setDribbleMoves] = useState<string[]>([]);
    const [dribbleSpeed, setDribbleSpeed] = useState(0); // Dribbles per minute
    const dribbleTimestampsRef = useRef<number[]>([]);
    const lastBallYRef = useRef<number | null>(null);
    const dribbleThreadholdRef = useRef<'down' | 'up'>('down');
    const lastHandRef = useRef<string | null>(null);

    useEffect(() => {
        (async () => {
            if (permission && !permission.granted) {
                await requestPermission();
            }
            // Initialize AI
            await poseService.init();
            setIsModelReady(true);
        })();
    }, [permission]);

    const handleCameraStream = (images: IterableIterator<tf.Tensor3D>, updatePreview: () => void, gl: any) => {
        const loop = async () => {
            // Get next frame
            const nextImageTensor = images.next().value;

            if (nextImageTensor) {
                // Run pose detection
                const detectedPoses = await poseService.detectPose(nextImageTensor);
                if (detectedPoses.length > 0 && frameCountRef.current % 30 === 0) {
                    console.log(`Poses detected: ${detectedPoses.length}, first pose score: ${detectedPoses[0].score}`);
                }
                setPoses(detectedPoses);

                // Basket detection (every 10th frame for stability and performance)
                if (isTrackingBall && frameCountRef.current % 10 === 0 && !basket) {
                    const detectedBasket = await basketDetector.detectBasket(nextImageTensor);
                    if (detectedBasket) {
                        setBasket(detectedBasket);
                    }
                }
                
                // Ball tracking (every 3rd frame for performance)
                if (isTrackingBall && frameCountRef.current % 3 === 0) {
                    const ballPos = await trajectoryAnalyzer.detectBall(nextImageTensor);
                    if (ballPos) {
                        if (analysisMode === 'dribble') {
                            // Simple dribble logic: track Y movement
                            if (lastBallYRef.current !== null) {
                                const diff = ballPos.y - lastBallYRef.current;
                                if (dribbleThreadholdRef.current === 'down' && diff > 5) { // Value in pixels
                                    dribbleThreadholdRef.current = 'up';
                                } else if (dribbleThreadholdRef.current === 'up' && diff < -5) {
                                    // Dribble detected!
                                    setDribbleCount(c => c + 1);
                                    dribbleThreadholdRef.current = 'down';

                                    // Advanced Logic: Speed and Moves
                                    const now = Date.now();
                                    dribbleTimestampsRef.current.push(now);
                                    if (dribbleTimestampsRef.current.length > 5) {
                                        dribbleTimestampsRef.current.shift();
                                        const duration = (now - dribbleTimestampsRef.current[0]) / 1000;
                                        setDribbleSpeed(Math.round((dribbleTimestampsRef.current.length / duration) * 60));
                                    }

                                    // Crossover Detection (Requires hand data)
                                    if (poses.length > 0) {
                                        const kp = poses[0].keypoints;
                                        const leftWrist = kp[15];
                                        const rightWrist = kp[16];
                                        
                                        // Which hand is closer to ball?
                                        const distL = Math.sqrt(Math.pow(leftWrist.x - ballPos.x, 2) + Math.pow(leftWrist.y - ballPos.y, 2));
                                        const distR = Math.sqrt(Math.pow(rightWrist.x - ballPos.x, 2) + Math.pow(rightWrist.y - ballPos.y, 2));
                                        const currentHand = distL < distR ? 'Left' : 'Right';

                                        if (lastHandRef.current && lastHandRef.current !== currentHand) {
                                            // Hand switched while ball is in middle?
                                            if (ballPos.x > 50 && ballPos.x < 200) { // Screen center range
                                                const move = ballPos.y > 150 ? 'Between Legs' : 'Crossover';
                                                setDribbleMoves(prev => Array.from(new Set([...prev, move])));
                                            }
                                        }
                                        lastHandRef.current = currentHand;
                                    }
                                }
                            }
                            lastBallYRef.current = ballPos.y;
                        }

                        setBallPositions(prev => {
                            const newPositions = [...prev, ballPos];
                            // Keep last 30 positions (about 3 seconds at 10fps)
                            if (newPositions.length > 30) {
                                newPositions.shift();
                            }
                            
                            // Calculate trajectory if enough points
                            const analysis = trajectoryAnalyzer.calculateTrajectory(newPositions, basket);
                            if (analysis) {
                                setTrajectoryAnalysis(analysis);

                                // Track stats if result changed
                                if (analysis.shotResult && analysis.shotResult !== 'unknown' && analysis.shotResult !== lastShotResultRef.current) {
                                    if (analysis.shotResult === 'made') {
                                        setStats(s => ({ ...s, made: s.made + 1 }));
                                    } else if (analysis.shotResult === 'missed') {
                                        setStats(s => ({ ...s, missed: s.missed + 1 }));
                                    }
                                    lastShotResultRef.current = analysis.shotResult;
                                }
                            }
                            
                            return newPositions;
                        });
                    }
                }
                
                frameCountRef.current++;
                
                // Dispose tensor to avoid memory leaks
                tf.dispose([nextImageTensor]);
            }
            
            // Loop
            requestAnimationFrame(loop);
        };
        loop();
    };

    if (!permission) {
        return <View style={styles.container}><Text>Permission...</Text></View>;
    }
    
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{color: 'white', textAlign: 'center'}}>Pas de permission caméra</Text>
                <TouchableOpacity onPress={requestPermission} style={[styles.permissionButton, { backgroundColor: accentColor }]}>
                    <Text style={{color: accentTextColor}}>Autoriser</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const completeSession = async () => {
        setIsTrackingBall(false);
        if (!profile) return;

        const sessionData = mode === 'dribble' 
            ? { 
                dribble_count: dribbleCount, 
                frequency: dribbleSpeed / 60, // Convert BPM back to per-second for backend
                consistency: 0.85, 
                moves_detected: dribbleMoves 
            } 
            : { makes: stats.made, missed: stats.missed, accuracy: (stats.made / (stats.made + stats.missed || 1)) * 100 };

        try {
            // Assuming challengeService and trackerService are imported or available
            // import { challengeService } from '@/services/challengeService';
            // import { trackerService } from '@/services/trackerService';
            // These imports would need to be added at the top of the file if not already present.
            // For this change, I'm assuming they exist or will be added by the user.
            const reward = await challengeService.calculateSessionXp(sessionData, mode === 'dribble' ? 'dribble' : 'shooting', challenge);
            
            if (reward.success) {
                setRewardData({
                    visible: true,
                    title: reward.challenge_completed ? "CHALLENGE RÉUSSI !" : "SESSION TERMINÉE",
                    xp: reward.xp_earned + reward.bonus_xp
                });

                // Persist to Firebase
                if (mode === 'dribble') {
                    await trackerService.saveDribbleSession(profile.id, profile.displayName || 'User', {
                        comboType: challenge || 'Free Dribble',
                        repetitions: dribbleCount,
                        duration: 60,
                        difficulty: 'pro'
                    });
                } else {
                    await trackerService.saveShootingSession(profile.id, profile.displayName || 'User', {
                        type: 'training',
                        duration: 60,
                        totalShots: stats.made + stats.missed,
                        totalMade: stats.made,
                        shots: []
                    });
                }
            }
        } catch (e) {
            console.error('Session Completion Error:', e);
        }
    };

    if (!isModelReady) {
         return (
             <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                 <Text style={{ color: '#fff' }}>Chargement de l'IA...</Text>
             </View>
         );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <TensorCamera
                // @ts-ignore
                style={styles.camera}
                facing={facing}
                cameraTextureHeight={textureDims.height}
                cameraTextureWidth={textureDims.width}
                resizeHeight={tensorDims.height}
                resizeWidth={tensorDims.width}
                resizeDepth={3}
                onReady={handleCameraStream}
                autorender={true}
                useCustomShadersToResize={false} 
            />

            {/* AI Overlay put on top of camera */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <AIPoseOverlay 
                    poses={poses} 
                    width={tensorDims.width} 
                    height={tensorDims.height} 
                    showAngles={true}
                />
            </View>

            {/* Gamification Popup */}
            <GamificationPopup 
                visible={rewardData.visible}
                title={rewardData.title}
                xp={rewardData.xp}
                onClose={() => setRewardData({ ...rewardData, visible: false })}
            />
            {/* Overlay Skeleton */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="none">
                 {/* Ajustement de l'échelle car on prédit sur 152x200 mais on affiche sur l'écran entier */}
                
                {/* Debug Pose Count */}
                <View style={{ position: 'absolute', top: 150, left: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 5 }}>
                    <Text style={{ color: poses.length > 0 ? '#00FF00' : '#FF3B30', fontWeight: 'bold', fontSize: 16 }}>
                        Poses: {poses.length}
                    </Text>
                    {poses.length > 0 && (
                        <>
                            <Text style={{ color: '#fff', fontSize: 12 }}>Score: {poses[0].score?.toFixed(2)}</Text>
                            <Text style={{ color: '#fff', fontSize: 12 }}>Nose: {poses[0].keypoints[0].x.toFixed(0)}, {poses[0].keypoints[0].y.toFixed(0)} ({poses[0].keypoints[0].score?.toFixed(2)})</Text>
                        </>
                    )}
                </View>
            </View>
            
            {/* Ball Trajectory Overlay */}
            {isTrackingBall && (
                <BallTrajectoryOverlay
                    ballPositions={ballPositions}
                    trajectoryAnalysis={trajectoryAnalysis}
                    width={tensorDims.width}
                    height={tensorDims.height}
                />
            )}

            {/* UI Controls */}
            <View style={[styles.controls, { top: Math.max(insets.top, 20) }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
                
                <View style={{ flex: 1 }} />

                <TouchableOpacity style={styles.flipButton} onPress={() => {
                    setFacing(facing === 'back' ? 'front' : 'back');
                }}>
                    <Ionicons name="camera-reverse" size={28} color="#fff" />
                </TouchableOpacity>
                
                <UserIconButton color="#fff" size={32} />
            </View>

            {/* Stats Bar */}
            <View style={[styles.statsBar, { top: Math.max(insets.top + 60, 100) }]}>
                {analysisMode === 'dribble' ? (
                    <>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Dribbles</Text>
                            <Text style={[styles.statValue, { color: '#FF9500' }]}>{dribbleCount}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>BPM</Text>
                            <Text style={[styles.statValue, { color: '#34C759' }]}>{dribbleSpeed}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Moves</Text>
                            <Text style={[styles.statValue, { fontSize: 12, color: accentColor }]}>
                                {dribbleMoves.length > 0 ? dribbleMoves.join(', ') : 'Free Style'}
                            </Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Réussis</Text>
                            <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.made}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Manqués</Text>
                            <Text style={[styles.statValue, { color: '#FF3B30' }]}>{stats.missed}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Précision</Text>
                            <Text style={styles.statValue}>
                                {(stats.made + stats.missed) > 0 
                                    ? Math.round((stats.made / (stats.made + stats.missed)) * 100) 
                                    : 0}%
                            </Text>
                        </View>
                    </>
                )}
            </View>
            
            {/* Trajectory Controls */}
            <View style={[styles.trajectoryControls, { bottom: Math.max(insets.bottom + 20, 40) }]}>
                <TouchableOpacity 
                    style={[styles.trackButton, { backgroundColor: accentColor }, isTrackingBall && styles.trackButtonActive]}
                    onPress={() => {
                        if (!isTrackingBall) {
                            setIsTrackingBall(true);
                            setBallPositions([]);
                            setTrajectoryAnalysis(null);
                            lastShotResultRef.current = 'unknown';
                        } else {
                            completeSession();
                        }
                    }}
                >
                    <Ionicons 
                        name={isTrackingBall ? 'pause' : 'play'} 
                        size={24} 
                        color={accentTextColor} 
                    />
                    <Text style={[styles.trackButtonText, { color: accentTextColor }]}>
                        {isTrackingBall ? 'Arrêter' : 'Tracker le ballon'}
                    </Text>
                </TouchableOpacity>
                
                {(ballPositions.length > 0 || stats.made > 0 || stats.missed > 0 || dribbleCount > 0) && (
                    <TouchableOpacity 
                        style={styles.resetButton}
                        onPress={() => {
                            setBallPositions([]);
                            setTrajectoryAnalysis(null);
                            setStats({ made: 0, missed: 0 });
                            setDribbleCount(0);
                            setDribbleMoves([]);
                            setDribbleSpeed(0);
                            dribbleTimestampsRef.current = [];
                            lastHandRef.current = null;
                            setBasket(null);
                            frameCountRef.current = 0;
                            lastShotResultRef.current = 'unknown';
                            lastBallYRef.current = null;
                        }}
                    >
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                )}
            </View>

            <SubscriptionModal 
                visible={isSubModalVisible} 
                onClose={() => {
                    setIsSubModalVisible(false);
                    if (profile?.plan !== 'elite-pro') {
                        router.back(); // Redirect back if they close it without subscribing
                    }
                }} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
        zIndex: 1,
    },
    controls: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        zIndex: 1000,
        elevation: 1000,
    },
    closeButton: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flipButton: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    permissionButton: {
        marginTop: 20,
        padding: 10,
        borderRadius: 8,
    },
    trajectoryControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 20,
        zIndex: 1000,
        elevation: 1000,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    trackButtonActive: {
        backgroundColor: '#FF3B30',
    },
    trackButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    statsBar: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        elevation: 1000,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#ccc',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
});
