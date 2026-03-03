import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { chatService } from '@/services/chatService';
import { connectionService } from '@/services/connectionService';
import { DB_COLLECTIONS, UserProfile } from '@/types/user';
import { safeFormatDate } from '@/utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image as RNImage, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const cardBackground = colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7';

  const [loading, setLoading] = useState(true);
  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [isRequestSender, setIsRequestSender] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProfileAndStatus = async () => {
      if (!id) return;
      try {
        const userDoc = await getDoc(doc(db, DB_COLLECTIONS.USERS, id));
        if (userDoc.exists()) {
            const profileData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            setProfile(profileData);

            if (user) {
                const status = await connectionService.getConnectionStatus(user.uid, id);
                setConnectionStatus(status.status);
                if (status.status === 'pending') {
                    setIsRequestSender(status.isSender || false);
                    setRequestId(status.id || null);
                }
            }
        }
      } catch (error) {
        console.error('Error fetching public profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndStatus();
  }, [id, user]);

  useEffect(() => {
    if (currentUserProfile && id) {
      setIsFollowing(currentUserProfile.following?.includes(id) || false);
    }
  }, [currentUserProfile, id]);

  const handleFollow = async () => {
    if (!user || !id) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, DB_COLLECTIONS.USERS, user.uid);
      if (isFollowing) {
        await updateDoc(userRef, {
          following: arrayRemove(id)
        });
        setIsFollowing(false);
      } else {
        await updateDoc(userRef, {
          following: arrayUnion(id)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user || !profile || !id) return;
    setActionLoading(true);
    try {
        if (connectionStatus === 'none') {
            const newRequestId = await connectionService.sendConnectionRequest(currentUserProfile as UserProfile, profile);
            setConnectionStatus('pending');
            setIsRequestSender(true);
            setRequestId(newRequestId);
            Alert.alert('Succès', 'Demande de connexion envoyée !');
        } else if (connectionStatus === 'pending' && isRequestSender && requestId) {
            await connectionService.cancelConnectionRequest(requestId);
            setConnectionStatus('none');
            setIsRequestSender(false);
            setRequestId(null);
        }
    } catch (error) {
        console.error('Error in handleConnect:', error);
        Alert.alert('Erreur', 'Impossible de modifier la connexion.');
    } finally {
        setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Utilisateur non trouvé.</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
          <ThemedText style={{color: tintColor}}>Retour</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>Profil Joueur</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: cardBackground }]}>
              {profile.avatarUrl ? (
                <RNImage source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={50} color={colorScheme === 'dark' ? '#8e8e93' : '#aeb2b5'} />
              )}
            </View>
            <ThemedText type="title" style={styles.displayName}>{profile.pseudo || profile.displayName}</ThemedText>
            {profile.personality && (
              <View style={[styles.personalityBadge, { backgroundColor: tintColor + '20' }]}>
                <ThemedText style={[styles.personalityText, { color: tintColor }]}>
                  {profile.personality}
                </ThemedText>
              </View>
            )}

            {user && user.uid !== id && (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[
                    styles.followButton, 
                    { backgroundColor: isFollowing ? 'transparent' : tintColor, borderColor: tintColor }
                    ]}
                    onPress={handleFollow}
                    disabled={actionLoading}
                >
                    {actionLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? tintColor : "#fff"} />
                    ) : (
                    <ThemedText style={[styles.followButtonText, { color: isFollowing ? tintColor : "#fff" }]}>
                        {isFollowing ? 'Suivi' : 'Suivre'}
                    </ThemedText>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.connectButton, 
                        { 
                            backgroundColor: connectionStatus === 'connected' ? tintColor : (connectionStatus === 'pending' ? 'transparent' : tintColor),
                            borderColor: tintColor
                        }
                    ]}
                    onPress={async () => {
                        if (connectionStatus === 'connected') {
                            if (!currentUserProfile || !profile) return;
                            const convId = await chatService.getOrCreateConversation(currentUserProfile, profile);
                            router.push({ pathname: '/chat/[id]', params: { id: convId } });
                        } else {
                            handleConnect();
                        }
                    }}
                    disabled={actionLoading || (connectionStatus === 'pending' && !isRequestSender)}
                >
                    {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons 
                                name={connectionStatus === 'connected' ? "chatbubbles" : (connectionStatus === 'pending' ? "time" : "person-add")} 
                                size={18} 
                                color={connectionStatus === 'pending' && !isRequestSender ? tintColor : "#fff"} 
                                style={{marginRight: 8}}
                            />
                            <ThemedText style={[styles.connectButtonText, { color: connectionStatus === 'pending' && !isRequestSender ? tintColor : "#fff" }]}>
                                {connectionStatus === 'connected' ? 'Message' : (connectionStatus === 'pending' ? (isRequestSender ? 'Annuler' : 'En attente') : 'Se connecter')}
                            </ThemedText>
                        </>
                    )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: cardBackground }]}>
              <ThemedText style={styles.statLabel}>Position</ThemedText>
              <ThemedText style={styles.statValue}>{profile.position || '-'}</ThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: cardBackground }]}>
              <ThemedText style={styles.statLabel}>Taille</ThemedText>
              <ThemedText style={styles.statValue}>{profile.height ? `${profile.height} cm` : '-'}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>À propos</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: cardBackground }]}>
              <ThemedText style={styles.bioText}>
                {profile.bio || "Ce joueur n'a pas encore rédigé sa bio."}
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Stats de compte</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: cardBackground }]}>
              <View style={styles.accountStatRow}>
                <ThemedText style={styles.accountStatLabel}>Date d'inscription</ThemedText>
                <ThemedText style={styles.accountStatValue}>
                  {safeFormatDate(profile.createdAt || (profile as any).dateCreation || (profile as any).registrationDate)}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: '700',
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  personalityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  personalityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    color: '#8e8e93',
  },
  accountStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountStatLabel: {
    fontSize: 14,
    color: '#8e8e93',
  },
  accountStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  followButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
    width: '100%',
  },
  connectButton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
