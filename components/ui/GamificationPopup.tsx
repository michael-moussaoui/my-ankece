import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface GamificationPopupProps {
    visible: boolean;
    title: string;
    xp?: number;
    onClose: () => void;
}

export const GamificationPopup: React.FC<GamificationPopupProps> = ({ visible, title, xp, onClose }) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const { accentColor } = useAppTheme();

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    useNativeDriver: true,
                })
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hide = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={[
                styles.popup, 
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
                <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
                    <Ionicons name="trophy" size={32} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                    <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
                    {xp && <ThemedText style={styles.xpText}>+{xp} XP</ThemedText>}
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    popup: {
        width: width * 0.85,
        backgroundColor: '#1C1C1E',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
    },
    xpText: {
        color: '#34C759',
        fontWeight: '900',
        fontSize: 18,
    }
});
