import { Ionicons } from '@expo/vector-icons';
import { Canvas, Circle } from '@shopify/react-native-skia';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useFrameCallback, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { handTracker } from '@/services/ai/handTracker';
import { Target, TargetEngine } from '@/services/ai/targetEngine';

import { useAuth } from '@/context/AuthContext';
import { trackerService } from '@/services/trackerService';

const TensorCamera = cameraWithTensors(CameraView);

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    color: string;
}

interface FloatingScore {
    id: string;
    x: number;
    y: number;
    text: string;
    opacity: number;
    createdAt: number;
}

interface Shockwave {
    id: string;
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    opacity: number;
    color: string;
}

export default function DribbleTouchGame() {
    const { colorScheme, accentColor: primary } = useAppTheme();
    const backgroundColor = Colors[colorScheme].background;
    const cardColor = Colors[colorScheme].card;
    const text = Colors[colorScheme].text;
    const accentColor = primary; // Or use a specific accent if needed, but primary is accent here

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isLandscape = windowWidth > windowHeight;
    
    // Canvas dimensions (Full Screen in landscape)
    const CANVAS_WIDTH = windowWidth;
    const CANVAS_HEIGHT = windowHeight;

    const { user: authUser, profile } = useAuth();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    
    // Game State
    const [gameState, setGameState] = useState<'idle' | 'ready' | 'countdown' | 'playing' | 'ended'>('idle');
    const [countdown, setCountdown] = useState(3);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const [level, setLevel] = useState(1);
    const [timer, setTimer] = useState(60);
    const [targets, setTargets] = useState<Target[]>([]);
    const targetsRef = useRef<Target[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
    const floatingScoresRef = useRef<FloatingScore[]>([]);
    const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
    const shockwavesRef = useRef<Shockwave[]>([]);
    const [combo, setCombo] = useState(0);
    const [showDribbleHint, setShowDribbleHint] = useState(false);
    const [isTfReady, setIsTfReady] = useState(false);
    const [lastFrameTime, setLastFrameTime] = useState(Date.now());
    const [loopError, setLoopError] = useState<string | null>(null);
    const [engineFps, setEngineFps] = useState(0);
    const [isHandDetected, setIsHandDetected] = useState(false);
    const startTimeRef = useRef(0);
    const lastFpsCalcTime = useRef(Date.now());
    const lastFpsFrameCount = useRef(0);
    
    // Safety Refs for Loops
    const gameStateRef = useRef(gameState);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    // Hand Tracking Refs (Shared Values for Anim/Skia)
    const handX = useSharedValue(0);
    const handY = useSharedValue(0);
    const isHandVisible = useSharedValue(false);
    const isDribbling = useSharedValue(false);
    const lastDribbleTime = useRef(Date.now());
    const isPlayingSV = useSharedValue(false);
    const loopActiveRef = useRef(false);
    const handOpacity = useSharedValue(0);
    useEffect(() => { 
        isPlayingSV.value = (gameState === 'playing'); 
    }, [gameState]);

    const levelRef = useRef(level);
    useEffect(() => { levelRef.current = level; }, [level]);

    // Animated Styles
    const dribbleIndicatorStyle = useAnimatedStyle(() => ({
        borderColor: isDribbling.value ? '#34C759' : '#FF3B30'
    }));

    const comboBadgeStyle = useAnimatedStyle(() => ({
        opacity: withSpring(combo > 1 ? 1 : 0),
        transform: [{ scale: withSpring(combo > 1 ? 1 : 0.5) }]
    }));
    // Engine
    const engine = useMemo(() => new TargetEngine(CANVAS_WIDTH, CANVAS_HEIGHT), [CANVAS_WIDTH, CANVAS_HEIGHT]);
    const lastSpawnTime = useRef(0);
    const frameCount = useRef(0);

    // Orientation Lock
    useEffect(() => {
        async function lock() {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
        lock();
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    // TensorFlow Initialization
    useEffect(() => {
        async function prepare() {
            try {
                await tf.ready();
            } catch (e) {
                console.error('TF Ready Error:', e);
            }
            setIsTfReady(true);
        }
        prepare();
    }, []);

    // Permissions
    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, [permission]);

    // Countdown Logic (Timer is now in updateGameStateJS)
    useEffect(() => {
        let interval: any;
        
        if (gameState === 'countdown') {
            setCountdown(3);
            interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        startTimeRef.current = Date.now();
                        setGameState('playing');
                        return 3;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        
        return () => clearInterval(interval);
    }, [gameState]);

    // Handle Game State Shifts
    useEffect(() => { 
        gameStateRef.current = gameState; 
        
        if (gameState === 'playing') {
            lastDribbleTime.current = Date.now();
            setScore(0);
            scoreRef.current = 0;
            setTimer(60);
            setTargets([]);
            targetsRef.current = [];
        }

        if (gameState === 'ended') {
            saveGameResult();
        }
    }, [gameState]);

    const handleCameraStream = React.useCallback((images: IterableIterator<tf.Tensor3D>) => {
        if (loopActiveRef.current) return;
        loopActiveRef.current = true;

        const loop = async () => {
            let tensorToDispose: tf.Tensor3D | null = null;
            try {
                if (!isTfReady) {
                    requestAnimationFrame(loop);
                    return;
                }
                
                const nextImageTensor = images.next().value;
                if (!nextImageTensor) {
                    requestAnimationFrame(loop);
                    return;
                }
                tensorToDispose = nextImageTensor;

                if (gameStateRef.current === 'ended') {
                    requestAnimationFrame(loop);
                    return;
                }
                
                // Track every 3 frames for a better balance between detection and UI fluidity
                if (frameCount.current % 3 === 0) {
                    const hands = await handTracker.detectHands(nextImageTensor);
                    const contactPoint = handTracker.getContactPoint(hands);
                    
                    if (contactPoint) {
                        handX.value = (1 - contactPoint.x / nextImageTensor.shape[1]) * CANVAS_WIDTH;
                        handY.value = (contactPoint.y / nextImageTensor.shape[0]) * CANVAS_HEIGHT;
                        isHandVisible.value = true;
                        handOpacity.value = withSpring(1);
                        
                        const dribbling = handTracker.updateDribbleStatus(contactPoint.y);
                        isDribbling.value = dribbling;
                        
                        if (dribbling) {
                            lastDribbleTime.current = Date.now();
                            if (gameStateRef.current === 'ready' || gameStateRef.current === 'countdown') {
                                runOnJS(setGameState)('playing');
                            }
                        }
                        runOnJS(setIsHandDetected)(true);
                    } else {
                        isHandVisible.value = false;
                        isDribbling.value = false;
                        handOpacity.value = withSpring(0);
                        runOnJS(setIsHandDetected)(false);
                    }
                }
                
                if (loopError) runOnJS(setLoopError)(null);
                
                if (frameCount.current % 15 === 0) {
                    runOnJS(setLastFrameTime)(Date.now());
                    const now = Date.now();
                    const diff = now - lastFpsCalcTime.current;
                    if (diff >= 1000) {
                        runOnJS(setEngineFps)(Math.round((frameCount.current - lastFpsFrameCount.current) / (diff / 1000)));
                        lastFpsCalcTime.current = now;
                        lastFpsFrameCount.current = frameCount.current;
                        // Force a sync of hand status to JS state for debug text
                        runOnJS(setIsHandDetected)(isHandVisible.value);
                    }
                }

                frameCount.current++;
                requestAnimationFrame(loop);
            } catch (err: any) {
                console.error('[DribbleTouch] Camera Loop Error:', err);
                runOnJS(setLoopError)(err.message || 'Unknown error');
                setTimeout(() => requestAnimationFrame(loop), 1000);
            } finally {
                if (tensorToDispose) {
                    tf.dispose([tensorToDispose]);
                }
            }
        };
        loop();
    }, [isTfReady, CANVAS_WIDTH, CANVAS_HEIGHT]);


    const handleHit = React.useCallback((target: Target) => {
        if (target.type === 'malus') {
            setCombo(0);
        } else {
            setCombo(c => {
                const newCombo = c + 1;
                const points = target.points * (1 + Math.floor(c / 5));
                scoreRef.current += points;
                return newCombo;
            });
        }
        
        // Spawn explosion particles
        const points = target.points * (1 + Math.floor(combo / 5));
        const particleCount = target.type === 'bonus' ? 20 : 12; // More particles
        
        const newParticles: Particle[] = Array.from({ length: particleCount }).map(() => ({
            id: Math.random().toString(),
            x: target.x,
            y: target.y,
            vx: (Math.random() - 0.5) * 15, // Faster
            vy: (Math.random() - 0.5) * 15 - 5, // More upward bias
            opacity: 1,
            color: target.color,
        }));
        
        setParticles(prev => {
            const next = [...prev, ...newParticles];
            particlesRef.current = next;
            return next;
        });

        // Spawn shockwave
        const newShockwave: Shockwave = {
            id: Math.random().toString(),
            x: target.x,
            y: target.y,
            radius: 10,
            maxRadius: target.radius * 2.5,
            opacity: 0.8,
            color: target.color,
        };
        setShockwaves(prev => {
            const next = [...prev, newShockwave];
            shockwavesRef.current = next;
            return next;
        });

        // Spawn floating score
        const newScoreObj: FloatingScore = {
            id: Math.random().toString(),
            x: target.x,
            y: target.y - 20,
            text: `+${points}`,
            opacity: 1,
            createdAt: Date.now()
        };
        setFloatingScores(prev => {
            const next = [...prev, newScoreObj];
            floatingScoresRef.current = next;
            return next;
        });

        // Use current level for check
        setScore(currentScore => {
            if (currentScore > levelRef.current * 100) {
                setLevel(l => l + 1);
            }
            return currentScore;
        });
    }, []); 

    // Game Loop (Skia integration)
    const lastStateUpdateJS = useRef(0);
    const updateGameStateJS = React.useCallback((deltaTime: number, currentHandX: number, currentHandY: number) => {
        const now = Date.now();
        
        let shouldSpawn = false;
        if (now - lastSpawnTime.current > 1200 / Math.sqrt(levelRef.current)) { 
            shouldSpawn = true;
            lastSpawnTime.current = now;
        }

        // 1. Update positions
        let nextTargets = engine.updatePositions(targetsRef.current, deltaTime);
        
        // 2. Spawn next
        if (shouldSpawn) {
            const nextTarget = engine.spawnTarget(levelRef.current);
            nextTargets.push(nextTarget);
        }

        // 3. Collision Detection
        const collided = nextTargets.find(t => engine.checkCollision({ x: currentHandX, y: currentHandY }, t));
        
        if (collided) {
            nextTargets = nextTargets.filter(t => t.id !== collided.id);
            handleHit(collided);
        }

        // 4. Update internal ref every frame for physics continuity
        targetsRef.current = nextTargets;

        // 5. Update Particles Physics
        let nextParticles = particlesRef.current.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5, // Gravity
            opacity: p.opacity - 0.02, // Slower fade for low FPS
        })).filter(p => p.opacity > 0);
        particlesRef.current = nextParticles;

        // 6. Update Floating Scores Physics
        let nextScores = floatingScoresRef.current.map(s => ({
            ...s,
            y: s.y - 2, // Floating up
            opacity: s.opacity - 0.03,
        })).filter(s => s.opacity > 0);
        floatingScoresRef.current = nextScores;

        // 7. Update Shockwaves
        let nextShockwaves = shockwavesRef.current.map(sw => ({
            ...sw,
            radius: sw.radius + (sw.maxRadius - sw.radius) * 0.15,
            opacity: sw.opacity - 0.04, // Slower fade
        })).filter(sw => sw.opacity > 0);
        shockwavesRef.current = nextShockwaves;
        
        // AGGRESSIVE THROTTLE: Update UI every 100ms (10fps) 
        if (now - lastStateUpdateJS.current > 100) {
            setTargets([...nextTargets]);
            setScore(scoreRef.current);
            setParticles([...nextParticles]);
            setFloatingScores([...nextScores]);
            setShockwaves([...nextShockwaves]);
            
            // Timer calculation based on absolute time
            const elapsed = Math.floor((now - startTimeRef.current) / 1000);
            const remaining = Math.max(0, 60 - elapsed);
            setTimer(remaining);
            if (remaining <= 0) setGameState('ended');

            // Dribble hint logic (also throttled)
            const timeSinceLastDribble = now - lastDribbleTime.current;
            setShowDribbleHint(timeSinceLastDribble > 8000);

            lastStateUpdateJS.current = now;
        }
    }, [engine, handleHit]); 

    const updateGameStateRef = useRef(updateGameStateJS);
    useEffect(() => { updateGameStateRef.current = updateGameStateJS; }, [updateGameStateJS]);

    const callUpdateGameState = React.useCallback((deltaTime: number, currentHandX: number, currentHandY: number) => {
        if (updateGameStateRef.current) {
            updateGameStateRef.current(deltaTime, currentHandX, currentHandY);
        }
    }, []);

    useFrameCallback((frameInfo) => {
        if (!isPlayingSV.value) return;
        runOnJS(callUpdateGameState)(
            frameInfo.timeSincePreviousFrame || 16, 
            handX.value, 
            handY.value
        );
    });

    const saveGameResult = async () => {
        if (!authUser || !profile) return;
        
        try {
            await trackerService.saveDribbleSession(authUser.uid, profile.displayName || 'Joueur', {
                duration: 60 - timer,
                repetitions: score, // Each target hit counts as a rep/point
                difficulty: level >= 5 ? 'elite' : (level >= 3 ? 'pro' : 'rookie'),
                comboType: 'Dribble & Touch'
            });
        } catch (error) {
            console.error('Error saving game result:', error);
        }
    };


    if (!permission?.granted || !isTfReady) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <Text style={{ color: text, textAlign: 'center', marginTop: 100 }}>
                    {!permission?.granted ? "En attente des permissions caméra..." : "Initialisation du moteur IA..."}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View style={styles.mainLayout}>
                {/* Camera Layer */}
                <TensorCamera
                    style={StyleSheet.absoluteFill}
                    facing="front"
                    onReady={handleCameraStream}
                    autorender={true} 
                    resizeHeight={180} // Extremly low resolution for max speed
                    resizeWidth={240}
                    resizeDepth={3}
                    useCustomShadersToResize={false} 
                    cameraTextureWidth={1280}
                    cameraTextureHeight={720}
                    // @ts-ignore
                    orientation="landscape"
                    rotation={90}
                />

                {/* Skia Layer - pointerEvents="none" to let touches through to overlays and buttons */}
                <View style={styles.canvasArea} pointerEvents="none">
                    <Canvas style={StyleSheet.absoluteFill}>
                        {shockwaves.map(sw => (
                            <Circle
                                key={sw.id}
                                cx={sw.x}
                                cy={sw.y}
                                r={sw.radius}
                                color={sw.color}
                                opacity={sw.opacity}
                                style="stroke"
                                strokeWidth={2}
                            />
                        ))}
                        {targets.map(t => (
                            <Circle
                                key={t.id}
                                cx={t.x}
                                cy={t.y}
                                r={t.radius}
                                color={t.color}
                            />
                        ))}
                        {particles.map(p => (
                            <Circle
                                key={p.id}
                                cx={p.x}
                                cy={p.y}
                                r={4} // Back to 4px for better visibility
                                color={p.color}
                                opacity={p.opacity}
                            />
                        ))}
                        <Circle
                            cx={handX}
                            cy={handY}
                            r={25}
                            color="rgba(255, 255, 255, 0.6)"
                            opacity={handOpacity}
                        />
                    </Canvas>
                    
                    {/* Floating Scores Layer - Using React for text flexibility */}
                    {floatingScores.map(s => (
                        <View key={s.id} style={{ 
                            position: 'absolute', 
                            left: s.x - 20, 
                            top: s.y, 
                            opacity: s.opacity 
                        }}>
                            <Text style={{ 
                                color: '#FFF', 
                                fontWeight: 'bold', 
                                fontSize: 18, 
                                textShadowColor: 'black', 
                                textShadowRadius: 4 
                            }}>
                                {s.text}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* HUD & State-based Overlays */}
                {combo > 1 && (
                    <Animated.View style={[styles.comboBadge, comboBadgeStyle]}>
                        <Text style={styles.comboText}>X{1 + Math.floor(combo / 5)} COMBO</Text>
                    </Animated.View>
                )}

                {showDribbleHint && gameState === 'playing' && (
                    <View style={styles.pauseOverlay}>
                        <Ionicons name="basketball" size={80} color="#FF9500" />
                        <Text style={styles.pauseText}>DRIBBLEZ POUR CONTINUER !</Text>
                    </View>
                )}

                {gameState === 'idle' && (
                    <View style={styles.overlay}>
                        <Text style={[styles.pauseText, { fontSize: 32, marginBottom: 30 }]}>CHOISIS TA DIFFICULTÉ</Text>
                        <View style={styles.difficultyContainer}>
                            <TouchableOpacity 
                                style={[styles.difficultyButton, { borderColor: '#34C759' }]}
                                onPress={() => { setLevel(1); setGameState('ready'); }}
                            >
                                <Text style={[styles.difficultyText, { color: '#34C759' }]}>ROOKIE</Text>
                                <Text style={styles.difficultySubtext}>Lvl 1</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.difficultyButton, { borderColor: '#FF9500' }]}
                                onPress={() => { setLevel(3); setGameState('ready'); }}
                            >
                                <Text style={[styles.difficultyText, { color: '#FF9500' }]}>PRO</Text>
                                <Text style={styles.difficultySubtext}>Lvl 3</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.difficultyButton, { borderColor: '#FF3B30' }]}
                                onPress={() => { setLevel(5); setGameState('ready'); }}
                            >
                                <Text style={[styles.difficultyText, { color: '#FF3B30' }]}>ELITE</Text>
                                <Text style={styles.difficultySubtext}>Lvl 5</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {gameState === 'ready' && (
                    <View style={styles.overlay}>
                        <View style={[styles.levelBadge, { backgroundColor: accentColor, marginBottom: 20, transform: [{scale: 1.5}] }]}>
                            <Text style={styles.levelText}>MODE {level >= 5 ? 'ELITE' : (level >= 3 ? 'PRO' : 'ROOKIE')}</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.startButton, { backgroundColor: primary }]}
                            onPress={() => setGameState('countdown')}
                        >
                            <Text style={styles.startBtnText}>START DRIBBLE CHALLENGE</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.hintText}>Ou commencez à dribbler pour lancer !</Text>
                        
                        <TouchableOpacity 
                            style={{ marginTop: 30 }}
                            onPress={() => setGameState('idle')}
                        >
                            <Text style={{ color: '#FFF', textDecorationLine: 'underline' }}>Changer de difficulté</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {gameState === 'countdown' && (
                    <View style={styles.overlay}>
                        <Text style={styles.countdownValue}>{countdown}</Text>
                        <Text style={styles.pauseText}>PRÉPAREZ-VOUS !</Text>
                    </View>
                )}

                {gameState === 'ended' && (
                    <View style={styles.overlay}>
                        <Text style={[styles.pauseText, { fontSize: 40 }]}>BRAVO !</Text>
                        <Text style={[styles.pauseText, { color: primary }]}>SCORE: {score}</Text>
                        <TouchableOpacity 
                            style={[styles.startButton, { backgroundColor: accentColor, marginTop: 40 }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.startBtnText}>RETOURNER AU HUB</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Animated.View style={[styles.dribbleIndicator, dribbleIndicatorStyle]}>
                    <Ionicons name="basketball" size={32} color="#FF9500" />
                </Animated.View>

                {/* Header at the bottom of JSX for top-most rendering */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={text} />
                    </TouchableOpacity>
                    <View style={styles.statsContainer}>
                        <Text style={[styles.scoreText, { color: primary }]}>{score}</Text>
                        <Text style={[styles.timerText, { color: timer < 10 ? '#FF3B30' : text }]}>
                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                        </Text>
                    </View>
                    <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
                        <Text style={styles.levelText}>LVL {level}</Text>
                    </View>
                </View>

                {/* Debug Overlay - High Z-Index and Safe Area padding */}
                <View style={{ 
                    position: 'absolute', 
                    top: 100, // Move it down from header but keep it top-leftish
                    left: 20, 
                    backgroundColor: 'rgba(255,0,0,0.8)', // Red background for visibility
                    padding: 8, 
                    borderRadius: 8,
                    zIndex: 9999, 
                }}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>STATE: {gameState.toUpperCase()}</Text>
                    <Text style={{ color: '#FFF', fontSize: 12 }}>ENGINE: {engineFps} FPS</Text>
                    <Text style={{ color: '#FFF', fontSize: 12 }}>HAND: {isHandDetected ? 'DETECTED' : 'NOT FOUND'}</Text>
                    <Text style={{ color: '#FFF', fontSize: 12 }}>TARGETS: {targets.length} (JS State)</Text>
                    {loopError && <Text style={{ color: '#FFFF00', fontSize: 12 }}>ERR: {loopError}</Text>}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    mainLayout: { flex: 1 },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingBottom: 10,
    },
    closeButton: {
        padding: 5,
    },
    statsContainer: {
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 32,
        fontWeight: '900',
    },
    timerText: {
        fontSize: 18,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    levelBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    levelText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    canvasArea: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 20,
    },
    pauseText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    comboBadge: {
        position: 'absolute',
        top: 100, 
        left: 20,
        backgroundColor: '#FFD700',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 5,
        zIndex: 5,
    },
    comboText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
    },
    startButton: {
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 50,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    startBtnText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dribbleIndicator: {
        position: 'absolute',
        bottom: 20,
        right: 40,
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 50,
    },
    countdownValue: {
        fontSize: 120,
        fontWeight: '900',
        color: '#FF9500',
    },
    hintText: {
        color: '#AAA',
        marginTop: 30,
        fontSize: 16,
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    difficultyButton: {
        width: 120,
        height: 120,
        borderRadius: 20,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    difficultyText: {
        fontSize: 20,
        fontWeight: '900',
    },
    difficultySubtext: {
        color: '#AAA',
        fontSize: 14,
        marginTop: 5,
    },
});
