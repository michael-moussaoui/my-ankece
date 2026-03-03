import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PRO_MOVES, ProMove } from '@/constants/pro-moves';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProMimicSelectionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const renderItem = ({ item }: { item: ProMove }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/pro-mimic/${item.id}`)}
            activeOpacity={0.9}
        >
            <Image 
                source={{ uri: item.thumbnail }} 
                style={styles.thumbnail} 
                contentFit="cover" 
            />
            <View style={styles.cardContent}>
                <ThemedText type="subtitle" style={styles.playerName}>{item.player}</ThemedText>
                <ThemedText style={styles.moveName}>{item.moveName}</ThemedText>
                <View style={styles.ctaRow}>
                    <ThemedText style={styles.ctaText}>S'entraîner</ThemedText>
                    <IconSymbol name="chevron.right" size={16} color="#fff" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={28} color="#fff" /> 
                </TouchableOpacity>
                <ThemedText type="title">Pro Mimic</ThemedText>
            </View>
            <ThemedText style={styles.subtitle}>
                Sélectionnez un joueur pro et imitez sa mécanique avec l'IA.
            </ThemedText>
            
            <FlatList
                data={PRO_MOVES}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    backButton: {
        padding: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        marginBottom: 24,
    },
    listContent: {
        paddingBottom: 40,
        gap: 16,
    },
    card: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#333',
    },
    thumbnail: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    playerName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    moveName: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 4,
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 4,
    },
    ctaText: {
        color: '#fff',
        fontWeight: '600',
    }
});
