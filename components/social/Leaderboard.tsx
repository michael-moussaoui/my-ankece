import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';

interface LeaderboardEntry {
    id: string;
    userName: string;
    score: number;
    rank: number;
    avatarUrl?: string;
    isCurrentUser?: boolean;
}

interface LeaderboardProps {
    data: LeaderboardEntry[];
    title: string;
    metricLabel: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ data, title, metricLabel }) => {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const renderItem = ({ item }: { item: LeaderboardEntry }) => (
        <View style={[
            styles.itemContainer, 
            { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
            item.isCurrentUser && { borderColor: accentColor, borderWidth: 1 }
        ]}>
            <View style={styles.rankContainer}>
                {item.rank <= 3 ? (
                    <Ionicons 
                        name="trophy" 
                        size={20} 
                        color={item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32'} 
                    />
                ) : (
                    <ThemedText style={styles.rankText}>{item.rank}</ThemedText>
                )}
            </View>
            
            <View style={styles.avatarContainer}>
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: accentColor + '30' }]}>
                        <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>
                            {item.userName.charAt(0)}
                        </ThemedText>
                    </View>
                )}
            </View>

            <View style={styles.nameContainer}>
                <ThemedText type="defaultSemiBold" style={styles.name}>{item.userName}</ThemedText>
                {item.isCurrentUser && <ThemedText style={styles.youText}>(Toi)</ThemedText>}
            </View>

            <View style={styles.scoreContainer}>
                <ThemedText type="defaultSemiBold" style={[styles.score, { color: accentColor }]}>
                    {item.score}
                </ThemedText>
                <ThemedText style={styles.metricLabel}>{metricLabel}</ThemedText>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>{title}</ThemedText>
                <Ionicons name="stats-chart" size={24} color={accentColor} />
            </View>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
    },
    list: {
        gap: 12,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 15,
    },
    rankContainer: {
        width: 30,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        opacity: 0.6,
        fontWeight: 'bold',
    },
    avatarContainer: {
        marginHorizontal: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
    },
    youText: {
        fontSize: 12,
        marginLeft: 8,
        opacity: 0.6,
    },
    scoreContainer: {
        alignItems: 'flex-end',
    },
    score: {
        fontSize: 18,
    },
    metricLabel: {
        fontSize: 10,
        opacity: 0.6,
        textTransform: 'uppercase',
    }
});
