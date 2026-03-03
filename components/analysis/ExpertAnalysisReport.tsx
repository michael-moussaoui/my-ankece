import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpertAnalysisResponse } from '@/services/ai/expertAiService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExpertAnalysisReportProps {
    data: ExpertAnalysisResponse;
    onClose: () => void;
}

export const ExpertAnalysisReport: React.FC<ExpertAnalysisReportProps> = ({ data, onClose }) => {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const analysis = data.analysis;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Rapport d'Expert IA</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Score Card / Metrics */}
                <View style={[styles.metricsGrid, { backgroundColor: colors.card }]}>
                    <MetricItem 
                        icon="body-outline" 
                        label="Coudes" 
                        value={`${Math.round(analysis.max_elbow_angle)}°`} 
                        color="#007AFF" 
                    />
                    <MetricItem 
                        icon="man-outline" 
                        label="Buste" 
                        value={`${Math.round(analysis.avg_torso_lean)}°`} 
                        color="#FF9500" 
                    />
                    <MetricItem 
                        icon="analytics-outline" 
                        label="Séquence" 
                        value={`${analysis.analyzed_frames} img`} 
                        color="#34C759" 
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Conseils de Coaching</Text>
                
                {analysis.coaching_report.map((advice, index) => (
                    <View key={index} style={[styles.adviceCard, { backgroundColor: accentColor + '10', borderColor: accentColor + '30' }]}>
                        <Ionicons name="bulb" size={24} color={accentColor} style={styles.adviceIcon} />
                        <Text style={[styles.adviceText, { color: colors.text }]}>{advice}</Text>
                    </View>
                ))}

                <View style={styles.footerInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Analyse basée sur {analysis.frame_count} images extraites de votre vidéo.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const MetricItem = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    
    return (
        <View style={styles.metricItem}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        gap: 20,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    metricItem: {
        alignItems: 'center',
        gap: 4,
    },
    iconBox: {
        padding: 10,
        borderRadius: 12,
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 10,
    },
    adviceCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        gap: 12,
    },
    adviceIcon: {
        flexShrink: 0,
    },
    adviceText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 12,
        fontStyle: 'italic',
    }
});
