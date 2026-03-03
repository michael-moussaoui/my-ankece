import { IconSymbol } from '@/components/ui/icon-symbol';
import { Post } from '@/types/user';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface FeedItemProps {
    post: Post;
    isVisible: boolean;
    isActive: boolean;
    onLike: (postId: string) => void;
    onDelete?: (postId: string) => void;
    currentUserId: string | undefined;
    height: number;
}

export const FeedItem: React.FC<FeedItemProps> = ({ post, isVisible, isActive, onLike, onDelete, currentUserId, height }) => {
    const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
    const isOwner = currentUserId === post.userId;
    const router = useRouter();
    const SCREEN_HEIGHT = height;
    
    const player = useVideoPlayer(post.videoUri, (player) => {
        player.loop = true;
        player.muted = false;
    });

    useEffect(() => {
        if (isVisible && isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isVisible, isActive, player]);

    const handleNavigateToProfile = () => {
        router.push({
            pathname: '/public-profile/[id]',
            params: { id: post.userId }
        });
    };

    return (
        <View style={[styles.container, { height: SCREEN_HEIGHT }]}>
            <VideoView
                style={styles.video}
                player={player}
                nativeControls={false}
                contentFit="cover"
            />

            {/* Gradient Overlay for better readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />

            {/* Right Action Bar */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => onLike(post.id)}
                    activeOpacity={0.7}
                >
                    <IconSymbol 
                        name={isLiked ? "heart.fill" : "heart"} 
                        size={35} 
                        color={isLiked ? "#FF3B30" : "#FFFFFF"} 
                    />
                    <Text style={styles.actionText}>{post.likes.length}</Text>
                </TouchableOpacity>

                {isOwner && onDelete && (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]} 
                        onPress={() => onDelete(post.id)}
                        activeOpacity={0.7}
                    >
                        <IconSymbol 
                            name="trash" 
                            size={30} 
                            color="#eee" 
                        />
                        <Text style={[styles.actionText, { fontSize: 10 }]}>Supprimer</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.infoContainer}>
                <TouchableOpacity 
                    style={styles.userContainer}
                    onPress={handleNavigateToProfile}
                >
                    <View style={styles.avatarPlaceholder}>
                        <IconSymbol name="person.fill" size={24} color="#666" />
                    </View>
                    <View>
                        <View style={styles.userSubInfo}>
                            <Text style={styles.userName}>{post.userName}</Text>
                            <Text style={styles.separator}>•</Text>
                            <Text style={styles.timeLabel}>
                                {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: fr })}
                            </Text>
                        </View>
                        
                        <View style={styles.locationContainer}>
                            <IconSymbol name="mappin.and.ellipse" size={12} color="#EBEBF5" />
                            <Text style={styles.locationText}>
                                {post.playgroundId ? 'Terrain de basket' : (post.city || 'Basketball')}
                            </Text>
                            {post.playgroundId && post.city && (
                                <>
                                    <Text style={styles.separator}>•</Text>
                                    <Text style={styles.locationText}>{post.city}</Text>
                                </>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
                <Text style={styles.description} numberOfLines={2}>
                    {post.description}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: WINDOW_WIDTH,
        backgroundColor: '#000',
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '40%',
    },
    actionsContainer: {
        position: 'absolute',
        right: 15,
        bottom: 160,
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
        marginBottom: 20,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    infoContainer: {
        position: 'absolute',
        left: 15,
        bottom: 50,
        right: 80,
    },
    userSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    separator: {
        color: '#EBEBF5',
        opacity: 0.6,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        color: '#EBEBF5',
        fontSize: 12,
        opacity: 0.8,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#fff',
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    timeLabel: {
        color: '#EBEBF5',
        fontSize: 14,
        opacity: 0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    deleteButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 15,
        padding: 5,
        marginTop: 10,
    },
});
