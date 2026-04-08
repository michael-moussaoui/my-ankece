import { AnkeceLogo } from '@/components/AnkeceLogo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserIconButton } from '@/components/UserIconButton';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { chatService } from '@/services/chatService';
import { Conversation } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function MessagesScreen() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor } = useAppTheme();
    const tintColor = accentColor;
    const cardBackground = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
    const textSecondary = colorScheme === 'dark' ? '#8e8e93' : '#666';

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
            {/* Hero Header */}
            <Animated.View entering={FadeInDown.duration(1000)} style={styles.heroContainer}>
                <Image
                    source={require('../../assets/images/messages_hero_bg.png')}
                    style={styles.heroImage}
                    contentFit="cover"
                />
                <View style={styles.heroOverlay} />

                {/* Logo top-left */}
                <Animated.View
                    entering={FadeInDown.delay(300).duration(800)}
                    style={[styles.heroLogoTopLeft, { top: insets.top + 12 }]}
                >
                    <AnkeceLogo style={styles.heroLogo} />
                </Animated.View>

                {/* Title and Icon top-right */}
                <Animated.View
                    entering={FadeInDown.delay(700).duration(800)}
                    style={[styles.headerIconsContainer, { top: insets.top + 12 }]}
                >
                    <UserIconButton color="#fff" size={32} />
                </Animated.View>

                {/* Hero Center Content */}
                <Animated.View 
                    entering={FadeInDown.delay(500).duration(800)}
                    style={styles.heroTitleContainer}
                >
                    <View style={styles.heroTitleRow}>
                        <Ionicons name="chatbubbles" size={32} color={tintColor} style={styles.heroIcon} />
                        <ThemedText style={styles.heroTitle}>Messages</ThemedText>
                    </View>
                    <ThemedText style={styles.heroSubtitle}>Vos discussions & coaching</ThemedText>
                </Animated.View>
            </Animated.View>

            {/* Wave transition */}
            <Svg
                viewBox="0 0 1440 80"
                style={styles.transitionWave}
                preserveAspectRatio="none"
            >
                <Path
                    d="M0,10 C360,80 1080,0 1440,60 L1440,80 L0,80 Z"
                    fill={colorScheme === 'dark' ? '#151718' : '#fff'}
                />
            </Svg>

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={tintColor} />
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        renderItem={renderConversationItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={64} color={textSecondary} />
                                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                                    Aucune discussion pour le moment.
                                </ThemedText>
                            </View>
                        }
                    />
                )}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroContainer: {
        width: '100%',
        height: '50%',
        overflow: 'hidden',
        position: 'relative',
    },
    transitionWave: {
        height: 60,
        width: '100%',
        marginTop: -60,
        backgroundColor: 'transparent',
        zIndex: 5,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    heroLogoTopLeft: {
        position: 'absolute',
        left: 0,
        zIndex: 10,
    },
    heroLogo: {
        width: 100,
        height: 80,
    },
    headerIconsContainer: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
    },
    heroTitleContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
    },
    heroTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    heroIcon: {
        marginRight: 10,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        // textTransform: 'uppercase',
        letterSpacing: 2,
        lineHeight: 46,
        paddingTop: 10,
        includeFontPadding: false,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        top: -10,
        marginTop: 2,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    listContent: {
        padding: 20,
        paddingTop: 30,
    },
    conversationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#fff',
    },
    content: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    time: {
        fontSize: 12,
    },
    lastMessage: {
        fontSize: 14,
    },
    unreadMessage: {
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
});
