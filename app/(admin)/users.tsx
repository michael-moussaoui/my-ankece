import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { adminService } from '@/services/adminService';
import { UserProfile } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const colorScheme = useColorScheme();
    const tintColor = Colors[colorScheme].tint;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const allUsers = await adminService.getAllUsers();
            setUsers(allUsers);
            setFilteredUsers(allUsers);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de récupérer les utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user => 
                user.email.toLowerCase().includes(query) || 
                user.displayName.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const handleUpdatePlan = async (userId: string, plan: UserProfile['plan']) => {
        try {
            await adminService.updateUserPlan(userId, plan);
            Alert.alert('Succès', 'Plan mis à jour avec succès');
            setModalVisible(false);
            fetchUsers(); // Refresh list
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le plan');
        }
    };

    const handleUpdateRole = async (userId: string, role: UserProfile['role']) => {
        try {
            await adminService.updateUserRole(userId, role);
            Alert.alert('Succès', 'Rôle mis à jour avec succès');
            setModalVisible(false);
            fetchUsers(); // Refresh list
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le rôle');
        }
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity 
            style={styles.userCard}
            onPress={() => {
                setSelectedUser(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.userInfo}>
                <ThemedText type="defaultSemiBold">{item.displayName}</ThemedText>
                <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
            </View>
            <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: item.plan === 'elite-pro' ? '#4CAF50' : '#888' }]}>
                    <ThemedText style={styles.badgeText}>{item.plan}</ThemedText>
                </View>
                {item.role === 'admin' && (
                    <View style={[styles.badge, { backgroundColor: '#FF9800', marginLeft: 4 }]}>
                        <ThemedText style={styles.badgeText}>ADMIN</ThemedText>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: Colors[colorScheme].text }]}
                    placeholder="Rechercher un utilisateur..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={tintColor} />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <ThemedText>Aucun utilisateur trouvé</ThemedText>
                        </View>
                    }
                    onRefresh={fetchUsers}
                    refreshing={loading}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="title">Détails Utilisateur</ThemedText>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
                            </TouchableOpacity>
                        </View>

                        {selectedUser && (
                            <View style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <ThemedText style={styles.detailLabel}>Email:</ThemedText>
                                    <ThemedText>{selectedUser.email}</ThemedText>
                                </View>
                                <View style={styles.detailRow}>
                                    <ThemedText style={styles.detailLabel}>Rôle actuel:</ThemedText>
                                    <ThemedText>{selectedUser.role}</ThemedText>
                                </View>
                                <View style={styles.detailRow}>
                                    <ThemedText style={styles.detailLabel}>Plan actuel:</ThemedText>
                                    <ThemedText>{selectedUser.plan}</ThemedText>
                                </View>

                                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Changer le Plan</ThemedText>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { borderColor: tintColor, borderWidth: 1 }]}
                                        onPress={() => handleUpdatePlan(selectedUser.id, 'essential')}
                                    >
                                        <ThemedText style={{ color: tintColor }}>Passer à Essentiel</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: tintColor }]}
                                        onPress={() => handleUpdatePlan(selectedUser.id, 'elite-pro')}
                                    >
                                        <ThemedText style={{ color: '#fff' }}>Passer à Elite Pro</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Rôle</ThemedText>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { borderColor: '#FF5252', borderWidth: 1 }]}
                                        onPress={() => handleUpdateRole(selectedUser.id, selectedUser.role === 'admin' ? 'user' : 'admin')}
                                    >
                                        <ThemedText style={{ color: '#FF5252' }}>
                                            {selectedUser.role === 'admin' ? 'Retirer Admin' : 'Nommer Admin'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        margin: 16,
        borderRadius: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        borderRadius: 12,
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
    },
    userEmail: {
        fontSize: 13,
        opacity: 0.6,
        marginTop: 2,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalBody: {
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    },
    detailLabel: {
        opacity: 0.6,
    },
    sectionTitle: {
        marginTop: 10,
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
