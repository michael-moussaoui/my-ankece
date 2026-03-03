import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface AnalysisLoadingOverlayProps {
    message?: string;
}

export const AnalysisLoadingOverlay: React.FC<AnalysisLoadingOverlayProps> = ({ 
    message = "Analyse de votre tir en cours..." 
}) => {
    const { accentColor } = useAppTheme();
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Rotation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <Animated.View style={[styles.spinner, { borderColor: accentColor, transform: [{ rotate: spin }] }]} />
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons name="basketball" size={60} color={accentColor} />
                    </Animated.View>
                </View>
                <Text style={styles.message}>{message}</Text>
                <Text style={styles.subMessage}>Nos algorithmes étudient votre biomécanique...</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    spinner: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    message: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subMessage: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textAlign: 'center',
    }
});
