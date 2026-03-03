import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserIconButton } from '@/components/UserIconButton';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { chatService } from '@/services/chatService';
import { Conversation } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor } = useAppTheme();
    const tintColor = accentColor;
    const cardBackground = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDeleteConversation = (conversationId: string) => {
        Alert.alert(
            "Supprimer la conversation",
            "Voulez-vous vraiment supprimer cette conversation et tous ses messages ?",
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Supprimer", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await chatService.deleteConversation(conversationId);
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer la conversation.");
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (!user) return;

        const unsubscribe = chatService.subscribeToConversations(user.uid, (data) => {
            setConversations(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const renderConversationItem = ({ item }: { item: Conversation }) => {
        const otherUserId = item.participants.find(id => id !== user?.uid);
        if (!otherUserId) return null;

        const profile = item.participantProfiles?.[otherUserId];
        const unreadCount = item.unreadCount?.[user?.uid || ''] || 0;

        return (
            <TouchableOpacity 
                style={[styles.conversationCard, { backgroundColor: cardBackground }]}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
                onLongPress={() => handleDeleteConversation(item.id)}
                delayLongPress={500}
            >
                <View style={styles.avatarContainer}>
                    {profile?.avatarUrl ? (
                        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
                            <Ionicons name="person" size={24} color={tintColor} />
                        </View>
                    )}
                    {unreadCount > 0 && <View style={[styles.unreadBadge, { backgroundColor: tintColor }]} />}
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <ThemedText type="defaultSemiBold" numberOfLines={1}>
                            {profile?.displayName || 'Utilisateur Anonyme'}
                        </ThemedText>
                        <ThemedText style={styles.time}>
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </ThemedText>
                    </View>
                    
                    <ThemedText 
                        style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} 
                        numberOfLines={1}
                    >
                        {item.lastMessage?.text || 'Commencez la discussion...'}
                    </ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={tintColor} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.appHeader}>
                    <ThemedText type="title">Messages</ThemedText>
                    <UserIconButton color={tintColor} size={32} />
                </View>

                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                            <ThemedText style={styles.emptyText}>
                                Aucune discussion pour le moment.
                            </ThemedText>
                        </View>
                    }
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    listContent: {
        padding: 16,
    },
    conversationCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
    },
    content: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: '#8e8e93',
    },
    lastMessage: {
        fontSize: 14,
        color: '#8e8e93',
    },
    unreadMessage: {
        color: '#000',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#8e8e93',
        fontSize: 16,
    },
});
