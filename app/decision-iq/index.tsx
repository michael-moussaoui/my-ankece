// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// app/decision-iq/index.tsx
// Écran d'accueil : sélection de la configuration de session
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlayerPosition, Difficulty, SituationCategory, SessionConfig } from '@/types/decisionIQ';
import { getPlayerIQStats, getIQTitle } from '@/services/decisionIQService';
import { useAuth } from '@/context/AuthContext';
import { AnkeceLogo } from '@/components/AnkeceLogo';

const { width } = Dimensions.get('window');

// ── Choix de difficulté ──────────────────────────────────────────────────────
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; emoji: string; desc: string; time: string; color: string }[] = [
    { value: 'easy', label: 'Easy', emoji: '🌱', desc: 'Situations claires, 15 secondes', time: '15s', color: '#22C55E' },
    { value: 'medium', label: 'Medium', emoji: '🏀', desc: 'Situations variées, 12 secondes', time: '12s', color: '#F97316' },
    { value: 'hard', label: 'Hard', emoji: '🔥', desc: 'Situations complexes, 8 secondes', time: '8s', color: '#EF4444' },
];

// ── Positions ────────────────────────────────────────────────────────────────
const POSITIONS: { value: PlayerPosition; label: string; full: string }[] = [
    { value: 'PG', label: 'PG', full: 'Meneur' },
    { value: 'SG', label: 'SG', full: 'Arrière' },
    { value: 'SF', label: 'SF', full: 'Ailier' },
    { value: 'PF', label: 'PF', full: 'Ailier Fort' },
    { value: 'C', label: 'C', full: 'Pivot' },
];

// ── Catégories ───────────────────────────────────────────────────────────────
const CATEGORIES: { value: SituationCategory | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'Toutes', emoji: '🎯' },
    { value: 'pick_and_roll', label: 'Pick & Roll', emoji: '🔄' },
    { value: 'transition', label: 'Transition', emoji: '⚡' },
    { value: 'half_court', label: 'Demi-terrain', emoji: '📐' },
    { value: 'clutch', label: 'Clutch', emoji: '🔥' },
    { value: 'isolation', label: 'Isolation', emoji: '1️⃣' },
    { value: 'defense_reads', label: 'Défense', emoji: '🛡️' },
];

// ── Volume ───────────────────────────────────────────────────────────────────
const VOLUMES: { value: 10 | 15 | 20; label: string; desc: string }[] = [
    { value: 10, label: '10', desc: '~5 min' },
    { value: 15, label: '15', desc: '~8 min' },
    { value: 20, label: '20', desc: '~12 min' },
];

