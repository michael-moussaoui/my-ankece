import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notificationService';
import { AppNotification } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminNotificationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const tintColor = Colors[colorScheme].tint;
    
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<AppNotification['type']>('info');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<AppNotification[]>([]);
    const [fetchingHistory, setFetchingHistory] = useState(true);

    useEffect(() => {
        const unsubscribe = notificationService.subscribeToAllNotifications((data) => {
            setHistory(data);
            setFetchingHistory(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir le titre et le message.');
            return;
        }

        setLoading(true);
        try {
            await notificationService.sendBroadcast(title, message, type);
            Alert.alert('Succès', 'Notification envoyée avec succès !');
            setTitle('');
            setMessage('');
            setType('info');
        } catch (error: any) {
            Alert.alert('Erreur', 'Impossible d\'envoyer la notification : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const types: { value: AppNotification['type']; label: string; icon: any; color: string }[] = [
        { value: 'info', label: 'Info', icon: 'information-circle', color: '#007AFF' },
        { value: 'success', label: 'Succès', icon: 'checkmark-circle', color: '#4CD964' },
        { value: 'warning', label: 'Alerte', icon: 'warning', color: '#FF3B30' },
    ];

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={tintColor} />
                    </TouchableOpacity>
                    <ThemedText type="title">Notifications</ThemedText>
                </View>

                <ThemedText style={styles.sectionTitle}>Envoyer un broadcast</ThemedText>
                
                <View style={styles.form}>
                    <ThemedText style={styles.label}>Titre</ThemedText>
                    <TextInput
                        style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#000', borderColor: colorScheme === 'dark' ? '#444' : '#ddd' }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Nouvelle mise à jour"
                        placeholderTextColor="#888"
                    />

                    <ThemedText style={styles.label}>Message</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colorScheme === 'dark' ? '#fff' : '#000', borderColor: colorScheme === 'dark' ? '#444' : '#ddd' }]}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Détails de la notification..."
                        placeholderTextColor="#888"
                        multiline
                        numberOfLines={4}
                    />

                    <ThemedText style={styles.label}>Type</ThemedText>
                    <View style={styles.typeGrid}>
                        {types.map((t) => (
                            <TouchableOpacity
                                key={t.value}
                                style={[
                                    styles.typeCard,
                                    type === t.value && { borderColor: t.color, backgroundColor: t.color + '10' }
                                ]}
                                onPress={() => setType(t.value)}
                            >
                                <Ionicons name={t.icon} size={24} color={type === t.value ? t.color : '#888'} />
                                <ThemedText style={[styles.typeLabel, type === t.value && { color: t.color }]}>{t.label}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.sendButton, { backgroundColor: tintColor }]} 
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.sendButtonText}>Envoyer à tous les utilisateurs</ThemedText>}
                    </TouchableOpacity>
                </View>

                <View style={styles.historySection}>
                    <ThemedText style={styles.sectionTitle}>Historique des envois</ThemedText>
                    
                    {fetchingHistory ? (
                        <ActivityIndicator color={tintColor} />
                    ) : history.length === 0 ? (
                        <ThemedText style={styles.emptyText}>Aucune notification envoyée.</ThemedText>
                    ) : (
                        history.map((item) => (
                            <View key={item.id} style={[styles.historyCard, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9f9f9' }]}>
                                <View style={styles.historyHeader}>
                                    <ThemedText type="defaultSemiBold" style={styles.historyTitle}>{item.title}</ThemedText>
                                    <View style={[styles.typeBadge, { backgroundColor: types.find(t => t.value === item.type)?.color + '20' }]}>
                                        <ThemedText style={[styles.typeBadgeText, { color: types.find(t => t.value === item.type)?.color }]}>
                                            {types.find(t => t.value === item.type)?.label}
                                        </ThemedText>
                                    </View>
                                </View>
                                
                                <ThemedText style={styles.historyMessage}>{item.message}</ThemedText>
                                
                                <View style={styles.historyFooter}>
                                    <View style={styles.statsRow}>
                                        <View style={styles.stat}>
                                            <Ionicons name="eye-outline" size={14} color="#888" />
                                            <ThemedText style={styles.statText}>{item.readBy.length} Lues</ThemedText>
                                        </View>
                                        <View style={styles.stat}>
                                            <Ionicons name="archive-outline" size={14} color="#888" />
                                            <ThemedText style={styles.statText}>{item.archivedBy.length} Arch.</ThemedText>
                                        </View>
                                        <View style={styles.stat}>
                                            <Ionicons name="trash-outline" size={14} color="#888" />
                                            <ThemedText style={styles.statText}>{item.deletedBy.length} Suppr.</ThemedText>
                                        </View>
                                    </View>
                                    
                                    <ThemedText style={styles.historyDate}>
                                        {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(item.createdAt)}
                                    </ThemedText>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        gap: 15,
    },
    backButton: {
        padding: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    form: {
        gap: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        opacity: 0.8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    typeCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 5,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    sendButton: {
        marginTop: 20,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    historySection: {
        marginTop: 40,
        paddingBottom: 40,
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.5,
        marginTop: 20,
    },
    historyCard: {
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyTitle: {
        fontSize: 16,
        flex: 1,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    historyMessage: {
        fontSize: 14,
        opacity: 0.7,
        lineHeight: 20,
        marginBottom: 12,
    },
    historyFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(150,150,150,0.2)',
        paddingTop: 10,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 15,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#888',
    },
    historyDate: {
        fontSize: 12,
        color: '#888',
    },
});
