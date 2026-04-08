import { AnkeceLogo } from '@/components/AnkeceLogo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllPhotoReports } from '@/services/reportService';
import { adminService } from '@/services/adminService';
import { suggestionService } from '@/services/suggestionService';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor } = useAppTheme();
    const tintColor = accentColor;
    const [reportCount, setReportCount] = useState<number>(0);
    const [userCount, setUserCount] = useState<number>(0);
    const [suggestionCount, setSuggestionCount] = useState<number>(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch reports
                try {
                    const reports = await getAllPhotoReports();
                    setReportCount(reports.length);
                } catch (e) {
                    console.warn('Permissions: Reports restricted');
                }

                // Fetch users
                try {
                    const users = await adminService.getAllUsers();
                    setUserCount(users.length);
                } catch (e) {
                    console.warn('Permissions: Users restricted');
                }

                // Fetch suggestions
                try {
                    const suggestions = await suggestionService.getPendingSuggestions();
                    setSuggestionCount(suggestions.length);
                } catch (e) {
                    console.warn('Permissions: Suggestions restricted');
                }
            } catch (error) {
                console.error('General error fetching admin stats:', error);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Utilisateurs', value: userCount.toString(), icon: 'people-outline', route: '/(admin)/users' as any },
        { label: 'Suggestions', value: suggestionCount.toString(), icon: 'map-outline', route: '/(admin)/suggestions' as any },
        { label: 'Signalements', value: reportCount.toString(), icon: 'flag-outline', route: '/(admin)/reports' as any },
    ];

    const menuItems = [
        { 
            title: 'Gérer les utilisateurs', 
            subtitle: 'Voir, modifier ou supprimer des utilisateurs',
            icon: 'people',
            route: '/(admin)/users' as const
        },
        { 
            title: 'Suggestions de terrains', 
            subtitle: 'Valider les nouveaux terrains proposés',
            icon: 'map',
            route: '/(admin)/suggestions' as const
        },
        { 
            title: 'Signalements', 
            subtitle: 'Gérer les photos signalées',
            icon: 'flag',
            route: '/(admin)/reports' as const
        },
        { 
            title: 'Notifications', 
            subtitle: 'Envoyer des messages à tous les utilisateurs',
            icon: 'notifications',
            route: '/(admin)/notifications' as const
        },
        { 
            title: 'Gestion des Coachs', 
            subtitle: 'Valider les profils de coachs en attente',
            icon: 'school',
            route: '/(admin)/coaches' as const
        },
        { 
            title: 'Gestion de l\'Académie', 
            subtitle: 'Gérer les programmes et drills de la boutique',
            icon: 'basket',
            route: '/(admin)/academy' as any
        },
        { 
            title: 'Système Force Admin', 
            subtitle: 'FORCER mon profil en "admin" (Debug)',
            icon: 'shield-checkmark',
            action: async () => {
                if (auth.currentUser) {
                    try {
                        await updateDoc(doc(db, 'users', auth.currentUser.uid), { role: 'admin' });
                        Alert.alert("Succès", "Votre profil est désormais ADMIN. Redémarrez l'app !");
                    } catch (e: any) {
                        Alert.alert("Erreur", "Impossible de modifier votre profil. Vérifiez vos règles Firestore.");
                    }
                } else {
                    Alert.alert("Erreur", "Vous n'êtes pas connecté.");
                }
            }
        },
        { 
            title: 'Paramètres système', 
            subtitle: 'Configuration globale de l\'application',
            icon: 'settings',
            route: '/(tabs)' as any // Placeholder
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    header: () => (
                        <ThemedView style={{ 
                            height: 120 + insets.top, 
                            paddingTop: insets.top,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: 'rgba(150, 150, 150, 0.2)',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <View style={{ marginTop: 20 }}>
                                <AnkeceLogo
                                    style={styles.headerLogoImage}
                                />
                            </View>
                        </ThemedView>
                    ),
                }}
            />
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={[styles.statsGrid, { marginTop: 10 }]}>
                    {stats.map((stat, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.statCard}
                            onPress={() => stat.route && router.push(stat.route)}
                        >
                            <Ionicons name={stat.icon as any} size={24} color={tintColor} />
                            <ThemedText type="defaultSemiBold" style={styles.statValue}>{stat.value}</ThemedText>
                            <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.menuItem}
                            onPress={() => item.action ? item.action() : router.push(item.route)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
                                <Ionicons name={item.icon as any} size={24} color={tintColor} />
                            </View>
                            <View style={styles.menuText}>
                                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                                <ThemedText style={styles.menuSubtitle}>{item.subtitle}</ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <ThemedText style={{ color: tintColor }}>Retour à l'application</ThemedText>
                </TouchableOpacity>
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
    },
    headerLogoImage: {
        width: 300,
        height: 120,
        transform: [{ scale: 1.4 }],
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    statValue: {
        fontSize: 20,
        marginTop: 10,
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.6,
    },
    menuSection: {
        marginBottom: 30,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
    },
    menuSubtitle: {
        fontSize: 13,
        opacity: 0.6,
        marginTop: 2,
    },
    backButton: {
        alignItems: 'center',
        padding: 15,
    }
});