export default function DecisionIQHome() {
    const insets = useSafeAreaInsets();
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { user } = useAuth();
    const isDark = colorScheme === 'dark' || true;

    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [position, setPosition] = useState<PlayerPosition>('PG');
    const [category, setCategory] = useState<SituationCategory | 'all'>('all');
    const [volume, setVolume] = useState<10 | 15 | 20>(10);

    const handleStart = () => {
        const config: SessionConfig = {
            mode: difficulty,
            position,
            category: category === 'all' ? undefined : category,
            situationCount: volume,
        };
        // Passe la config en params Expo Router
        router.push({
            pathname: '/decision-iq/trainer',
            params: {
                mode: config.mode,
                position: config.position,
                category: config.category || 'all',
                count: String(config.situationCount),
            },
        } as any);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Background gradient ────────────────────────── */}
            <LinearGradient
                colors={['#07070E', '#0D0D1A', '#0A060F']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ── Header ──────────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(50)} style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backBtn}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        
                        <AnkeceLogo style={styles.headerLogo} />
                    </View>

                    <View style={styles.headerCenter}>
                        <View style={styles.headerBadge}>
                            <Ionicons name="flash" size={14} color={accentColor} />
                            <Text style={[styles.headerBadgeText, { color: accentColor }]}>MENTAL GAME</Text>
                        </View>
                        <Text style={styles.headerTitle}>Decision IQ{'\n'}Trainer</Text>
                        <Text style={styles.headerSub}>Améliore ta lecture du jeu</Text>
                    </View>
                </Animated.View>

                {/* ── Difficulté ──────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                    <Text style={styles.sectionTitle}>DIFFICULTÉ</Text>
                    <View style={styles.difficultyRow}>
                        {DIFFICULTY_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.difficultyCard,
                                    difficulty === opt.value && {
                                        borderColor: opt.color,
                                        backgroundColor: `${opt.color}18`,
                                    },
                                ]}
                                onPress={() => setDifficulty(opt.value)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.diffEmoji}>{opt.emoji}</Text>
                                <Text style={[styles.diffLabel, difficulty === opt.value && { color: opt.color }]}>
                                    {opt.label}
                                </Text>
                                <Text style={styles.diffTime}>{opt.time}</Text>
                                <Text style={styles.diffDesc}>{opt.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Position ────────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                    <Text style={styles.sectionTitle}>TA POSITION</Text>
                    <View style={styles.positionRow}>
                        {POSITIONS.map(pos => (
                            <TouchableOpacity
                                key={pos.value}
                                style={[
                                    styles.positionBtn,
                                    position === pos.value && {
                                        backgroundColor: accentColor,
                                        borderColor: accentColor,
                                    },
                                ]}
                                onPress={() => setPosition(pos.value)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.positionLabel,
                                    position === pos.value && { color: '#000' },
                                ]}>
                                    {pos.label}
                                </Text>
                                <Text style={[
                                    styles.positionFull,
                                    position === pos.value && { color: 'rgba(0,0,0,0.6)' },
                                ]}>
                                    {pos.full}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Catégorie ───────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
                    <Text style={styles.sectionTitle}>CATÉGORIE TACTIQUE</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[
                                    styles.categoryChip,
                                    category === cat.value && {
                                        backgroundColor: `${accentColor}22`,
                                        borderColor: accentColor,
                                    },
                                ]}
                                onPress={() => setCategory(cat.value as any)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                                <Text style={[
                                    styles.catLabel,
                                    category === cat.value && { color: accentColor },
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Volume ──────────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                    <Text style={styles.sectionTitle}>NOMBRE DE SITUATIONS</Text>
                    <View style={styles.volumeRow}>
                        {VOLUMES.map(v => (
                            <TouchableOpacity
                                key={v.value}
                                style={[
                                    styles.volumeBtn,
                                    volume === v.value && {
                                        backgroundColor: `${accentColor}22`,
                                        borderColor: accentColor,
                                    },
                                ]}
                                onPress={() => setVolume(v.value)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.volumeNum, volume === v.value && { color: accentColor }]}>
                                    {v.label}
                                </Text>
                                <Text style={styles.volumeDesc}>{v.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ── Résumé de config ────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(350)} style={styles.configSummary}>
                    <View style={styles.configItem}>
                        <Ionicons name="timer-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.configText}>
                            {DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.time} par situation
                        </Text>
                    </View>
                    <View style={styles.configItem}>
                        <Ionicons name="basketball-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.configText}>
                            {volume} situations {position}
                        </Text>
                    </View>
                    <View style={styles.configItem}>
                        <Ionicons name="flash-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.configText}>
                            {category === 'all' ? 'Toutes catégories' : CATEGORIES.find(c => c.value === category)?.label}
                        </Text>
                    </View>
                </Animated.View>

                {/* ── CTA ─────────────────────────────────────── */}
                <Animated.View entering={FadeInUp.delay(400)} style={styles.ctaSection}>
                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: accentColor }]}
                        onPress={handleStart}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="flash" size={22} color="#000" />
                        <Text style={styles.startBtnText}>Commencer la session</Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        🧠 L'IA analyse ta progression et adapte les situations à ton niveau.
                    </Text>
                </Animated.View>

                <View style={{ height: insets.bottom + 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07070E',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
        gap: 12,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerLogo: {
        width: 32,
        height: 32,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        gap: 6,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    headerBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '900',
        lineHeight: 42,
    },
    headerSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 12,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    difficultyRow: {
        flexDirection: 'row',
        gap: 10,
    },
    difficultyCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        gap: 4,
    },
    diffEmoji: {
        fontSize: 24,
    },
    diffLabel: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 13,
    },
    diffTime: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        fontWeight: '700',
    },
    diffDesc: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 9,
        textAlign: 'center',
        marginTop: 2,
    },
    positionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    positionBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        gap: 2,
    },
    positionLabel: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 13,
    },
    positionFull: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 8,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    catEmoji: {
        fontSize: 14,
    },
    catLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    volumeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    volumeBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        gap: 4,
    },
    volumeNum: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
    },
    volumeDesc: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
    },
    configSummary: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: 14,
        gap: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    configText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
    },
    ctaSection: {
        paddingHorizontal: 20,
        gap: 14,
    },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 18,
        gap: 10,
    },
    startBtnText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 17,
    },
    disclaimer: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});
