import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpertDribbleResponse } from '@/services/ai/expertAiService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DribbleAnalysisReportProps {
    data: ExpertDribbleResponse;
    onClose: () => void;
}

export const DribbleAnalysisReport: React.FC<DribbleAnalysisReportProps> = ({ data, onClose }) => {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const analysis = data.analysis;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Performance Dribble</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{new Date().toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Score Board */}
                <View style={[styles.scoreBoard, { backgroundColor: '#FF9500' }]}>
                    <Text style={styles.scoreLabel}>TOTAL DRIBBLES</Text>
                    <Text style={styles.scoreValue}>{analysis.dribble_count}</Text>
                    <View style={styles.scoreFooter}>
                        <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.scoreTrend}>+12% vs hier</Text>
                    </View>
                </View>

                {/* Moves Detected */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Mouvements Détectés</Text>
                
                <View style={styles.movesContainer}>
                    {analysis.moves.length > 0 ? (
                        analysis.moves.map((move, index) => (
                            <View key={index} style={[styles.moveBadge, { backgroundColor: colors.card, borderColor: '#FF9500' }]}>
                                <Ionicons name="flash" size={16} color="#FF9500" />
                                <Text style={[styles.moveText, { color: colors.text }]}>{move}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.noMovesText, { color: colors.textSecondary }]}>Continuez à bosser vos crossovers !</Text>
                    )}
                </View>

                {/* Advice Card */}
                <View style={[styles.adviceCard, { backgroundColor: '#FF950010', borderColor: '#FF950030' }]}>
                    <View style={styles.adviceHeader}>
                        <Ionicons name="bulb" size={24} color="#FF9500" />
                        <Text style={[styles.adviceTitle, { color: colors.text }]}>Conseil du Coach AI</Text>
                    </View>
                    <Text style={[styles.adviceBody, { color: colors.textSecondary }]}>
                        {analysis.message} {analysis.dribble_count < 50 ? "Baisse ta posture pour plus de contrôle." : "Excellent rythme, garde le buste droit !"}
                    </Text>
                </View>

                {/* Detailed Stats */}
                <View style={styles.statsGrid}>
                    <StatItem label="Vitesse" value="3.2/s" icon="speedometer-outline" />
                    <StatItem label="Intensité" value="Haute" icon="flame-outline" />
                    <StatItem label="Contrôle" value="85%" icon="checkmark-circle-outline" />
                </View>
            </ScrollView>
        </View>
    );
};

const StatItem = ({ label, value, icon }: { label: string, value: string, icon: any }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    return (
        <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Ionicons name={icon} size={20} color={colors.textSecondary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    scoreBoard: {
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scoreValue: {
        color: '#fff',
        fontSize: 64,
        fontWeight: '900',
    },
    scoreFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    scoreTrend: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    movesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    moveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
    },
    moveText: {
        fontSize: 14,
        fontWeight: '600',
    },
    noMovesText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    adviceCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    adviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    adviceBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statItem: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        fontSize: 10,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
