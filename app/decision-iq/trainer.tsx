// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// app/decision-iq/trainer.tsx
// Écran principal du simulateur Decision IQ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { useDecisionTrainer } from '@/hooks/useDecisionTrainer';
import { SituationCard } from '@/components/decision-iq/SituationCard';
import { SessionSummary } from '@/components/decision-iq/SessionSummary';
import type { Difficulty, PlayerPosition, SessionConfig, SituationCategory } from '@/types/decisionIQ';

export default function DecisionIQTrainer() {
    const insets = useSafeAreaInsets();
    const { accentColor } = useAppTheme();
    const router = useRouter();

    // ── Récupération des params de configuration ──────────────────
    const params = useLocalSearchParams<{
        mode: Difficulty;
        position: PlayerPosition;
        category: string;
        count: string;
    }>();

    const config: SessionConfig = {
        mode: params.mode || 'medium',
        position: params.position || 'PG',
        category: params.category !== 'all' ? (params.category as SituationCategory) : undefined,
        situationCount: (parseInt(params.count || '10', 10) as 10 | 15 | 20) || 10,
    };

    // ── Hook du trainer ───────────────────────────────────────────
    const {
        isLoading,
        isSessionActive,
        isFinished,
        currentSituation,
        currentIndex,
        totalSituations,
        timeLeft,
        timerProgress,
        selectedOption,
        isRevealed,
        lastResult,
        score,
        currentIQ,
        playerStats,
        sessionResult,
        startSession,
        selectOption,
        nextSituation,
        resetTrainer,
    } = useDecisionTrainer();

    // ── Démarre la session au montage ─────────────────────────────
    useEffect(() => {
        startSession(config);
        return () => {
            // Cleanup au démontage
            resetTrainer();
        };
    }, []);

    // ── Handlers ─────────────────────────────────────────────────
    const handlePlayAgain = () => {
        resetTrainer();
        startSession(config);
    };

    const handleGoHome = () => {
        resetTrainer();
        router.back();
    };

    // ── Loading ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Stack.Screen options={{ headerShown: false }} />
                <LinearGradient colors={['#07070E', '#0D0D1A']} style={StyleSheet.absoluteFill} />
                <Animated.View entering={FadeIn} style={styles.loadingContent}>
                    <ActivityIndicator size="large" color={accentColor} />
                    <Text style={[styles.loadingText, { color: accentColor }]}>
                        Génération des situations...
                    </Text>
                    <Text style={styles.loadingSubText}>
                        IA + situations tactiques experts
                    </Text>
                </Animated.View>
            </View>
        );
    }

    // ── Session terminée : Résumé ─────────────────────────────────
    if (isFinished && sessionResult) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <LinearGradient colors={['#07070E', '#0D0D1A']} style={StyleSheet.absoluteFill} />
                <SessionSummary
                    sessionResult={sessionResult}
                    previousIQ={playerStats?.currentIQ || 1000}
                    accentColor={accentColor}
                    onPlayAgain={handlePlayAgain}
                    onGoHome={handleGoHome}
                />
            </View>
        );
    }

    // ── Simulation active ─────────────────────────────────────────
    if (!currentSituation) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Stack.Screen options={{ headerShown: false }} />
                <LinearGradient colors={['#07070E', '#0D0D1A']} style={StyleSheet.absoluteFill} />
                <Text style={styles.errorText}>Aucune situation disponible.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#07070E', '#0D0D1A', '#0A060F']}
                style={StyleSheet.absoluteFill}
            />

            <SituationCard
                situation={currentSituation}
                index={currentIndex}
                total={totalSituations}
                timeLeft={timeLeft}
                timerProgress={timerProgress}
                selectedOption={selectedOption}
                isRevealed={isRevealed}
                lastResult={lastResult}
                onSelectOption={selectOption}
                onNext={currentIndex >= totalSituations - 1 && isRevealed
                    ? () => {
                        // Dernière situation → termine la session
                        import('@/hooks/useDecisionTrainer'); // noop – finishSession is called by nextSituation
                        nextSituation();
                      }
                    : nextSituation
                }
                accentColor={accentColor}
                currentIQ={currentIQ}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07070E',
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContent: {
        alignItems: 'center',
        gap: 14,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: 10,
    },
    loadingSubText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    errorText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
    },
});
