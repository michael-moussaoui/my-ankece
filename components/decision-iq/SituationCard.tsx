// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// components/decision-iq/SituationCard.tsx
// Carte de situation principale : description, image, timer, options
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Situation, SituationResult } from '@/types/decisionIQ';
import { TimerBar } from './TimerBar';
import { OptionButton } from './OptionButton';

const { width } = Dimensions.get('window');

// Labels des catégories en français
const CATEGORY_LABELS: Record<string, string> = {
    pick_and_roll: 'Pick & Roll',
    transition: 'Transition',
    half_court: 'Demi-terrain',
    clutch: '🔥 Clutch',
    isolation: 'Isolation',
    zone_offense: 'Attaque Zone',
    press_break: 'Press Break',
    defense_reads: 'Lecture Défense',
};

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: '#22C55E',
    medium: '#F97316',
    hard: '#EF4444',
};

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'FACILE',
    medium: 'MEDIUM',
    hard: 'HARD',
};

interface SituationCardProps {
    situation: Situation;
    index: number;
    total: number;
    timeLeft: number;
    timerProgress: number;
    selectedOption: number | null;
    isRevealed: boolean;
    lastResult: SituationResult | null;
    onSelectOption: (index: number) => void;
    onNext: () => void;
    accentColor: string;
    currentIQ: number;
}

