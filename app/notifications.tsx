import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notificationService';
import { AppNotification } from '@/types/user';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor } = useAppTheme();
    const tintColor = accentColor;
    
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const unsubscribe = notificationService.subscribeToUserNotifications(user.uid, (data) => {
            setNotifications(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredNotifications = notifications.filter(n => {
        if (!user) return false;
        const archived = n.archivedBy.includes(user.uid);
        return showArchived ? archived : !archived;
    });

    const handleMarkAsRead = async (id: string) => {
        if (!user) return;
        await notificationService.markAsRead(id, user.uid);
    };

    const handleArchive = async (id: string) => {
        if (!user) return;
        await notificationService.archiveNotification(id, user.uid);
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette notification ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'Supprimer', 
                    style: 'destructive',
                    onPress: () => notificationService.deleteNotification(id, user.uid)
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        const isRead = user ? item.readBy.includes(user.uid) : false;
        const isArchived = user ? item.archivedBy.includes(user.uid) : false;

        const getTypeColor = () => {
            switch (item.type) {
                case 'success': return '#4CD964';
                case 'warning': return '#FF3B30';
                default: return tintColor;
            }
        };

        return (
            <TouchableOpacity 
                style={[
                    styles.notificationCard, 
                    { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9f9f9' },
                    isRead && { opacity: 0.7 }
                ]}
                onPress={() => {
                    handleMarkAsRead(item.id);
                    if (item.data?.screen) {
                        router.push({
                            pathname: item.data.screen as any,
                            params: item.data.params
                        });
                    }
                }}
            >
                <View style={[styles.typeIndicator, { backgroundColor: getTypeColor() }]} />
                
                <View style={styles.content}>
                    <View style={styles.itemHeader}>
                        <ThemedText type="defaultSemiBold" style={styles.title}>{item.title}</ThemedText>
                        <ThemedText style={styles.date}>
                            {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(item.createdAt)}
                        </ThemedText>
                    </View>
                    <ThemedText style={styles.message}>{item.message}</ThemedText>
                    
                    <View style={styles.actions}>
                        {!isArchived && (
                            <TouchableOpacity style={styles.actionButton} onPress={() => handleArchive(item.id)}>
                                <IconSymbol name="archivebox.fill" size={18} color="#888" />
                                <ThemedText style={styles.actionLabel}>Archiver</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                            <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
                            <ThemedText style={[styles.actionLabel, { color: '#FF3B30' }]}>Supprimer</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {!isRead && <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color={tintColor} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.right" size={24} color={tintColor} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                    <ThemedText type="title">Notifications</ThemedText>
                </View>
                
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, !showArchived && { borderBottomColor: tintColor }]} 
                        onPress={() => setShowArchived(false)}
                    >
                        <ThemedText style={[styles.tabText, !showArchived && { color: tintColor }]}>Actives</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, showArchived && { borderBottomColor: tintColor }]} 
                        onPress={() => setShowArchived(true)}
                    >
                        <ThemedText style={[styles.tabText, showArchived && { color: tintColor }]}>Archives</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {filteredNotifications.length === 0 ? (
                <View style={styles.empty}>
                    <IconSymbol name={showArchived ? "archivebox.fill" : "bell.fill"} size={60} color="#888" />
                    <ThemedText style={styles.emptyText}>
                        {showArchived ? "Aucune notification archivée." : "Aucune notification active."}
                    </ThemedText>
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 15,
        marginBottom: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#8883',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    backButton: {
        padding: 5,
    },
    list: {
        padding: 15,
        gap: 15,
    },
    notificationCard: {
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden',
    },
    typeIndicator: {
        width: 4,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    content: {
        flex: 1,
        paddingLeft: 10,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    title: {
        fontSize: 16,
    },
    date: {
        fontSize: 11,
        opacity: 0.5,
    },
    message: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        position: 'absolute',
        top: 15,
        right: 15,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingBottom: 100,
    },
    emptyText: {
        opacity: 0.5,
        fontSize: 16,
    },
});
