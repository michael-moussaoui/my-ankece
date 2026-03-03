import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpertSessionResponse } from '@/services/ai/expertAiService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SessionAnalysisReportProps {
    data: ExpertSessionResponse;
    onClose: () => void;
}

export const SessionAnalysisReport: React.FC<SessionAnalysisReportProps> = ({ data, onClose }) => {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const analysis = data.analysis;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Shoot Session</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{new Date().toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Accuracy Card */}
                <View style={[styles.mainCard, { backgroundColor: '#007AFF' }]}>
                    <Text style={styles.mainLabel}>PÉCISIF À</Text>
                    <Text style={styles.mainValue}>{analysis.accuracy}%</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>{analysis.makes}</Text>
                            <Text style={styles.statLabel}>MARK</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>{analysis.total_shots}</Text>
                            <Text style={styles.statLabel}>SHOTS</Text>
                        </View>
                    </View>
                </View>

                {/* Composition */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Répartition des Paniers</Text>
                <View style={styles.grid}>
                    <StatBox label="Lancers" value={analysis.composition.free_throws} icon="pin-outline" color="#34C759" />
                    <StatBox label="3 Points" value={analysis.composition.three_points} icon="flash-outline" color="#FF9500" />
                    <StatBox label="Mi-distance" value={analysis.composition.mid_range} icon="basketball-outline" color="#5856D6" />
                </View>

                {/* Advice Card */}
                <View style={[styles.adviceCard, { backgroundColor: '#007AFF10', borderColor: '#007AFF30' }]}>
                    <View style={styles.adviceHeader}>
                        <Ionicons name="analytics" size={24} color="#007AFF" />
                        <Text style={[styles.adviceTitle, { color: colors.text }]}>Analyse de Session</Text>
                    </View>
                    <Text style={[styles.adviceBody, { color: colors.textSecondary }]}>
                        {analysis.message} {analysis.accuracy > 70 ? "Impressionnant ! Ta régularité est excellente." : "Travaille ton arc pour plus de réussite."}
                    </Text>
                </View>

                <TouchableOpacity style={[styles.saveButton, { backgroundColor: accentColor }]} onPress={onClose}>
                    <Text style={styles.saveButtonText}>Enregistrer ma Session</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const StatBox = ({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    return (
        <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <View style={[styles.iconUnder, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.valText, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.labText, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
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
        gap: 24,
    },
    mainCard: {
        padding: 30,
        borderRadius: 28,
        alignItems: 'center',
    },
    mainLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    mainValue: {
        color: '#fff',
        fontSize: 72,
        fontWeight: '900',
        marginVertical: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 20,
    },
    statBox: {
        alignItems: 'center',
    },
    statNum: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 6,
    },
    iconUnder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    valText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    labText: {
        fontSize: 10,
        fontWeight: '500',
    },
    adviceCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    adviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    adviceBody: {
        fontSize: 14,
        lineHeight: 22,
    },
    saveButton: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
