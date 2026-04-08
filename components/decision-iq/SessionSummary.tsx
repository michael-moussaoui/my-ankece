// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// components/decision-iq/SessionSummary.tsx
// Écran de résumé affiché à la fin d'une session
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SessionResult, SituationCategory } from '@/types/decisionIQ';
import { getIQTitle } from '@/services/decisionIQService';

const { width } = Dimensions.get('window');

const BADGE_INFO: Record<string, { label: string; emoji: string; color: string }> = {
    perfect_session:  { label: 'Session Parfaite', emoji: '💎', color: '#FFD700' },
    clutch_reader:    { label: 'Clutch Reader', emoji: '🔥', color: '#EF4444' },
    hot_streak:       { label: 'Hot Streak x5', emoji: '⚡', color: '#F97316' },
    elite_hard:       { label: 'Elite Hard Mode', emoji: '🏆', color: '#7C3AED' },
};

const CATEGORY_LABELS: Record<string, string> = {
    pick_and_roll: 'P&R',
    transition: 'Transition',
    half_court: 'Demi-terrain',
    clutch: 'Clutch',
    isolation: 'Iso',
    zone_offense: 'Zone',
    press_break: 'Press',
    defense_reads: 'Défense',
};

interface CategoryStatBarProps {
    category: string;
    correct: number;
    total: number;
    accentColor: string;
    delay: number;
}

const CategoryStatBar: React.FC<CategoryStatBarProps> = ({ category, correct, total, accentColor, delay }) => {
    const rate = total > 0 ? (correct / total) : 0;
    const barWidth = `${Math.round(rate * 100)}%`;
    const color = rate >= 0.75 ? '#22C55E' : rate >= 0.5 ? '#F97316' : '#EF4444';

    return (
        <Animated.View entering={FadeInDown.delay(delay)} style={styles.statBarContainer}>
            <View style={styles.statBarHeader}>
                <Text style={styles.statBarLabel}>{CATEGORY_LABELS[category] || category}</Text>
                <Text style={[styles.statBarRate, { color }]}>{correct}/{total}</Text>
            </View>
            <View style={styles.statBarTrack}>
                <View style={[styles.statBarFill, { width: barWidth as any, backgroundColor: color }]} />
            </View>
        </Animated.View>
    );
};

