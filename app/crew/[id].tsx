import { AnkeceLogo } from '@/components/AnkeceLogo';
import { ThemedText } from '@/components/themed-text';
import { UserIconButton } from '@/components/UserIconButton';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ballerService } from '@/services/ballerService';
import { Crew } from '@/types/baller';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CrewDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [crew, setCrew] = useState<Crew | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const bgColor = isDark ? '#000' : '#F2F2F7';
    const cardBg = isDark ? '#1C1C1E' : '#fff';
    const sectionBg = isDark ? '#2C2C2E' : '#F2F2F7';

    const loadCrew = useCallback(async () => {
        if (!id) return;
        try {
            const data = await ballerService.getCrew(id as string);
            setCrew(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => { loadCrew(); }, [loadCrew]);

    const onRefresh = () => { setRefreshing(true); loadCrew(); };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: bgColor }]}>
                <ActivityIndicator color={accentColor} size="large" />
            </View>
        );
    }

    if (!crew) {
        return (
            <View style={[styles.center, { backgroundColor: bgColor }]}>
                <Ionicons name="alert-circle-outline" size={60} color="#666" />
                <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>Crew introuvable</ThemedText>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: accentColor }]}>
                    <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Retour</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    const isAdmin = user?.uid === crew.adminId;
    const isMember = user ? crew.memberIds.includes(user.uid) : false;
    const hasPendingRequest = user ? (crew.pendingRequests ?? []).includes(user.uid) : false;

    const handleJoin = async () => {
        if (!user) { Alert.alert('Connexion requise', 'Vous devez être connecté.'); return; }
        setActionLoading('join');
        try {
            if (crew.isPrivate) {
                await ballerService.requestToJoin(user.uid, crew.id);
                Alert.alert('✅ Demande envoyée', 'L\'admin du crew examinera votre demande.');
            } else {
                await ballerService.joinCrew(user.uid, crew.id);
                Alert.alert('🎉 Bienvenue !', `Vous avez rejoint ${crew.name} !`);
            }
            await loadCrew();
        } catch {
            Alert.alert('Erreur', 'Impossible de traiter votre demande.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAccept = async (uid: string) => {
        setActionLoading('accept_' + uid);
        try {
            await ballerService.acceptMember(crew.id, uid);
            await loadCrew();
        } catch { Alert.alert('Erreur', 'Impossible d\'accepter ce membre.'); }
        finally { setActionLoading(null); }
    };

    const handleRefuse = async (uid: string) => {
        setActionLoading('refuse_' + uid);
        try {
            await ballerService.refuseMember(crew.id, uid);
            await loadCrew();
        } catch { Alert.alert('Erreur', 'Impossible de refuser ce membre.'); }
        finally { setActionLoading(null); }
    };

    const handleRemoveMember = (uid: string) => {
        Alert.alert('Retirer ce membre', 'Êtes-vous sûr de vouloir retirer ce membre ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Retirer', style: 'destructive', onPress: async () => {
                    setActionLoading('remove_' + uid);
                    try {
                        await ballerService.removeMember(crew.id, uid);
                        await loadCrew();
                    } catch { Alert.alert('Erreur', 'Impossible de retirer ce membre.'); }
                    finally { setActionLoading(null); }
                }
            }
        ]);
    };

    const handleDelete = () => {
        Alert.alert(
            '⚠️ Supprimer le crew',
            `Êtes-vous sûr de vouloir supprimer "${crew.name}" ? Cette action est irréversible.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive', onPress: async () => {
                        try {
                            await ballerService.deleteCrew(crew.id);
                            router.back();
                        } catch { Alert.alert('Erreur', 'Impossible de supprimer le crew.'); }
                    }
                }
            ]
        );
    };

    const pendingRequests = crew.pendingRequests ?? [];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: cardBg }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                    <Ionicons name="chevron-back" size={28} color={accentColor} />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>{crew.name}</ThemedText>
                {isAdmin ? (
                    <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.headerAction}>
                        <Ionicons name="settings-outline" size={24} color={accentColor} />
                    </TouchableOpacity>
                ) : <View style={styles.headerAction} />}
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
            >
                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.heroAvatar, { backgroundColor: accentColor + '33' }]}>
                        {crew.avatar ? (
                            <Image source={crew.avatar} style={styles.heroAvatarImg} />
                        ) : (
                            <ThemedText style={[styles.heroAvatarText, { color: accentColor }]}>
                                {crew.name.charAt(0).toUpperCase()}
                            </ThemedText>
                        )}
                    </View>
                    <View style={styles.heroBadgeRow}>
                        <View style={[styles.badge, { backgroundColor: crew.isPrivate ? '#FF950020' : '#4CD96420' }]}>
                            <Ionicons name={crew.isPrivate ? 'lock-closed' : 'earth'} size={12} color={crew.isPrivate ? '#FF9500' : '#4CD964'} />
                            <ThemedText style={[styles.badgeText, { color: crew.isPrivate ? '#FF9500' : '#4CD964' }]}>
                                {crew.isPrivate ? 'Crew Privé' : 'Crew Public'}
                            </ThemedText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: accentColor + '20' }]}>
                            <Ionicons name="flash" size={12} color={accentColor} />
                            <ThemedText style={[styles.badgeText, { color: accentColor }]}>Niv. {crew.level} • {crew.xp} XP</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.heroDesc}>{crew.description}</ThemedText>

                    {/* CTA */}
                    {!isMember && !isAdmin && (
                        <TouchableOpacity
                            style={[styles.ctaBtn, { backgroundColor: accentColor }, actionLoading === 'join' && { opacity: 0.6 }]}
                            onPress={handleJoin}
                            disabled={actionLoading === 'join' || hasPendingRequest}
                        >
                            {actionLoading === 'join' ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : hasPendingRequest ? (
                                <>
                                    <Ionicons name="hourglass-outline" size={18} color="#fff" />
                                    <ThemedText style={styles.ctaBtnText}>Demande envoyée</ThemedText>
                                </>
                            ) : (
                                <>
                                    <Ionicons name={crew.isPrivate ? 'send' : 'people'} size={18} color="#fff" />
                                    <ThemedText style={styles.ctaBtnText}>
                                        {crew.isPrivate ? 'Demander à rejoindre' : 'Rejoindre le crew'}
                                    </ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {isMember && !isAdmin && (
                        <View style={styles.memberBadge}>
                            <Ionicons name="checkmark-circle" size={18} color="#4CD964" />
                            <ThemedText style={{ color: '#4CD964', fontWeight: 'bold' }}>Vous êtes membre de ce crew</ThemedText>
                        </View>
                    )}
                    {isAdmin && (
                        <View style={styles.memberBadge}>
                            <Ionicons name="shield-checkmark" size={18} color={accentColor} />
                            <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>Vous êtes l'admin de ce crew</ThemedText>
                        </View>
                    )}
                </View>

                {/* Demandes en attente (admin seulement) */}
                {isAdmin && pendingRequests.length > 0 && (
                    <View style={[styles.section, { backgroundColor: cardBg }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="time" size={20} color="#FF9500" />
                            <ThemedText type="defaultSemiBold" style={{ color: '#FF9500' }}>
                                Demandes en attente ({pendingRequests.length})
                            </ThemedText>
                        </View>
                        {pendingRequests.map((uid) => (
                            <View key={uid} style={[styles.memberRow, { backgroundColor: sectionBg }]}>
                                <View style={[styles.memberAvatar, { backgroundColor: '#FF950033' }]}>
                                    <ThemedText style={{ color: '#FF9500', fontWeight: 'bold' }}>?</ThemedText>
                                </View>
                                <ThemedText style={styles.memberUid} numberOfLines={1}>{uid.slice(0, 12)}...</ThemedText>
                                <View style={styles.memberActions}>
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: '#4CD96420' }]}
                                        onPress={() => handleAccept(uid)}
                                        disabled={actionLoading === 'accept_' + uid}
                                    >
                                        {actionLoading === 'accept_' + uid
                                            ? <ActivityIndicator size="small" color="#4CD964" />
                                            : <Ionicons name="checkmark" size={20} color="#4CD964" />}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: '#FF3B3020' }]}
                                        onPress={() => handleRefuse(uid)}
                                        disabled={actionLoading === 'refuse_' + uid}
                                    >
                                        {actionLoading === 'refuse_' + uid
                                            ? <ActivityIndicator size="small" color="#FF3B30" />
                                            : <Ionicons name="close" size={20} color="#FF3B30" />}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Membres */}
                <View style={[styles.section, { backgroundColor: cardBg }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="people" size={20} color={accentColor} />
                        <ThemedText type="defaultSemiBold">Membres ({crew.memberIds.length})</ThemedText>
                    </View>
                    {crew.memberIds.map((uid) => (
                        <View key={uid} style={[styles.memberRow, { backgroundColor: sectionBg }]}>
                            <View style={[styles.memberAvatar, { backgroundColor: accentColor + '33' }]}>
                                <ThemedText style={{ color: accentColor, fontWeight: 'bold', fontSize: 12 }}>
                                    {uid === crew.adminId ? '👑' : '🏀'}
                                </ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.memberUid} numberOfLines={1}>{uid.slice(0, 16)}...</ThemedText>
                                {uid === crew.adminId && (
                                    <ThemedText style={{ fontSize: 11, color: accentColor }}>Admin</ThemedText>
                                )}
                            </View>
                            {isAdmin && uid !== crew.adminId && (
                                <TouchableOpacity
                                    style={[styles.iconBtn, { backgroundColor: '#FF3B3020' }]}
                                    onPress={() => handleRemoveMember(uid)}
                                    disabled={actionLoading === 'remove_' + uid}
                                >
                                    {actionLoading === 'remove_' + uid
                                        ? <ActivityIndicator size="small" color="#FF3B30" />
                                        : <Ionicons name="person-remove" size={18} color="#FF3B30" />}
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* Zone danger admin */}
                {isAdmin && (
                    <View style={[styles.section, styles.dangerSection]}>
                        <ThemedText style={styles.dangerTitle}>Zone Admin</ThemedText>
                        <TouchableOpacity style={styles.dangerBtn} onPress={handleDelete}>
                            <Ionicons name="trash" size={18} color="#FF3B30" />
                            <ThemedText style={styles.dangerBtnText}>Supprimer ce crew</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Modal d'édition */}
            <EditCrewModal
                visible={showEditModal}
                crew={crew}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => { setShowEditModal(false); loadCrew(); }}
            />
        </View>
    );
}

function EditCrewModal({ visible, crew, onClose, onSuccess }: {
    visible: boolean;
    crew: Crew;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [name, setName] = useState(crew.name);
    const [description, setDescription] = useState(crew.description);
    const [isPrivate, setIsPrivate] = useState(crew.isPrivate);
    const [submitting, setSubmitting] = useState(false);

    const bgColor = isDark ? '#1C1C1E' : '#fff';
    const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textColor = isDark ? '#fff' : '#000';
    const placeholderColor = isDark ? '#666' : '#8E8E93';

    // Sync when crew changes
    useEffect(() => {
        setName(crew.name);
        setDescription(crew.description);
        setIsPrivate(crew.isPrivate);
    }, [crew]);

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Erreur', 'Le nom est obligatoire.'); return; }
        setSubmitting(true);
        try {
            await ballerService.updateCrew(crew.id, {
                name: name.trim(),
                description: description.trim(),
                isPrivate,
            });
            onSuccess();
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre à jour le crew.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={[editStyles.container, { backgroundColor: bgColor }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={editStyles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText style={{ color: '#8E8E93', fontSize: 16 }}>Annuler</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>Modifier le Crew</ThemedText>
                    <TouchableOpacity onPress={handleSave} disabled={submitting}>
                        {submitting
                            ? <ActivityIndicator color={accentColor} size="small" />
                            : <ThemedText style={{ color: accentColor, fontSize: 16, fontWeight: 'bold' }}>Enregistrer</ThemedText>}
                    </TouchableOpacity>
                </View>

                <ScrollView style={editStyles.body} keyboardShouldPersistTaps="handled">
                    <ThemedText style={editStyles.label}>Nom du Crew *</ThemedText>
                    <TextInput
                        style={[editStyles.input, { backgroundColor: inputBg, color: textColor }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nom du crew"
                        placeholderTextColor={placeholderColor}
                        maxLength={40}
                    />

                    <ThemedText style={editStyles.label}>Description</ThemedText>
                    <TextInput
                        style={[editStyles.input, editStyles.textArea, { backgroundColor: inputBg, color: textColor }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Description du crew"
                        placeholderTextColor={placeholderColor}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <ThemedText style={editStyles.label}>Visibilité</ThemedText>
                    <TouchableOpacity
                        style={[editStyles.toggleRow, { backgroundColor: inputBg }]}
                        onPress={() => setIsPrivate(!isPrivate)}
                    >
                        <View style={editStyles.toggleInfo}>
                            <Ionicons name={isPrivate ? 'lock-closed' : 'earth'} size={20} color={isPrivate ? '#FF9500' : '#4CD964'} />
                            <View>
                                <ThemedText type="defaultSemiBold">{isPrivate ? 'Crew Privé' : 'Crew Public'}</ThemedText>
                                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                    {isPrivate ? 'Sur invitation uniquement' : 'Tout le monde peut rejoindre'}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={[editStyles.toggle, isPrivate && { backgroundColor: '#FF9500' }]}>
                            <View style={[editStyles.toggleThumb, isPrivate && { transform: [{ translateX: 20 }] }]} />
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    headerBack: { width: 40, alignItems: 'flex-start' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17 },
    headerAction: { width: 40, alignItems: 'flex-end' },
    scroll: { flex: 1, padding: 16 },
    heroCard: {
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    heroAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroAvatarImg: { width: '100%', height: '100%' },
    heroAvatarText: { fontSize: 36, fontWeight: '900' },
    heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    heroDesc: { textAlign: 'center', opacity: 0.7, lineHeight: 20 },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        width: '100%',
        justifyContent: 'center',
        marginTop: 4,
    },
    ctaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    section: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderRadius: 12,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberUid: { flex: 1, fontSize: 13, opacity: 0.8 },
    memberActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerSection: {
        borderWidth: 1,
        borderColor: '#FF3B3040',
        backgroundColor: '#FF3B3008',
    },
    dangerTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FF3B30',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF3B3040',
    },
    dangerBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 15 },
    backBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
    },
});

const editStyles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.3)',
    },
    body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
    label: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 20,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 4,
    },
    textArea: { minHeight: 100, paddingTop: 12 },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
    },
    toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E5EA',
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
});
