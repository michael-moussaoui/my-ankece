// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// components/decision-iq/OptionButton.tsx
// Bouton de réponse large et gamifié
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
    FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DecisionOption } from '@/types/decisionIQ';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface OptionButtonProps {
    option: DecisionOption;
    index: number;
    isSelected: boolean;
    isCorrect: boolean;    // true si c'est la bonne réponse
    isRevealed: boolean;   // true après la sélection
    onPress: (index: number) => void;
    accentColor: string;
    delay?: number;        // délai d'animation d'entrée
}

export const OptionButton: React.FC<OptionButtonProps> = ({
    option,
    index,
    isSelected,
    isCorrect,
    isRevealed,
    onPress,
    accentColor,
    delay = 0,
}) => {
    const scale = useSharedValue(1);
    const borderOpacity = useSharedValue(0);

    useEffect(() => {
        if (isRevealed && (isSelected || isCorrect)) {
            // Animation de feedback : shake si mauvais, bounce si bon
            if (isSelected && !isCorrect) {
                scale.value = withSequence(
                    withTiming(0.97, { duration: 80 }),
                    withSpring(1.02),
                    withSpring(1),
                );
            } else if (isCorrect) {
                scale.value = withSequence(
                    withSpring(1.04),
                    withSpring(1),
                );
            }
            borderOpacity.value = withTiming(1, { duration: 250 });
        }
    }, [isRevealed, isSelected, isCorrect]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // ── Couleurs selon l'état ──────────────────────────────────
    const getColors = () => {
        if (!isRevealed) {
            return {
                bg: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                border: isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                labelBg: isSelected ? accentColor : 'rgba(255,255,255,0.15)',
                text: '#FFF',
            };
        }
        // Phase révélée
        if (isCorrect) {
            return {
                bg: 'rgba(34, 197, 94, 0.15)',
                border: '#22C55E',
                labelBg: '#22C55E',
                text: '#FFF',
            };
        }
        if (isSelected && !isCorrect) {
            return {
                bg: 'rgba(239, 68, 68, 0.15)',
                border: '#EF4444',
                labelBg: '#EF4444',
                text: '#FFF',
            };
        }
        // Autre option non sélectionnée
        return {
            bg: 'rgba(255,255,255,0.03)',
            border: 'rgba(255,255,255,0.06)',
            labelBg: 'rgba(255,255,255,0.1)',
            text: 'rgba(255,255,255,0.35)',
        };
    };

    const colors = getColors();
    const disabled = isRevealed;

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).springify().damping(15)}
            style={animStyle}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                    },
                ]}
                onPress={() => onPress(index)}
                disabled={disabled}
                activeOpacity={0.75}
            >
                {/* Label lettre (A/B/C/D) */}
                <View style={[styles.label, { backgroundColor: colors.labelBg }]}>
                    <Text style={styles.labelText}>{OPTION_LABELS[index]}</Text>
                </View>

                {/* Texte option */}
                <View style={styles.textContainer}>
                    <Text style={[styles.optionText, { color: colors.text }]} numberOfLines={2}>
                        {option.label}
                    </Text>
                    {option.description && isRevealed && (
                        <Text style={[styles.optionDesc, { color: isCorrect ? '#86EFAC' : isSelected ? '#FCA5A5' : 'rgba(255,255,255,0.3)' }]} numberOfLines={2}>
                            {option.description}
                        </Text>
                    )}
                </View>

                {/* Icône de résultat */}
                {isRevealed && (isCorrect || isSelected) && (
                    <Ionicons
                        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={22}
                        color={isCorrect ? '#22C55E' : '#EF4444'}
                        style={styles.resultIcon}
                    />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 14,
        gap: 12,
        marginBottom: 10,
    },
    label: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    labelText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
    },
    textContainer: {
        flex: 1,
        gap: 3,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    optionDesc: {
        fontSize: 11,
        lineHeight: 15,
        fontStyle: 'italic',
    },
    resultIcon: {
        flexShrink: 0,
    },
});
