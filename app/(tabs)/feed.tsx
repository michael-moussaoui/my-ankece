import { FeedItem } from '@/components/feed/FeedItem';
import { ThemedText } from '@/components/themed-text';
import { UserIconButton } from '@/components/UserIconButton';
import { AGORA_CONFIG } from '@/config/agora';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { DB_COLLECTIONS, Post } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, StatusBar, StyleSheet, TouchableOpacity, View, ViewToken } from 'react-native';



const { height: WINDOW_HEIGHT } = Dimensions.get('window');

/**
 * Screen des vidéos (Feed)
 */
export default function FeedScreen() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const { accentColor, accentTextColor } = useAppTheme();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
    const isFocused = useIsFocused();
    const tabBarHeight = useBottomTabBarHeight();
    const headerHeight = 60; // Fallback or useHeaderHeight
    const [SCREEN_HEIGHT, setScreenHeight] = useState(WINDOW_HEIGHT - tabBarHeight - 64);
    
    type FilterType = 'all' | 'city' | 'following';
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

    // More accurate height on layout
    const onLayout = (event: any) => {
        const { height } = event.nativeEvent.layout;
        setScreenHeight(height);
    };

    const [selectedLive, setSelectedLive] = useState<Post | null>(null);

    const fetchPosts = async () => {
        try {
            const q = query(collection(db, DB_COLLECTIONS.POSTS), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            const fetchedPosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Post)).filter(p => !p.isLive || p.createdAt > oneHourAgo);
            
            setPosts(fetchedPosts);
            if (fetchedPosts.length > 0 && !visiblePostId) {
                setVisiblePostId(fetchedPosts[0].id);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchPosts();
        }
    }, [isFocused]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPosts();
        setRefreshing(false);
    };

    const handleLike = async (postId: string) => {
        if (!user) return;

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const isLiked = post.likes.includes(user.uid);
        const postRef = doc(db, DB_COLLECTIONS.POSTS, postId);

        // Optimistic UI update
        const updatedPosts = [...posts];
        if (isLiked) {
            updatedPosts[postIndex].likes = post.likes.filter(id => id !== user.uid);
        } else {
            updatedPosts[postIndex].likes = [...post.likes, user.uid];
        }
        setPosts(updatedPosts);

        try {
            await updateDoc(postRef, {
                likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
        } catch (error) {
            console.error('Error liking post:', error);
            // Revert on error
            fetchPosts();
        }
    };

    const handleDelete = async (postId: string) => {
        Alert.alert(
            'Supprimer la vidéo',
            'Êtes-vous sûr de vouloir supprimer cette vidéo définitivement ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Local update for immediate feedback
                            setPosts(prev => prev.filter(p => p.id !== postId));

                            // Firestore update
                            const { deleteDoc, doc } = await import('firebase/firestore');
                            const postRef = doc(db, DB_COLLECTIONS.POSTS, postId);
                            await deleteDoc(postRef);
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer la vidéo.');
                            fetchPosts(); // Reload on error
                        }
                    }
                }
            ]
        );
    };

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setVisiblePostId(viewableItems[0].item.id);
        }
    }).current;

    const renderItem = ({ item }: { item: Post }) => (
        <FeedItem
            post={item}
            isVisible={item.id === visiblePostId}
            isActive={isFocused}
            onLike={handleLike}
            onDelete={handleDelete}
            currentUserId={user?.uid}
            height={SCREEN_HEIGHT}
        />
    );

    const LiveHeader = () => {
        const lives = posts.filter(p => p.isLive);
        if (lives.length === 0) return null;

        return (
            <View style={styles.liveHeader}>
                <ThemedText style={styles.liveHeaderText}>En Direct 🔴</ThemedText>
                <FlatList
                    data={lives}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => 'live-' + item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.liveAvatar}
                            onPress={() => setSelectedLive(item)}
                        >
                            <View style={styles.liveRing}>
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={24} color="#fff" />
                                </View>
                            </View>
                            <ThemedText style={styles.liveUserText} numberOfLines={1}>{item.userName.split(' ')[0]}</ThemedText>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 15 }}
                />
            </View>
        );
    };

    const LiveViewer = () => {
        const [joined, setJoined] = useState(false);
        const [remoteUid, setRemoteUid] = useState<number | null>(null);
        const [agoraAvailable, setAgoraAvailable] = useState(true);
        const engineRef = useRef<any | null>(null);
        const SurfaceViewRef = useRef<any>(null);

        useEffect(() => {
            if (selectedLive) {
                const init = async () => {
                    try {
                        const Agora = require('react-native-agora');
                        const { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } = Agora;
                        SurfaceViewRef.current = Agora.RtcSurfaceView;

                        engineRef.current = createAgoraRtcEngine();
                        engineRef.current.initialize({ appId: AGORA_CONFIG.appId });
                        
                        engineRef.current.registerEventHandler({
                            onJoinChannelSuccess: () => setJoined(true),
                            onUserJoined: (_connection: any, uid: any) => {
                              console.log('Remote user joined:', uid);
                              setRemoteUid(uid);
                            },
                            onUserOffline: (_connection: any, uid: any) => {
                              console.log('Remote user offline:', uid);
                              setRemoteUid(null);
                            },
                            onLeaveChannel: () => {
                              setJoined(false);
                              setRemoteUid(null);
                            },
                        });

                        engineRef.current.enableVideo();
                        engineRef.current.joinChannel(AGORA_CONFIG.token || '', selectedLive.playgroundId!, 0, {
                            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
                            clientRoleType: ClientRoleType.ClientRoleAudience,
                        });
                    } catch (e) {
                        console.warn('Agora Native Module not available in viewer:', e);
                        setAgoraAvailable(false);
                    }
                };
                init();
            }
            return () => {
                engineRef.current?.leaveChannel();
                engineRef.current?.release();
            };
        }, [selectedLive]);

        if (!selectedLive) return null;

        const RtcSurfaceView = SurfaceViewRef.current;

        return (
            <Modal
                visible={!!selectedLive}
                animationType="fade"
                transparent={false}
                onRequestClose={() => setSelectedLive(null)}
            >
                <View style={styles.viewerContainer}>
                    {!agoraAvailable ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="warning" size={48} color="#FF9500" />
                        <ThemedText style={{marginTop: 15, textAlign: 'center', paddingHorizontal: 30}}>
                          Le streaming en direct n'est pas disponible dans Expo Go. Veuillez utiliser un build de développement.
                        </ThemedText>
                        <TouchableOpacity 
                          style={{marginTop: 20, backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20}}
                          onPress={() => setSelectedLive(null)}
                        >
                          <ThemedText>Fermer</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (remoteUid && RtcSurfaceView) ? (
                      <RtcSurfaceView
                        style={styles.fullVideo}
                        canvas={{ uid: remoteUid }}
                      />
                    ) : (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF3B30" />
                        <ThemedText style={{marginTop: 10}}>
                          {joined ? "Attente du flux vidéo..." : "Connexion au flux direct..."}
                        </ThemedText>
                      </View>
                    )}
                    
                    <View style={styles.viewerHeader}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setSelectedLive(null)}
                        >
                            <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.viewerUserInfo}
                            onPress={() => {
                                setSelectedLive(null);
                                router.push({
                                    pathname: '/public-profile/[id]',
                                    params: { id: selectedLive.userId }
                                });
                            }}
                        >
                            <View style={styles.viewerAvatar}>
                                <Ionicons name="person" size={20} color="#fff" />
                            </View>
                            <View>
                                <ThemedText style={styles.viewerUserName}>{selectedLive.userName}</ThemedText>
                                <View style={styles.liveIndicator}>
                                    <View style={styles.liveDot} />
                                    <ThemedText style={styles.liveText}>EN DIRECT</ThemedText>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.viewerFooter}>
                        <ThemedText style={styles.viewerDescription}>{selectedLive.description}</ThemedText>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ThemedText>Chargement du feed...</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container} onLayout={onLayout}>
            <StatusBar barStyle="light-content" />
            
            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <TouchableOpacity 
                    style={[styles.filterChip, selectedFilter === 'all' && { backgroundColor: accentColor }]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <ThemedText style={[styles.filterText, selectedFilter === 'all' && { color: accentTextColor }]}>Explorer</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.filterChip, selectedFilter === 'city' && { backgroundColor: accentColor }]}
                    onPress={() => setSelectedFilter('city')}
                >
                    <ThemedText style={[styles.filterText, selectedFilter === 'city' && { color: accentTextColor }]}>Ma Ville</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.filterChip, selectedFilter === 'following' && { backgroundColor: accentColor }]}
                    onPress={() => setSelectedFilter('following')}
                >
                    <ThemedText style={[styles.filterText, selectedFilter === 'following' && { color: accentTextColor }]}>Abonnements</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={posts.filter(p => !p.isLive).filter(p => {
                    if (selectedFilter === 'all') return true;
                    if (selectedFilter === 'city') return p.city === profile?.city;
                    if (selectedFilter === 'following') return profile?.following?.includes(p.userId);
                    return true;
                })}
                renderItem={renderItem}
                ListHeaderComponent={LiveHeader}
                keyExtractor={item => item.id}
                pagingEnabled
                refreshing={refreshing}
                onRefresh={handleRefresh}
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={5}
                removeClippedSubviews
            />

            {/* FAB Add Post */}
            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: accentColor }]} 
                onPress={() => router.push('/add-post')}
            >
                <Ionicons name="add" size={32} color={accentTextColor} />
            </TouchableOpacity>

            {/* Top User Icon */}
            <View style={styles.topUserButton}>
                <UserIconButton color="#fff" />
            </View>

            <LiveViewer />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullVideo: {
        width: '100%',
        height: '100%',
    },
    viewerHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 15,
    },
    closeButton: {
        padding: 5,
    },
    viewerUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    viewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    viewerUserName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF3B30',
    },
    liveText: {
        color: '#FF3B30',
        fontSize: 10,
        fontWeight: 'bold',
    },
    viewerFooter: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    viewerDescription: {
        color: '#fff',
        fontSize: 15,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    liveHeader: {
        paddingVertical: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
    },
    liveHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 15,
        marginBottom: 10,
        color: '#FF3B30',
    },
    liveAvatar: {
        alignItems: 'center',
        marginRight: 15,
        width: 70,
    },
    liveRing: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#FF3B30',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveUserText: {
        fontSize: 11,
        color: '#fff',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 100,
    },
    topUserButton: {
        position: 'absolute',
        top: 50,
        right: 15,
        zIndex: 100,
    },
    filterBar: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 80,
        flexDirection: 'row',
        zIndex: 101,
        gap: 10,
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
});
