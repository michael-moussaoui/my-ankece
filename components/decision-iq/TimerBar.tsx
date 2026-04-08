// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// components/decision-iq/TimerBar.tsx
// Barre de progression animée pour le timer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';

interface TimerBarProps {
    timeLeft: number;
    maxTime: number;
    isRevealed: boolean;
    accentColor: string;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timeLeft, maxTime, isRevealed, accentColor }) => {
    const progress = useSharedValue(1);
    const percentage = timeLeft / maxTime;

    useEffect(() => {
        // Animation fluide de la barre
        progress.value = withTiming(percentage, {
            duration: 900,
            easing: Easing.out(Easing.quad),
        });
    }, [timeLeft]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
        backgroundColor: (() => {
            // Vert -> Orange -> Rouge selon le temps restant
            if (progress.value > 0.6) return accentColor;
            if (progress.value > 0.3) return '#F97316';
            return '#EF4444';
        })(),
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: progress.value < 0.25 && !isRevealed ? 1 : 0,
    }));

    return (
        <View style={styles.container}>
            {/* Track */}
            <View style={styles.track}>
                <Animated.View style={[styles.bar, barStyle]} />
            </View>

            {/* Timer display */}
            <View style={styles.timerRow}>
                <Animated.View style={[styles.urgencyDot, pulseStyle,
                    { backgroundColor: '#EF4444' }
                ]} />
                <Text style={[
                    styles.timerText,
                    timeLeft <= 3 && !isRevealed && styles.timerUrgent,
                ]}>
                    {isRevealed ? '⏱' : `${timeLeft}s`}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 0,
    },
    track: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 3,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 6,
        gap: 4,
    },
    urgencyDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    timerText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    timerUrgent: {
        color: '#EF4444',
        fontSize: 14,
    },
});