interface SessionSummaryProps {
    sessionResult: SessionResult;
    previousIQ: number;
    accentColor: string;
    onPlayAgain: () => void;
    onGoHome: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
    sessionResult,
    previousIQ,
    accentColor,
    onPlayAgain,
    onGoHome,
}) => {
    const rate = sessionResult.correctAnswers / sessionResult.totalSituations;
    const percentage = Math.round(rate * 100);
    const iqTitle = getIQTitle(sessionResult.iqScore);
    const isPositive = sessionResult.iqDelta >= 0;

    // Agrège les résultats par catégorie
    const categoryStats = sessionResult.situationResults.reduce<
        Record<string, { correct: number; total: number }>
    >((acc, r) => {
        if (!acc[r.category]) acc[r.category] = { correct: 0, total: 0 };
        acc[r.category].total += 1;
        if (r.isCorrect) acc[r.category].correct += 1;
        return acc;
    }, {});

    // Génère un conseil personnalisé selon la catégorie la plus faible
    const worstCategory = Object.entries(categoryStats)
        .filter(([, v]) => v.total > 0)
        .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))[0];

    const getPersonalizedTip = () => {
        if (!worstCategory) return null;
        const [cat, stats] = worstCategory;
        if (stats.correct / stats.total >= 0.7) return null; // Pas de mauvaise catégorie
        const tips: Record<string, string> = {
            pick_and_roll: "Travaille ta lecture du pick & roll : DROP = pull-up, SWITCH = mismatch, HEDGE = skip pass.",
            transition: "En transition, pense d'abord au nombre. 3v2 → engage + kick. 2v1 → attaque le défenseur et sépare.",
            clutch: "En clutch, simplifie. Un P&R bien exécuté vaut mieux qu'une iso complexe sous pression.",
            isolation: "En iso : lis la position du défenseur avant de driver. Jab step → attaque le côté ouvert.",
            defense_reads: "Défense : anticipe le mouvement, ne le suis pas. Tes yeux doivent être sur le ballon ET ton joueur.",
        };
        return tips[cat] || "Continue à t'entraîner sur cette catégorie.";
    };
    const tip = getPersonalizedTip();

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#0A0A0F', '#0F0F1A']}
                style={StyleSheet.absoluteFill}
            />

            {/* ── Score Principal ─────────────────────────────── */}
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.scoreSection}>
                <Text style={styles.sessionOverLabel}>SESSION TERMINÉE</Text>

                {/* Cercle de pourcentage */}
                <View style={[styles.scoreCircle, { borderColor: accentColor }]}>
                    <Text style={[styles.scorePercentage, { color: accentColor }]}>{percentage}%</Text>
                    <Text style={styles.scoreLabel}>bonnes réponses</Text>
                </View>

                <Text style={styles.correctCount}>
                    {sessionResult.correctAnswers}/{sessionResult.totalSituations}
                </Text>
            </Animated.View>

            {/* ── Evolution IQ ────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.iqEvolution}>
                <View style={styles.iqBox}>
                    <Text style={styles.iqBoxLabel}>IQ Précédent</Text>
                    <Text style={styles.iqBoxValue}>{previousIQ}</Text>
                </View>
                <View style={styles.iqArrow}>
                    <Ionicons
                        name={isPositive ? 'trending-up' : 'trending-down'}
                        size={24}
                        color={isPositive ? '#22C55E' : '#EF4444'}
                    />
                    <Text style={[styles.iqDelta, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
                        {isPositive ? '+' : ''}{sessionResult.iqDelta}
                    </Text>
                </View>
                <View style={styles.iqBox}>
                    <Text style={styles.iqBoxLabel}>Nouveau IQ</Text>
                    <Text style={[styles.iqBoxValue, { color: accentColor }]}>{sessionResult.iqScore}</Text>
                </View>
            </Animated.View>

            {/* ── Titre IQ ────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.iqTitleBox}>
                <Text style={styles.iqTitleEmoji}>{iqTitle.emoji}</Text>
                <View>
                    <Text style={styles.iqTitleLabel}>Ton niveau</Text>
                    <Text style={[styles.iqTitleText, { color: iqTitle.color }]}>{iqTitle.title}</Text>
                </View>
            </Animated.View>

            {/* ── Badges gagnés ───────────────────────────────── */}
            {sessionResult.badges.length > 0 && (
                <Animated.View entering={FadeInDown.delay(350)} style={styles.badgesSection}>
                    <Text style={styles.sectionTitle}>🏅 BADGES GAGNÉS</Text>
                    <View style={styles.badgesRow}>
                        {sessionResult.badges.map((badge, i) => {
                            const info = BADGE_INFO[badge];
                            if (!info) return null;
                            return (
                                <Animated.View
                                    key={badge}
                                    entering={ZoomIn.delay(400 + i * 80).springify()}
                                    style={[styles.badge, { borderColor: info.color }]}
                                >
                                    <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                                    <Text style={[styles.badgeLabel, { color: info.color }]}>{info.label}</Text>
                                </Animated.View>
                            );
                        })}
                    </View>
                </Animated.View>
            )}

            {/* ── Streak ──────────────────────────────────────── */}
            {sessionResult.streak >= 3 && (
                <Animated.View entering={FadeInDown.delay(400)} style={styles.streakBanner}>
                    <Text style={styles.streakText}>
                        ⚡ {sessionResult.streak} bonnes réponses d'affilée !
                    </Text>
                </Animated.View>
            )}

            {/* ── Stats par Catégorie ──────────────────────────── */}
            {Object.keys(categoryStats).length > 0 && (
                <Animated.View entering={FadeInDown.delay(450)} style={styles.categorySection}>
                    <Text style={styles.sectionTitle}>📊 PAR CATÉGORIE</Text>
                    {Object.entries(categoryStats).map(([cat, stats], i) => (
                        <CategoryStatBar
                            key={cat}
                            category={cat}
                            correct={stats.correct}
                            total={stats.total}
                            accentColor={accentColor}
                            delay={500 + i * 60}
                        />
                    ))}
                </Animated.View>
            )}

            {/* ── Conseil personnalisé ─────────────────────────── */}
            {tip && (
                <Animated.View entering={FadeInDown.delay(600)} style={styles.tipBox}>
                    <Text style={styles.tipLabel}>💡 CONSEIL POUR TOI</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                </Animated.View>
            )}

            {/* ── Actions ─────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.delay(650)} style={styles.actions}>
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: accentColor }]}
                    onPress={onPlayAgain}
                    activeOpacity={0.85}
                >
                    <Ionicons name="refresh" size={20} color="#000" />
                    <Text style={styles.primaryBtnText}>Rejouer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onGoHome}
                    activeOpacity={0.85}
                >
                    <Text style={styles.secondaryBtnText}>Retour au menu</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scoreSection: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 20,
    },
    sessionOverLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2.5,
        marginBottom: 24,
    },
    scoreCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    scorePercentage: {
        fontSize: 38,
        fontWeight: '900',
    },
    scoreLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '600',
    },
    correctCount: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 12,
    },
    iqEvolution: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    iqBox: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    iqBoxLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    iqBoxValue: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
    },
    iqArrow: {
        alignItems: 'center',
        gap: 2,
    },
    iqDelta: {
        fontSize: 14,
        fontWeight: '900',
    },
    iqTitleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    iqTitleEmoji: {
        fontSize: 36,
    },
    iqTitleLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    iqTitleText: {
        fontSize: 18,
        fontWeight: '900',
    },
    badgesSection: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
    },
    badgeEmoji: {
        fontSize: 18,
    },
    badgeLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    streakBanner: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.3)',
        alignItems: 'center',
    },
    streakText: {
        color: '#F97316',
        fontWeight: '800',
        fontSize: 13,
    },
    categorySection: {
        marginHorizontal: 20,
        marginBottom: 12,
        gap: 10,
    },
    statBarContainer: {
        gap: 6,
    },
    statBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBarLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    statBarRate: {
        fontSize: 12,
        fontWeight: '800',
    },
    statBarTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    statBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    tipBox: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(76, 201, 240, 0.08)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(76,201,240,0.2)',
        gap: 8,
    },
    tipLabel: {
        color: '#4CC9F0',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    tipText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 20,
    },
    actions: {
        marginHorizontal: 20,
        gap: 10,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        gap: 8,
    },
    primaryBtnText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
    },
    secondaryBtn: {
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    secondaryBtnText: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '700',
        fontSize: 14,
    },
});