export const SituationCard: React.FC<SituationCardProps> = ({
    situation,
    index,
    total,
    timeLeft,
    timerProgress,
    selectedOption,
    isRevealed,
    lastResult,
    onSelectOption,
    onNext,
    accentColor,
    currentIQ,
}) => {
    const diffColor = DIFFICULTY_COLORS[situation.difficulty];

    return (
        <Animated.View entering={SlideInRight.springify().damping(18)} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ── Header : Progress + IQ ──────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(50)} style={styles.header}>
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                            {index + 1}<Text style={styles.progressTotal}>/{total}</Text>
                        </Text>
                        <View style={styles.progressDots}>
                            {Array.from({ length: total }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.progressDot,
                                        i < index && { backgroundColor: accentColor, opacity: 1 },
                                        i === index && { backgroundColor: '#FFF', opacity: 1 },
                                        i > index && { backgroundColor: 'rgba(255,255,255,0.2)', opacity: 1 },
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* IQ actuel */}
                    <View style={styles.iqBadge}>
                        <Ionicons name="flash" size={12} color={accentColor} />
                        <Text style={[styles.iqText, { color: accentColor }]}>{currentIQ} IQ</Text>
                    </View>
                </Animated.View>

                {/* ── Timer Bar ───────────────────────────────────────── */}
                <Animated.View entering={FadeIn.delay(100)} style={styles.timerSection}>
                    <TimerBar
                        timeLeft={timeLeft}
                        maxTime={15}
                        isRevealed={isRevealed}
                        accentColor={accentColor}
                    />
                </Animated.View>

                {/* ── Tags : Position + Catégorie + Difficulté ────────── */}
                <Animated.View entering={FadeInDown.delay(150)} style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                        <Text style={styles.tagText}>{situation.position}</Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                        <Text style={styles.tagText}>{CATEGORY_LABELS[situation.category] || situation.category}</Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: `${diffColor}22`, borderColor: `${diffColor}66`, borderWidth: 1 }]}>
                        <Text style={[styles.tagText, { color: diffColor }]}>{DIFFICULTY_LABELS[situation.difficulty]}</Text>
                    </View>
                </Animated.View>

                {/* ── Image de situation ──────────────────────────────── */}
                {situation.imageUrl ? (
                    <Animated.View entering={FadeIn.delay(200)} style={styles.imageContainer}>
                        <Image
                            source={{ uri: situation.imageUrl }}
                            style={styles.situationImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.5)']}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                ) : (
                    // Placeholder visuel si pas d'image
                    <Animated.View entering={FadeIn.delay(200)} style={[styles.imageContainer, styles.imagePlaceholder]}>
                        <Ionicons name="basketball-outline" size={48} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.placeholderText}>Visualise la situation</Text>
                    </Animated.View>
                )}

                {/* ── Description de la situation ─────────────────────── */}
                <Animated.View entering={FadeInDown.delay(250)} style={styles.descriptionBox}>
                    <Text style={styles.descLabel}>🏀 LA SITUATION</Text>
                    <Text style={styles.descText}>{situation.description}</Text>
                </Animated.View>

                {/* ── Options de réponse ──────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.optionsSection}>
                    <Text style={styles.optionsLabel}>Ta décision :</Text>
                    {situation.options.map((option, i) => (
                        <OptionButton
                            key={option.id}
                            option={option}
                            index={i}
                            isSelected={selectedOption === i}
                            isCorrect={isRevealed && i === situation.correctIndex}
                            isRevealed={isRevealed}
                            onPress={onSelectOption}
                            accentColor={accentColor}
                            delay={350 + i * 60}
                        />
                    ))}
                </Animated.View>

                {/* ── Explication (après révélation) ──────────────────── */}
                {isRevealed && (
                    <Animated.View entering={FadeInUp.springify()} style={styles.explanationBox}>
                        {/* Feedback IQ */}
                        {lastResult && (
                            <View style={[
                                styles.iqFeedback,
                                { backgroundColor: lastResult.isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }
                            ]}>
                                <Text style={styles.feedbackEmoji}>
                                    {lastResult.isCorrect ? '🧠' : '💡'}
                                </Text>
                                <View>
                                    <Text style={[
                                        styles.feedbackTitle,
                                        { color: lastResult.isCorrect ? '#22C55E' : '#EF4444' }
                                    ]}>
                                        {lastResult.isCorrect
                                            ? `Excellente lecture ! +${lastResult.iqGained} IQ`
                                            : selectedOption === -1
                                                ? 'Temps écoulé ! -3 IQ'
                                                : `Mauvaise lecture. ${lastResult.iqGained} IQ`
                                        }
                                    </Text>
                                    <Text style={styles.feedbackTime}>
                                        {lastResult.isCorrect && `Décision en ${lastResult.timeUsed}s`}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Explication tactique */}
                        <View style={styles.explanationContent}>
                            <Text style={styles.explanationLabel}>💡 ANALYSE TACTIQUE</Text>
                            <Text style={styles.explanationText}>{situation.explanation}</Text>

                            {/* Tags tactiques */}
                            {situation.tags.length > 0 && (
                                <View style={styles.tacticTags}>
                                    {situation.tags.slice(0, 4).map(tag => (
                                        <View key={tag} style={styles.tacticTag}>
                                            <Text style={styles.tacticTagText}>#{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Bouton Suivant */}
                        <TouchableOpacity
                            style={[styles.nextBtn, { backgroundColor: accentColor }]}
                            onPress={onNext}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.nextBtnText}>Situation suivante →</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    progressContainer: {
        gap: 6,
    },
    progressText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 18,
    },
    progressTotal: {
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '400',
        fontSize: 14,
    },
    progressDots: {
        flexDirection: 'row',
        gap: 4,
    },
    progressDot: {
        width: 8,
        height: 4,
        borderRadius: 2,
    },
    iqBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iqText: {
        fontSize: 13,
        fontWeight: '900',
    },
    timerSection: {
        marginBottom: 16,
    },
    tags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tagText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    situationImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderStyle: 'dashed',
        gap: 8,
    },
    placeholderText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    descriptionBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    descLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    descText: {
        color: '#FFF',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    optionsSection: {
        marginBottom: 16,
    },
    optionsLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    explanationBox: {
        gap: 12,
        marginTop: 4,
    },
    iqFeedback: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
    },
    feedbackEmoji: {
        fontSize: 28,
    },
    feedbackTitle: {
        fontWeight: '800',
        fontSize: 14,
    },
    feedbackTime: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        marginTop: 2,
    },
    explanationContent: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 10,
    },
    explanationLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    explanationText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13.5,
        lineHeight: 21,
    },
    tacticTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    tacticTag: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tacticTagText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
    },
    nextBtn: {
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtnText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 15,
    },
});
