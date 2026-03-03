import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlaygroundSuggestion, suggestionService } from '@/services/suggestionService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

export default function AdminSuggestionsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor, accentTextColor } = useAppTheme();
    const tintColor = accentColor;
    
    const [suggestions, setSuggestions] = useState<PlaygroundSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchSuggestions = async () => {
        try {
            const data = await suggestionService.getPendingSuggestions();
            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            Alert.alert('Erreur', 'Impossible de charger les suggestions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        setProcessingId(id);
        try {
            await suggestionService.updateSuggestionStatus(id, status);
            setSuggestions(prev => prev.filter(s => s.id !== id));
            Alert.alert('Succès', status === 'approved' ? 'Terrain approuvé !' : 'Suggestion rejetée.');
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue.');
        } finally {
            setProcessingId(null);
        }
    };

    const renderItem = ({ item }: { item: PlaygroundSuggestion }) => (
        <ThemedView style={styles.card}>
            <Image source={{ uri: item.photoUrl }} style={styles.image} />
            <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.name}</ThemedText>
                <ThemedText style={styles.cardDetail}>GPS: {item.lat.toFixed(5)}, {item.lon.toFixed(5)}</ThemedText>
                <ThemedText style={styles.cardDate}>
                    Posté le: {item.createdAt.toDate().toLocaleDateString('fr-FR')}
                </ThemedText>
                
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.approveButton]} 
                        onPress={() => handleAction(item.id, 'approved')}
                        disabled={!!processingId}
                    >
                        {processingId === item.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <ThemedText style={styles.buttonText}>Approuver</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]} 
                        onPress={() => handleAction(item.id, 'rejected')}
                        disabled={!!processingId}
                    >
                        <Ionicons name="close" size={20} color="#fff" />
                        <ThemedText style={styles.buttonText}>Rejeter</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
                </TouchableOpacity>
                <ThemedText type="subtitle">Suggestions de terrains</ThemedText>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={tintColor} />
                </View>
            ) : (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="map-outline" size={64} color="#888" />
                            <ThemedText style={styles.emptyText}>Aucune suggestion en attente.</ThemedText>
                        </View>
                    }
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    backButton: {
        marginRight: 16,
    },
    listContent: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
        backgroundColor: 'rgba(150,150,150,0.05)',
    },
    image: {
        width: '100%',
        height: 200,
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        marginBottom: 4,
    },
    cardDetail: {
        fontSize: 13,
        opacity: 0.7,
        marginBottom: 2,
    },
    cardDate: {
        fontSize: 12,
        opacity: 0.5,
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    approveButton: {
        backgroundColor: '#34C759',
    },
    rejectButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        opacity: 0.5,
    },
});
