import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserIconButton } from '@/components/UserIconButton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { chatService } from '@/services/chatService';
import { connectionService } from '@/services/connectionService';
import { ConnectionRequest, UserProfile } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'received' | 'sent' | 'connections' | 'discover';

export default function NetworkScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  const tintColor = accentColor;
  const cardBackground = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';

  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [loading, setLoading] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const received = await connectionService.getReceivedRequests(user.uid);
      const sent = await connectionService.getSentRequests(user.uid);
      setReceivedRequests(received);
      setSentRequests(sent);

      // Fetch connections
      const connectionProfiles = await connectionService.getAcceptedConnections(user.uid);
      setConnections(connectionProfiles);

      // Fetch discover users
      const allOtherUsers = await connectionService.getAllUsersExceptMe(user.uid);
      
      // Filter out users who are already in some connection state (pending or accepted)
      const excludeIds = new Set([
        ...received.map(r => r.fromId),
        ...sent.map(r => r.toId),
        ...connectionProfiles.map(u => u.id)
      ]);

      const filteredDiscover = allOtherUsers.filter(u => !excludeIds.has(u.id));
      setDiscoverUsers(filteredDiscover);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAccept = async (request: ConnectionRequest) => {
    try {
      if (!user) return;
      await connectionService.acceptConnectionRequest(request.id);
      setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
      // Optionally show a success message
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await connectionService.rejectConnectionRequest(requestId);
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await connectionService.cancelConnectionRequest(requestId);
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const renderRequestItem = ({ item }: { item: ConnectionRequest }) => {
    const isReceived = activeTab === 'received';
    const otherUserPhoto = isReceived ? item.fromPhoto : item.toPhoto;
    const otherUserName = isReceived ? item.fromName : item.toName;
    const otherUserId = isReceived ? item.fromId : item.toId;

    return (
      <View style={[styles.requestCard, { backgroundColor: cardBackground }]}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push({ pathname: '/public-profile/[id]', params: { id: otherUserId } })}
        >
          {otherUserPhoto ? (
            <Image source={{ uri: otherUserPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="person" size={24} color={tintColor} />
            </View>
          )}
          <View style={styles.textInfo}>
            <ThemedText type="defaultSemiBold">{otherUserName}</ThemedText>
            <ThemedText style={styles.subText}>
              {isReceived ? 'Souhaite se connecter' : 'Demande en attente'}
            </ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {isReceived ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: tintColor }]}
                onPress={() => handleAccept(item)}
              >
                <ThemedText style={styles.actionButtonText}>Accepter</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleReject(item.id)}
              >
                <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme].text }]}>Refuser</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleCancel(item.id)}
            >
              <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme].text }]}>Annuler</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleStartChat = async (otherUser: UserProfile) => {
    if (!user) return;
    try {
      const currentUserProfile = await connectionService.getUserProfile(user.uid);
      if (!currentUserProfile) return;
      
      const conversationId = await chatService.getOrCreateConversation(currentUserProfile, otherUser);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const renderConnectionItem = ({ item }: { item: UserProfile }) => (
    <View style={[styles.requestCard, { backgroundColor: cardBackground }]}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => router.push({ pathname: '/public-profile/[id]', params: { id: item.id } })}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
            <Ionicons name="person" size={24} color={tintColor} />
          </View>
        )}
        <View style={styles.textInfo}>
          <ThemedText type="defaultSemiBold">{item.pseudo || item.displayName}</ThemedText>
          <ThemedText style={styles.subText}>{item.position || 'Passionné de Basket'}</ThemedText>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: tintColor, flexDirection: 'row' }]}
          onPress={() => handleStartChat(item)}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" style={{marginRight: 8}} />
          <ThemedText style={styles.actionButtonText}>Message</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push({ pathname: '/public-profile/[id]', params: { id: item.id } })}
        >
          <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme].text }]}>Profil</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDiscoverItem = ({ item }: { item: UserProfile }) => (
    <View style={[styles.requestCard, { backgroundColor: cardBackground }]}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => router.push({ pathname: '/public-profile/[id]', params: { id: item.id } })}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
            <Ionicons name="person" size={24} color={tintColor} />
          </View>
        )}
        <View style={styles.textInfo}>
          <ThemedText type="defaultSemiBold">{item.pseudo || item.displayName}</ThemedText>
          <ThemedText style={styles.subText}>{item.position || 'Passionné de Basket'}</ThemedText>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: tintColor }]}
        onPress={() => router.push({ pathname: '/public-profile/[id]', params: { id: item.id } })}
      >
        <ThemedText style={styles.actionButtonText}>Se connecter</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Mon Réseau',
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{marginLeft: 10}}>
            <Ionicons name="chevron-back" size={28} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{marginRight: 10}}>
            <UserIconButton color={tintColor} size={28} />
          </View>
        ),
      }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'received' && { borderBottomColor: tintColor }]}
            onPress={() => setActiveTab('received')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'received' && { color: tintColor }]}>
              Reçues ({receivedRequests.length})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'connections' && { borderBottomColor: tintColor }]}
            onPress={() => setActiveTab('connections')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'connections' && { color: tintColor }]}>
              Relations ({connections.length})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'discover' && { borderBottomColor: tintColor }]}
            onPress={() => setActiveTab('discover')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'discover' && { color: tintColor }]}>
              Découvrir
            </ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : (
          <FlatList
            data={(activeTab === 'received' ? receivedRequests : (activeTab === 'sent' ? sentRequests : (activeTab === 'connections' ? connections : discoverUsers))) as any[]}
            renderItem={activeTab === 'connections' ? (renderConnectionItem as any) : (activeTab === 'discover' ? (renderDiscoverItem as any) : (renderRequestItem as any))}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchData}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons 
                    name={activeTab === 'connections' ? "people-outline" : "person-add-outline"} 
                    size={64} 
                    color="#ccc" 
                />
                <ThemedText style={styles.emptyText}>
                  {activeTab === 'received' ? 'Aucune demande reçue' : 
                   activeTab === 'sent' ? 'Aucune demande envoyée' : 
                   'Vous n\'avez pas encore de relations'}
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8e8e93',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInfo: {
    marginLeft: 12,
    flex: 1,
  },
  subText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#8e8e93',
    fontSize: 16,
  },
});
