import { AnkeceLogo } from '@/components/AnkeceLogo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserIconButton } from '@/components/UserIconButton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ballerService } from '@/services/ballerService';
import { notificationService } from '@/services/notificationService';
import { BallerAd, BallerProfile, Crew, PlayingPosition } from '@/types/baller';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    FadeInRight,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 280;

type BallerTab = 'explore' | 'feed' | 'crews' | 'profile';

export default function BallerScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { accentColor } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BallerTab>('explore');
  const [isLoading, setIsLoading] = useState(false);
  
  // States pour le Quick Match IA
  const [isMatching, setIsMatching] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchResults, setMatchResults] = useState<BallerProfile[]>([]);
  // States pour le profil Baller
  const [ballerProfile, setBallerProfile] = useState<BallerProfile | null>(null);
  const [showEditBallerModal, setShowEditBallerModal] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'searching' | 'results' | 'no_results'>('searching');
  
  const scrollY = useSharedValue(0);
  const ballY = useSharedValue(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (user) {
      loadBallerProfile();
      const unsubscribe = notificationService.subscribeToUserNotifications(user.uid, (notifs) => {
        const unread = notifs.filter(n => !n.readBy.includes(user.uid) && !n.archivedBy.includes(user.uid)).length;
        setUnreadCount(unread);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const loadBallerProfile = async () => {
    if (!user) return;
    try {
      const profile = await ballerService.getProfile(user.uid);
      setBallerProfile(profile);
    } catch (err) {
      console.error("Error loading baller profile:", err);
    }
  };
  
  useEffect(() => {
    // Animation de flottement fluide et continue (sans arrêt)
    ballY.value = withRepeat(
      withTiming(-15, { 
        duration: 1500, 
        easing: Easing.inOut(Easing.sin) 
      }),
      -1,
      true
    );
  }, []);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ballY.value }],
  }));

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    return {};
  });

  const handleQuickMatch = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour utiliser le Quick Match IA.');
      return;
    }

    // Si le profil n'est pas configuré, on propose de le faire
    if (!ballerProfile) {
      Alert.alert(
        'Profil requis',
        'Nous avons besoin de connaître votre ville et votre niveau pour vous trouver des partenaires. Voulez-vous configurer votre profil maintenant ?',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Configurer', onPress: () => setShowEditBallerModal(true) }
        ]
      );
      return;
    }

    setShowMatchModal(true);
    setMatchStatus('searching');
    setMatchResults([]);

    try {
      // Simuler un délai d'analyse IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results = await ballerService.getQuickMatches(ballerProfile);
      
      if (results.length > 0) {
        setMatchResults(results);
        setMatchStatus('results');
      } else {
        setMatchStatus('no_results');
      }
    } catch (err) {
      console.error(err);
      setMatchStatus('no_results');
    }
  };

  const handleSaveBallerProfile = async (data: Partial<BallerProfile>) => {
    if (!user) return;
    try {
      await ballerService.updateProfile(user.uid, {
        uid: user.uid,
        ...data
      } as BallerProfile);
      setShowEditBallerModal(false);
      loadBallerProfile();
      Alert.alert('Succès', 'Votre profil Baller a été mis à jour.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  };

  const renderTabButton = (tab: BallerTab, label: string, icon: keyof typeof Ionicons.prototype.allNames) => (
    <TouchableOpacity 
      style={[
        styles.tabButton, 
        activeTab === tab && { borderBottomColor: accentColor, borderBottomWidth: 3 }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={tab === 'crews' ? 'people' : tab === 'feed' ? 'newspaper' : tab === 'profile' ? 'person-circle' : 'search'} 
        size={20} 
        color={activeTab === tab ? accentColor : Colors[colorScheme ?? 'light'].textSecondary} 
      />
      <ThemedText style={[
        styles.tabText, 
        { color: activeTab === tab ? accentColor : Colors[colorScheme ?? 'light'].textSecondary }
      ]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.heroContainer, headerStyle]}>
        <Image
          source={require('@/assets/images/baller_hero_bg.png')}
          style={styles.heroImage}
          contentFit="cover"
        />
        <BlurView intensity={2} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroOverlay, { paddingTop: insets.top + 20 }]}>
          <AnkeceLogo style={[styles.logo, { top: insets.top + 10, left: 5 }]} />
          
          <View style={styles.titleContainer}>
             <Animated.View style={[ballStyle, { marginTop: 8 }]}>
                <IconSymbol name="basketball" size={36} color={accentColor} />
             </Animated.View>
             <ThemedText type="title" style={styles.heroTitle}>{t('baller.title')}</ThemedText>
          </View>
          
          {/* <ThemedText style={styles.heroSubtitle}>{t('baller.subtitle')}</ThemedText> */}
          <View style={styles.heroActions}>
            {/* <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <ThemedText style={styles.badgeText}>COMMUNITY HUB</ThemedText>
            </View> */}
          </View>
        </View>
        {/* Wave effect at bottom */}
        <View style={styles.waveContainer}>
          <Svg
            height="40"
            width={width}
            viewBox={`0 0 ${width} 40`}
            style={styles.waveSvg}
          >
            <Path
              d={`M0 20 C ${Math.round(width / 3)} 40 ${Math.round((width * 2) / 3)} 0 ${Math.round(width)} 20 V 40 H 0 Z`}
              fill={Colors[colorScheme ?? 'light'].background}
            />
          </Svg>
        </View>
      </Animated.View>

      <View style={[styles.mainContent, { marginTop: -40 }]}>
        <View style={styles.tabBar}>
          {renderTabButton('explore', t('baller.tabs.explore'), 'search')}
          {renderTabButton('feed', t('baller.tabs.feed'), 'newspaper')}
          {renderTabButton('crews', t('baller.tabs.crews'), 'people')}
          {renderTabButton('profile', t('baller.tabs.profile'), 'person-circle')}
        </View>

        <Animated.ScrollView 
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'explore' && <ExploreSection onQuickMatch={handleQuickMatch} />}
          {activeTab === 'feed' && <FeedSection />}
          {activeTab === 'crews' && <CrewsSection />}
          {activeTab === 'profile' && <ProfileSection profile={ballerProfile} onEdit={() => setShowEditBallerModal(true)} />}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </View>

      <View style={[styles.floatingProfile, { top: insets.top + 10 }]}>
        {user && (
          <TouchableOpacity 
            onPress={() => router.push('/notifications')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="notifications" size={28} color="#fff" />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: accentColor }]}>
                <ThemedText style={styles.notifBadgeText}>{unreadCount}</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        )}
        <UserIconButton color="#fff" size={36} />
      </View>

      <QuickMatchModal 
        visible={showMatchModal}
        status={matchStatus}
        results={matchResults}
        onClose={() => setShowMatchModal(false)}
      />

      <EditBallerProfileModal
        visible={showEditBallerModal}
        profile={ballerProfile}
        onClose={() => setShowEditBallerModal(false)}
        onSave={handleSaveBallerProfile}
      />
    </ThemedView>
  );
}

function ExploreSection({ onQuickMatch }: { onQuickMatch: () => void }) {
  const { t } = useTranslation();
  const { accentColor } = useAppTheme();
  const [ballers, setBallers] = useState<BallerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États des filtres
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterPosition, setFilterPosition] = useState<BallerProfile['position'] | ''>('');
  const [filterMinLevel, setFilterMinLevel] = useState(1);

  useEffect(() => {
    loadBallers();
  }, [filterCity, filterPosition, filterMinLevel]);

  const loadBallers = async () => {
    setLoading(true);
    try {
      const results = await ballerService.searchPlayers({
          city: filterCity || undefined,
          position: filterPosition || undefined,
          minLevel: filterMinLevel > 1 ? filterMinLevel : undefined,
      });
      setBallers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle">{t('baller.explore.title')}</ThemedText>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <Ionicons name="options" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.quickMatchCard, { backgroundColor: accentColor }]}
        onPress={onQuickMatch}
      >
        <View style={styles.quickMatchContent}>
            <Ionicons name="flash" size={32} color="#fff" />
            <View>
                <ThemedText style={styles.quickMatchTitle}>{t('baller.explore.quick_match')}</ThemedText>
                <ThemedText style={styles.quickMatchDesc}>{t('baller.explore.quick_match_desc')}</ThemedText>
            </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.spotlightContainer}>
        <ThemedText style={styles.subTitle}>{t('baller.explore.spotlight')}</ThemedText>
        {loading ? (
            <ActivityIndicator color={accentColor} />
        ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {ballers.map((baller, index) => (
                    <BallerCard key={baller.uid} baller={baller} index={index} />
                ))}
            </ScrollView>
        )}
      </View>

      <FilterModal 
          visible={showFilterModal} 
          onClose={() => setShowFilterModal(false)}
          onApply={(city, pos, level) => {
              setFilterCity(city);
              setFilterPosition(pos);
              setFilterMinLevel(level);
              setShowFilterModal(false);
          }}
          initialCity={filterCity}
          initialPosition={filterPosition}
          initialLevel={filterMinLevel}
      />
    </Animated.View>
  );
}

function FilterModal({ visible, onClose, onApply, initialCity, initialPosition, initialLevel }: {
    visible: boolean;
    onClose: () => void;
    onApply: (city: string, pos: any, level: number) => void;
    initialCity: string;
    initialPosition: any;
    initialLevel: number;
}) {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [city, setCity] = useState(initialCity);
    const [pos, setPos] = useState(initialPosition);
    const [level, setLevel] = useState(initialLevel);

    const reset = () => {
        setCity('');
        setPos('');
        setLevel(1);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={{ flex: 1 }}>
                <View style={modalStyles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText style={{ color: '#8E8E93' }}>Fermer</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold">Filtres</ThemedText>
                    <TouchableOpacity onPress={() => onApply(city, pos, level)}>
                        <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>Appliquer</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ padding: 20 }}>
                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Ville</ThemedText>
                        <TextInput 
                            style={[modalStyles.input, { borderColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000' }]} 
                            placeholder="Toute la France"
                            placeholderTextColor="#999"
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>

                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Poste</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                            {['', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'].map(p => (
                                <TouchableOpacity 
                                    key={p} 
                                    onPress={() => setPos(p)}
                                    style={{ 
                                        paddingHorizontal: 12, 
                                        paddingVertical: 8,
                                        backgroundColor: pos === p ? accentColor : (isDark ? '#333' : '#eee'),
                                        borderRadius: 8,
                                        marginRight: 8
                                    }}
                                >
                                    <ThemedText style={{ color: pos === p ? '#fff' : (isDark ? '#ccc' : '#000'), fontSize: 13 }}>
                                        {p === '' ? 'Tous' : p}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Niveau Minimum (OVR: {level})</ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {[1, 5, 7, 8, 9].map(l => (
                                <TouchableOpacity 
                                    key={l}
                                    onPress={() => setLevel(l)}
                                    style={{ 
                                        flex: 1,
                                        paddingVertical: 10,
                                        backgroundColor: level === l ? accentColor : (isDark ? '#333' : '#eee'),
                                        borderRadius: 10,
                                        alignItems: 'center'
                                    }}
                                >
                                    <ThemedText style={{ color: level === l ? '#fff' : (isDark ? '#ccc' : '#000'), fontWeight: 'bold' }}>
                                        {l === 1 ? 'Tous' : `+${l}`}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={reset}
                        style={{ marginTop: 40, alignItems: 'center' }}
                    >
                        <ThemedText style={{ color: '#FF3B30' }}>Réinitialiser les filtres</ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
}

const AD_TYPE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    run:       { emoji: '🏃', color: '#FF3B30', label: 'Run' },
    scrimmage: { emoji: '⚡', color: '#4CD964', label: 'Scrimmage' },
    training:  { emoji: '💪', color: '#007AFF', label: 'Entraînement' },
    market:    { emoji: '🛒', color: '#FF9500', label: 'Market' },
};

function AdCard({ ad, user, onDelete }: { ad: BallerAd; user: any; onDelete: (id: string) => void }) {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const router = useRouter();
    const isDark = colorScheme === 'dark';
    const cardBg = isDark ? '#1C1C1E' : '#fff';
    const typeConf = AD_TYPE_CONFIG[ad.type] ?? { emoji: '📌', color: accentColor, label: ad.type };

    const isOwner = user?.uid === ad.authorId;
    const isInterested = user ? (ad.interestedIds ?? []).includes(user.uid) : false;
    const interestCount = ad.interestedCount ?? (ad.interestedIds?.length ?? 0);

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleDelete = () => {
        Alert.alert('Supprimer l\'annonce', 'Cette action est irréversible.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try {
                        await ballerService.deleteAd(ad.id);
                        onDelete(ad.id);
                    } catch {
                        Alert.alert('Erreur', 'Impossible de supprimer l\'annonce.');
                    }
                }
            }
        ]);
    };

    const handleInterest = async () => {
        if (!user) { Alert.alert('Connexion requise', 'Vous devez être connecté.'); return; }
        if (isOwner) { Alert.alert('', 'Vous ne pouvez pas vous intéresser à votre propre annonce.'); return; }
        setActionLoading('interest');
        try {
            const { isFirst, isNowInterested } = await ballerService.toggleInterest(user.uid, ad.id);
            // Notifier l'auteur uniquement à la 1ère expression d'intérêt
            if (isFirst && isNowInterested && ad.authorId !== user.uid) {
                const { notificationService } = await import('@/services/notificationService');
                await notificationService.sendToUser(
                    ad.authorId,
                    user.uid,
                    '🏀 Quelqu\'un est intéressé !',
                    `${user.displayName || 'Un joueur'} est intéressé par votre annonce "${ad.title}"`,
                    'info',
                    { screen: '/baller' }
                );
            }
        } catch {
            Alert.alert('Erreur', 'Impossible de traiter votre action.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMessage = async () => {
        if (!user) { Alert.alert('Connexion requise', 'Vous devez être connecté.'); return; }
        if (isOwner) { Alert.alert('', 'Vous ne pouvez pas vous envoyer un message à vous-même.'); return; }
        setActionLoading('message');
        try {
            const { chatService } = await import('@/services/chatService');
            const convId = await chatService.getOrCreateConversation(
                { id: user.uid, displayName: user.displayName || user.email || 'Moi', pseudo: user.displayName } as any,
                { id: ad.authorId, displayName: ad.authorName, pseudo: ad.authorName } as any
            );
            router.push(`/chat/${convId}` as any);
        } catch {
            Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={[adCardStyles.card, { backgroundColor: cardBg }]}>
            {/* Header */}
            <View style={adCardStyles.header}>
                <View style={[adCardStyles.typeBadge, { backgroundColor: typeConf.color + '20' }]}>
                    <ThemedText style={{ fontSize: 14 }}>{typeConf.emoji}</ThemedText>
                    <ThemedText style={[adCardStyles.typeLabel, { color: typeConf.color }]}>{typeConf.label}</ThemedText>
                </View>
                <View style={adCardStyles.headerRight}>
                    <ThemedText style={adCardStyles.time}>
                        {new Date(ad.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </ThemedText>
                    {isOwner && (
                        <TouchableOpacity onPress={handleDelete} style={adCardStyles.deleteBtn}>
                            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Contenu */}
            <ThemedText type="defaultSemiBold" style={adCardStyles.title}>{ad.title}</ThemedText>

            {ad.content ? (
                <ThemedText style={adCardStyles.content} numberOfLines={3}>{ad.content}</ThemedText>
            ) : null}

            {/* Image Market */}
            {ad.type === 'market' && ad.authorPhoto && (
                <Image source={{ uri: ad.authorPhoto }} style={adCardStyles.marketImage} contentFit="cover" />
            )}

            {/* Méta */}
            <View style={adCardStyles.meta}>
                {ad.type !== 'market' && ad.location?.name ? (
                    <View style={adCardStyles.metaItem}>
                        <Ionicons name="location-outline" size={13} color="#8E8E93" />
                        <ThemedText style={adCardStyles.metaText}>{ad.location.name}</ThemedText>
                    </View>
                ) : null}
                {ad.type !== 'market' && ad.dateTime ? (
                    <View style={adCardStyles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#8E8E93" />
                        <ThemedText style={adCardStyles.metaText}>{ad.dateTime}</ThemedText>
                    </View>
                ) : null}
                {ad.type === 'market' && ad.price !== undefined ? (
                    <View style={adCardStyles.metaItem}>
                        <Ionicons name="pricetag-outline" size={13} color="#FF9500" />
                        <ThemedText style={[adCardStyles.metaText, { color: '#FF9500', fontWeight: 'bold' }]}>{ad.price} €</ThemedText>
                    </View>
                ) : null}
                <View style={adCardStyles.metaItem}>
                    <Ionicons name="person-outline" size={13} color="#8E8E93" />
                    <ThemedText style={adCardStyles.metaText}>{ad.authorName}</ThemedText>
                </View>
            </View>

            {/* Actions */}
            <View style={adCardStyles.actions}>
                {/* Intéressé */}
                <TouchableOpacity
                    style={[adCardStyles.actionBtn, isInterested && { backgroundColor: accentColor + '20' }]}
                    onPress={handleInterest}
                    disabled={actionLoading === 'interest' || isOwner}
                >
                    {actionLoading === 'interest' ? (
                        <ActivityIndicator size="small" color={accentColor} />
                    ) : (
                        <>
                            <Ionicons
                                name={isInterested ? 'heart' : 'heart-outline'}
                                size={18}
                                color={isInterested ? accentColor : '#8E8E93'}
                            />
                            <ThemedText style={[adCardStyles.actionText, isInterested && { color: accentColor }]}>
                                Intéressé
                            </ThemedText>
                            {interestCount > 0 && (
                                <View style={[adCardStyles.badge, { backgroundColor: accentColor }]}>
                                    <ThemedText style={adCardStyles.badgeText}>{interestCount}</ThemedText>
                                </View>
                            )}
                        </>
                    )}
                </TouchableOpacity>

                {/* Message */}
                {!isOwner && (
                    <TouchableOpacity
                        style={adCardStyles.actionBtn}
                        onPress={handleMessage}
                        disabled={actionLoading === 'message'}
                    >
                        {actionLoading === 'message' ? (
                            <ActivityIndicator size="small" color={accentColor} />
                        ) : (
                            <>
                                <Ionicons name="chatbubble-outline" size={18} color="#8E8E93" />
                                <ThemedText style={adCardStyles.actionText}>Message</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
}

const adCardStyles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        gap: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    time: {
        fontSize: 12,
        opacity: 0.5,
    },
    deleteBtn: {
        padding: 4,
    },
    title: {
        fontSize: 16,
        lineHeight: 22,
    },
    content: {
        fontSize: 14,
        opacity: 0.7,
        lineHeight: 20,
    },
    marketImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    meta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        opacity: 0.6,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 4,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128,128,128,0.2)',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: 10,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.7,
    },
    badge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

function FeedSection() {
    const { t } = useTranslation();
    const { accentColor } = useAppTheme();
    const { user } = useAuth();
    const [ads, setAds] = useState<BallerAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadAds();
    }, [filter]);

    const loadAds = async () => {
        setLoading(true);
        try {
            const results = await ballerService.getAds(filter === 'all' ? undefined : { type: filter as any });
            setAds(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setAds(prev => prev.filter(a => a.id !== id));
    };

    return (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
            <CreateAdModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    loadAds();
                }}
                user={user}
            />

            <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">{t('baller.feed.title')}</ThemedText>
                <TouchableOpacity
                    style={[styles.createBtn, { borderColor: accentColor }]}
                    onPress={() => {
                        if (!user) {
                            Alert.alert('Connexion requise', 'Vous devez être connecté pour créer une annonce.');
                            return;
                        }
                        setShowCreateModal(true);
                    }}
                >
                    <Ionicons name="add" size={20} color={accentColor} />
                    <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>{t('baller.feed.create_ad')}</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersBar}>
                {FILTER_OPTIONS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterPill, filter === f.value && { backgroundColor: accentColor }]}
                        onPress={() => setFilter(f.value)}
                    >
                        <ThemedText style={[styles.filterText, filter === f.value && { color: '#fff' }]}>
                            {f.emoji} {f.label}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} />
            ) : ads.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="newspaper-outline" size={60} color="#666" />
                    <ThemedText style={styles.emptyText}>{t('baller.feed.empty')}</ThemedText>
                </View>
            ) : (
                ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} user={user} onDelete={handleDelete} />
                ))
            )}
        </Animated.View>
    );
}

const AD_TYPES: { value: string; label: string; desc: string; color: string; icon: string; emoji: string }[] = [
    { value: 'run',       label: 'Run',        desc: 'Match impro sur terrain, pick-up ouvert à tous', color: '#FF3B30', icon: 'walk',     emoji: '🏃' },
    { value: 'scrimmage', label: 'Scrimmage',  desc: 'Match organisé entre deux équipes définies',     color: '#4CD964', icon: 'people',   emoji: '⚡' },
    { value: 'training',  label: 'Entraînement', desc: 'Session coaching, tirs, physique ou vidéo',   color: '#007AFF', icon: 'barbell',  emoji: '💪' },
    { value: 'market',    label: 'Market',     desc: 'Vente / recherche chaussures, maillots, matériel', color: '#FF9500', icon: 'pricetag', emoji: '🛒' },
];

const FILTER_OPTIONS = [
    { value: 'all',       label: 'Tout',           emoji: '🏀' },
    { value: 'run',       label: 'Run',             emoji: '🏃' },
    { value: 'scrimmage', label: 'Scrimmage',       emoji: '⚡' },
    { value: 'training',  label: 'Entraînement',    emoji: '💪' },
    { value: 'market',    label: 'Market',          emoji: '🛒' },
];

const modalStyles = StyleSheet.create({
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
    formGroup: {
        marginBottom: 20,
    },
    body: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 24,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 4,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    typeGrid: {
        flexDirection: 'column',
        gap: 8,
        marginBottom: 4,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    typeCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    typeDesc: {
        fontSize: 10,
        opacity: 0.5,
        textAlign: 'center',
        lineHeight: 13,
    },
});

function CreateAdModal({ visible, onClose, onSuccess, user }: {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}) {
    const { accentColor } = useAppTheme();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [adType, setAdType] = useState<string>('run');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [locationName, setLocationName] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [price, setPrice] = useState('');
    const [contact, setContact] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isMarket = adType === 'market';

    const bgColor = isDark ? '#1C1C1E' : '#fff';
    const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textColor = isDark ? '#fff' : '#000';
    const placeholderColor = isDark ? '#666' : '#8E8E93';

    const reset = () => {
        setAdType('run');
        setTitle('');
        setContent('');
        setLocationName('');
        setDateTime('');
        setPrice('');
        setContact('');
        setPhotoUri(null);
    };

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Autorisez l\'accès à vos photos dans les paramètres.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const uploadPhoto = async (uri: string): Promise<string> => {
        const { storage } = await import('@/config/firebase');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `market/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Erreur', 'Le titre est obligatoire.');
            return;
        }
        if (!isMarket && !locationName.trim()) {
            Alert.alert('Erreur', 'Le lieu est obligatoire.');
            return;
        }
        if (!isMarket && !dateTime.trim()) {
            Alert.alert('Erreur', 'La date est obligatoire.');
            return;
        }

        setSubmitting(true);
        try {
            let photoUrl: string | undefined;
            if (isMarket && photoUri) {
                setUploading(true);
                photoUrl = await uploadPhoto(photoUri);
                setUploading(false);
            }

            await ballerService.createAd(
                user.uid,
                user.displayName || user.email || 'Anonyme',
                {
                    type: adType as any,
                    title: title.trim(),
                    content: content.trim(),
                    location: { name: isMarket ? 'Market' : locationName.trim() },
                    dateTime: isMarket ? '' : dateTime.trim(),
                    price: isMarket && price ? parseFloat(price) : undefined,
                    authorPhoto: photoUrl,
                    tags: [adType, ...(isMarket && contact ? [`contact:${contact.trim()}`] : [])],
                }
            );
            reset();
            onSuccess();
        } catch (err) {
            console.error(err);
            Alert.alert('Erreur', "Impossible de créer l'annonce. Réessayez.");
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={[modalStyles.container, { backgroundColor: bgColor }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={modalStyles.header}>
                    <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                        <ThemedText style={{ color: '#8E8E93', fontSize: 16 }}>Annuler</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>Nouvelle annonce</ThemedText>
                    <TouchableOpacity onPress={handleSubmit} disabled={submitting || uploading}>
                        {submitting ? (
                            uploading
                                ? <ThemedText style={{ color: accentColor, fontSize: 13 }}>Upload...</ThemedText>
                                : <ActivityIndicator color={accentColor} size="small" />
                        ) : (
                            <ThemedText style={{ color: accentColor, fontSize: 16, fontWeight: 'bold' }}>Publier</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Type d'annonce */}
                    <ThemedText style={modalStyles.label}>Type d'annonce</ThemedText>
                    <View style={modalStyles.typeGrid}>
                        <View style={modalStyles.typeRow}>
                            {AD_TYPES.slice(0, 2).map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        modalStyles.typeCard,
                                        { backgroundColor: inputBg },
                                        adType === type.value && { borderColor: type.color, borderWidth: 2 }
                                    ]}
                                    onPress={() => setAdType(type.value)}
                                >
                                    <ThemedText style={{ fontSize: 20 }}>{type.emoji}</ThemedText>
                                    <ThemedText style={[modalStyles.typeLabel, { color: adType === type.value ? type.color : textColor }]}>{type.label}</ThemedText>
                                    <ThemedText style={modalStyles.typeDesc} numberOfLines={2}>{type.desc}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={modalStyles.typeRow}>
                            {AD_TYPES.slice(2, 4).map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        modalStyles.typeCard,
                                        { backgroundColor: inputBg },
                                        adType === type.value && { borderColor: type.color, borderWidth: 2 }
                                    ]}
                                    onPress={() => setAdType(type.value)}
                                >
                                    <ThemedText style={{ fontSize: 20 }}>{type.emoji}</ThemedText>
                                    <ThemedText style={[modalStyles.typeLabel, { color: adType === type.value ? type.color : textColor }]}>{type.label}</ThemedText>
                                    <ThemedText style={modalStyles.typeDesc} numberOfLines={2}>{type.desc}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Titre */}
                    <ThemedText style={modalStyles.label}>
                        {isMarket ? '🛒 Article / Objet *' : 'Titre *'}
                    </ThemedText>
                    <TextInput
                        style={[modalStyles.input, { backgroundColor: inputBg, color: textColor }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder={isMarket ? 'Ex: Jordan 1 taille 43, peu portées...' : 'Ex: Run 5x5 ce soir à Barbès...'}
                        placeholderTextColor={placeholderColor}
                        maxLength={80}
                    />

                    {isMarket ? (
                        <>
                            {/* Photo de l'article */}
                            <ThemedText style={modalStyles.label}>📸 Photo de l'article</ThemedText>
                            <TouchableOpacity
                                style={[marketStyles.photoPicker, { backgroundColor: inputBg }, photoUri ? { padding: 0, borderStyle: 'solid' } : {}]}
                                onPress={pickPhoto}
                                activeOpacity={0.8}
                            >
                                {photoUri ? (
                                    <View style={marketStyles.photoPreviewContainer}>
                                        <Image source={{ uri: photoUri }} style={marketStyles.photoPreview} contentFit="cover" />
                                        <TouchableOpacity
                                            style={marketStyles.photoRemove}
                                            onPress={() => setPhotoUri(null)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={32} color={placeholderColor} />
                                        <ThemedText style={{ opacity: 0.5, fontSize: 13, marginTop: 6 }}>Appuyez pour ajouter une photo</ThemedText>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Prix */}
                            <ThemedText style={modalStyles.label}>💰 Prix</ThemedText>
                            <TextInput
                                style={[modalStyles.input, { backgroundColor: inputBg, color: textColor }]}
                                value={price}
                                onChangeText={setPrice}
                                placeholder="Ex: 80"
                                placeholderTextColor={placeholderColor}
                                keyboardType="numeric"
                            />

                            {/* Contact */}
                            <ThemedText style={modalStyles.label}>📲 Contact</ThemedText>
                            <TextInput
                                style={[modalStyles.input, { backgroundColor: inputBg, color: textColor }]}
                                value={contact}
                                onChangeText={setContact}
                                placeholder="Ex: Instagram @toi, WhatsApp, DM..."
                                placeholderTextColor={placeholderColor}
                            />
                        </>
                    ) : (
                        <>
                            {/* Lieu */}
                            <ThemedText style={modalStyles.label}>📍 Lieu *</ThemedText>
                            <TextInput
                                style={[modalStyles.input, { backgroundColor: inputBg, color: textColor }]}
                                value={locationName}
                                onChangeText={setLocationName}
                                placeholder="Ex: Terrain de la Villette"
                                placeholderTextColor={placeholderColor}
                            />

                            {/* Date & Heure */}
                            <ThemedText style={modalStyles.label}>📅 Date & Heure *</ThemedText>
                            <TextInput
                                style={[modalStyles.input, { backgroundColor: inputBg, color: textColor }]}
                                value={dateTime}
                                onChangeText={setDateTime}
                                placeholder="Ex: Vendredi 4 avril à 19h"
                                placeholderTextColor={placeholderColor}
                            />
                        </>
                    )}

                    {/* Description */}
                    <ThemedText style={modalStyles.label}>Description</ThemedText>
                    <TextInput
                        style={[modalStyles.input, modalStyles.textArea, { backgroundColor: inputBg, color: textColor }]}
                        value={content}
                        onChangeText={setContent}
                        placeholder="Décrivez votre annonce (niveau requis, règles, etc.)"
                        placeholderTextColor={placeholderColor}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const marketStyles = StyleSheet.create({
    photoPicker: {
        height: 140,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(128,128,128,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    photoPreviewContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    photoRemove: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },
});

function CrewsSection() {
    const { t } = useTranslation();
    const { accentColor } = useAppTheme();
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useEffect(() => {
        loadCrews();
    }, []);

    const loadCrews = async () => {
        setLoading(true);
        try {
            const results = await ballerService.getCrews();
            setCrews(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (crewId: string) => {
        if (!user) {
            Alert.alert('Connexion requise', 'Vous devez être connecté pour rejoindre un crew.');
            return;
        }
        setJoiningId(crewId);
        try {
            await ballerService.joinCrew(user.uid, crewId);
            await loadCrews();
            Alert.alert('✅ Bienvenue !', 'Vous avez rejoint le crew avec succès.');
        } catch (err) {
            Alert.alert('Erreur', 'Impossible de rejoindre ce crew.');
        } finally {
            setJoiningId(null);
        }
    };

    const isDark = colorScheme === 'dark';
    const cardBg = isDark ? '#1C1C1E' : '#F2F2F7';

    return (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
            <CreateCrewModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); loadCrews(); }}
                user={user}
            />

            <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">{t('baller.crews.title')}</ThemedText>
                <TouchableOpacity onPress={() => {
                    if (!user) {
                        Alert.alert('Connexion requise', 'Vous devez être connecté pour créer un crew.');
                        return;
                    }
                    setShowCreateModal(true);
                }}>
                    <Ionicons name="add-circle" size={32} color={accentColor} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} />
            ) : crews.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people-circle-outline" size={80} color="#444" />
                    <ThemedText style={styles.emptyText}>{t('baller.crews.empty')}</ThemedText>
                    <TouchableOpacity
                        style={[styles.joinBtn, { backgroundColor: accentColor }]}
                        onPress={() => {
                            if (!user) { Alert.alert('Connexion requise', 'Connectez-vous d\'abord.'); return; }
                            setShowCreateModal(true);
                        }}
                    >
                        <ThemedText style={styles.joinBtnText}>{t('baller.crews.join_crew')}</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {crews.map((crew, index) => {
                        const isMember = user ? crew.memberIds.includes(user.uid) : false;
                        return (
                            <TouchableOpacity
                                key={crew.id}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/crew/${crew.id}` as any)}
                            >
                            <Animated.View
                                entering={FadeInDown.delay(index * 80).duration(400)}
                                style={[crewStyles.card, { backgroundColor: cardBg }]}
                            >
                                {/* Avatar + Infos */}
                                <View style={crewStyles.cardTop}>
                                    <View style={[crewStyles.avatar, { backgroundColor: accentColor + '33' }]}>
                                        {crew.avatar ? (
                                            <Image source={crew.avatar} style={crewStyles.avatarImg} />
                                        ) : (
                                            <ThemedText style={[crewStyles.avatarText, { color: accentColor }]}>
                                                {crew.name.charAt(0).toUpperCase()}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <View style={crewStyles.info}>
                                        <View style={crewStyles.nameRow}>
                                            <ThemedText type="defaultSemiBold" style={crewStyles.crewName}>{crew.name}</ThemedText>
                                            {crew.isPrivate && (
                                                <Ionicons name="lock-closed" size={14} color="#8E8E93" />
                                            )}
                                        </View>
                                        <ThemedText style={crewStyles.crewDesc} numberOfLines={2}>{crew.description}</ThemedText>
                                    </View>
                                </View>

                                {/* Stats */}
                                <View style={crewStyles.stats}>
                                    <View style={crewStyles.stat}>
                                        <Ionicons name="people" size={14} color="#8E8E93" />
                                        <ThemedText style={crewStyles.statText}>{crew.memberIds.length} membres</ThemedText>
                                    </View>
                                    <View style={crewStyles.stat}>
                                        <Ionicons name="flash" size={14} color={accentColor} />
                                        <ThemedText style={[crewStyles.statText, { color: accentColor }]}>{crew.xp} XP</ThemedText>
                                    </View>
                                    <View style={crewStyles.stat}>
                                        <Ionicons name="trophy" size={14} color="#FFD700" />
                                        <ThemedText style={crewStyles.statText}>Niv. {crew.level}</ThemedText>
                                    </View>
                                </View>

                                {/* Bouton */}
                                {isMember ? (
                                    <View style={[crewStyles.memberBadge]}>
                                        <Ionicons name="checkmark-circle" size={16} color="#4CD964" />
                                        <ThemedText style={crewStyles.memberText}>Membre</ThemedText>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[crewStyles.joinBtn, { backgroundColor: accentColor }, joiningId === crew.id && { opacity: 0.6 }]}
                                        onPress={() => handleJoin(crew.id)}
                                        disabled={joiningId === crew.id}
                                    >
                                        {joiningId === crew.id ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <ThemedText style={crewStyles.joinBtnText}>
                                                {crew.isPrivate ? 'Demander à rejoindre' : 'Rejoindre'}
                                            </ThemedText>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        style={[crewStyles.createPrompt, { borderColor: accentColor }]}
                        onPress={() => {
                            if (!user) { Alert.alert('Connexion requise', 'Connectez-vous d\'abord.'); return; }
                            setShowCreateModal(true);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={accentColor} />
                        <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>Créer mon crew</ThemedText>
                    </TouchableOpacity>
                </>
            )}
        </Animated.View>
    );
}

const crewStyles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        gap: 12,
    },
    cardTop: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '900',
    },
    info: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    crewName: {
        fontSize: 17,
    },
    crewDesc: {
        fontSize: 13,
        opacity: 0.6,
        lineHeight: 18,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        opacity: 0.7,
    },
    joinBtn: {
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(76,217,100,0.1)',
    },
    memberText: {
        color: '#4CD964',
        fontWeight: 'bold',
        fontSize: 15,
    },
    createPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 16,
        marginTop: 4,
    },
});

function CreateCrewModal({ visible, onClose, onSuccess, user }: {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}) {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const bgColor = isDark ? '#1C1C1E' : '#fff';
    const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textColor = isDark ? '#fff' : '#000';
    const placeholderColor = isDark ? '#666' : '#8E8E93';

    const reset = () => { setName(''); setDescription(''); setIsPrivate(false); };

    const handleSubmit = async () => {
        if (!name.trim()) { Alert.alert('Erreur', 'Le nom du crew est obligatoire.'); return; }
        if (!description.trim()) { Alert.alert('Erreur', 'La description est obligatoire.'); return; }
        setSubmitting(true);
        try {
            const { db } = await import('@/config/firebase');
            const { addDoc, collection } = await import('firebase/firestore');
            await addDoc(collection(db, 'crews'), {
                name: name.trim(),
                description: description.trim(),
                adminId: user.uid,
                memberIds: [user.uid],
                isPrivate,
                xp: 0,
                level: 1,
                createdAt: Date.now(),
                chatGroupId: '',
                recentWins: 0,
            });
            reset();
            onSuccess();
        } catch (err) {
            console.error(err);
            Alert.alert('Erreur', 'Impossible de créer le crew. Réessayez.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={[modalStyles.container, { backgroundColor: bgColor }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={modalStyles.header}>
                    <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                        <ThemedText style={{ color: '#8E8E93', fontSize: 16 }}>Annuler</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>Nouveau Crew</ThemedText>
                    <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator color={accentColor} size="small" />
                        ) : (
                            <ThemedText style={{ color: accentColor, fontSize: 16, fontWeight: 'bold' }}>Créer</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled">
                    <ThemedText style={modalStyles.label}>Nom du Crew *</ThemedText>
                    <TextInput
                        style={[modalStyles.input, { backgroundColor: inputBg, color: textColor }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Paris Ballers, Défense Supreme..."
                        placeholderTextColor={placeholderColor}
                        maxLength={40}
                    />

                    <ThemedText style={modalStyles.label}>Description *</ThemedText>
                    <TextInput
                        style={[modalStyles.input, modalStyles.textArea, { backgroundColor: inputBg, color: textColor }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Décrivez votre crew, votre style de jeu, vos objectifs..."
                        placeholderTextColor={placeholderColor}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <ThemedText style={modalStyles.label}>Visibilité</ThemedText>
                    <TouchableOpacity
                        style={[crewModalStyles.toggleRow, { backgroundColor: inputBg }]}
                        onPress={() => setIsPrivate(!isPrivate)}
                    >
                        <View style={crewModalStyles.toggleInfo}>
                            <Ionicons name={isPrivate ? 'lock-closed' : 'earth'} size={20} color={isPrivate ? '#FF9500' : '#4CD964'} />
                            <View>
                                <ThemedText type="defaultSemiBold">{isPrivate ? 'Crew Privé' : 'Crew Public'}</ThemedText>
                                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                    {isPrivate ? 'Sur invitation uniquement' : 'Tout le monde peut rejoindre'}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={[crewModalStyles.toggle, isPrivate && { backgroundColor: '#FF9500' }]}>
                            <View style={[crewModalStyles.toggleThumb, isPrivate && { transform: [{ translateX: 20 }] }]} />
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const crewModalStyles = StyleSheet.create({
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
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

function ProfileSection({ profile, onEdit }: { profile: BallerProfile | null; onEdit: () => void }) {
    const { t } = useTranslation();
    const { accentColor } = useAppTheme();
    const { user: generalUser } = useUser();

    if (!profile) {
        return (
            <Animated.View entering={FadeInDown.duration(600)} style={[styles.section, { alignItems: 'center', paddingVertical: 40, gap: 16 }]}>
                <View style={[styles.iconContainer, { backgroundColor: '#333', width: 80, height: 80, borderRadius: 40 }]}>
                    <Ionicons name="person-add" size={40} color="#666" />
                </View>
                <ThemedText type="subtitle">Profil non configuré</ThemedText>
                <ThemedText style={{ opacity: 0.6, textAlign: 'center' }}>
                    Configure ton profil Baller pour rejoindre la communauté et trouver des partenaires.
                </ThemedText>
                <TouchableOpacity 
                    style={[styles.editProfileBtn, { backgroundColor: accentColor, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24 }]}
                    onPress={onEdit}
                >
                    <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Configurer mon profil</ThemedText>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
            <View style={styles.profileHeader}>
                 <Image 
                    source={profile.photoURL || generalUser?.avatarUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400"} 
                    style={styles.profileBigAvatar}
                 />
                 <View style={styles.profileInfo}>
                    <ThemedText type="subtitle">{profile.displayName}</ThemedText>
                    <ThemedText style={styles.profileHandle}>{profile.position} • {profile.city}</ThemedText>
                    <View style={styles.verifiedBadge}>
                        <Ionicons 
                            name={profile.isVerified ? "checkmark-circle" : "star-outline"} 
                            size={16} 
                            color={profile.isVerified ? "#007AFF" : accentColor} 
                        />
                        <ThemedText style={[styles.verifiedText, !profile.isVerified && { color: accentColor }]}>
                            {profile.isVerified ? t('baller.profile.verified') : 'Statut Player'}
                        </ThemedText>
                    </View>
                 </View>
                 <TouchableOpacity onPress={onEdit} style={{ padding: 8 }}>
                    <Ionicons name="create-outline" size={24} color={accentColor} />
                 </TouchableOpacity>
            </View>

            <View style={styles.bioContainer}>
                <ThemedText style={styles.bioText}>
                    {profile.bio || "Aucune biographie renseignée."}
                </ThemedText>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <ThemedText style={styles.statVal}>{profile.skillLevel || '?'}</ThemedText>
                    <ThemedText style={styles.statLab}>OVR</ThemedText>
                </View>
                <View style={styles.statBox}>
                    <ThemedText style={styles.statVal}>{profile.height ? `${profile.height}` : '--'}</ThemedText>
                    <ThemedText style={styles.statLab}>CM</ThemedText>
                </View>
                <View style={styles.statBox}>
                    <ThemedText style={styles.statVal}>0</ThemedText>
                    <ThemedText style={styles.statLab}>RUNS</ThemedText>
                </View>
            </View>
            
        </Animated.View>
    );
}

function EditBallerProfileModal({ visible, profile, onClose, onSave }: {
    visible: boolean;
    profile: BallerProfile | null;
    onClose: () => void;
    onSave: (data: Partial<BallerProfile>) => void;
}) {
    const { user: generalUser } = useUser();
    const { accentColor } = useAppTheme();
    const isDark = useColorScheme() === 'dark';

    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [position, setPosition] = useState<PlayingPosition>('G');
    const [skillLevel, setSkillLevel] = useState('5');
    const [height, setHeight] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        if (visible) {
            setName(profile?.displayName || generalUser?.displayName || '');
            setCity(profile?.city || generalUser?.city || '');
            setPosition(profile?.position || (generalUser?.position as PlayingPosition) || 'G');
            setSkillLevel(profile?.skillLevel?.toString() || '5');
            setHeight(profile?.height?.toString() || generalUser?.height || '');
            setBio(profile?.bio || '');
        }
    }, [visible, profile, generalUser]);

    const handleSave = () => {
        if (!name || !city) {
            Alert.alert('Champs requis', 'Veuillez au moins renseigner votre nom et votre ville.');
            return;
        }
        onSave({
            displayName: name,
            city,
            position,
            skillLevel: parseInt(skillLevel) as any,
            height: parseInt(height) || 0,
            bio
        });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[modalStyles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
                <View style={modalStyles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText style={{ color: '#FF3B30' }}>Annuler</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold">Profil Baller</ThemedText>
                    <TouchableOpacity onPress={handleSave}>
                        <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>Sauver</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1, padding: 20 }}>
                    <ThemedText type="subtitle" style={{ marginBottom: 20 }}>Configurez votre profil de joueur</ThemedText>
                    
                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Nom complet</ThemedText>
                        <TextInput 
                            style={[modalStyles.input, { borderColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000' }]} 
                            placeholder="Ex: Michael Jordan"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Ville actuelle</ThemedText>
                        <TextInput 
                            style={[modalStyles.input, { borderColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000' }]} 
                            placeholder="Ex: Paris"
                            placeholderTextColor="#999"
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={[modalStyles.formGroup, { flex: 1 }]}>
                            <ThemedText style={modalStyles.label}>Position</ThemedText>
                            <View style={[modalStyles.input, { justifyContent: 'center', borderColor: isDark ? '#333' : '#eee' }]}>
                                <ThemedText>{position}</ThemedText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                    {['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'].map(p => (
                                        <TouchableOpacity 
                                            key={p} 
                                            onPress={() => setPosition(p as any)}
                                            style={{ 
                                                padding: 6, 
                                                backgroundColor: position === p ? accentColor : '#eee',
                                                borderRadius: 6,
                                                marginRight: 8
                                            }}
                                        >
                                            <ThemedText style={{ color: position === p ? '#fff' : '#000', fontSize: 12 }}>{p}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                        <View style={[modalStyles.formGroup, { flex: 1 }]}>
                            <ThemedText style={modalStyles.label}>Niveau (1-10)</ThemedText>
                            <TextInput 
                                style={[modalStyles.input, { borderColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000' }]}
                                keyboardType="numeric"
                                value={skillLevel}
                                onChangeText={setSkillLevel}
                                maxLength={2}
                            />
                        </View>
                    </View>

                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Taille (cm)</ThemedText>
                        <TextInput 
                            style={[modalStyles.input, { borderColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000' }]}
                            keyboardType="numeric"
                            placeholder="Ex: 198"
                            placeholderTextColor="#999"
                            value={height}
                            onChangeText={setHeight}
                        />
                    </View>

                    <View style={modalStyles.formGroup}>
                        <ThemedText style={modalStyles.label}>Bio</ThemedText>
                        <TextInput 
                            style={[modalStyles.input, { height: 100, textAlignVertical: 'top', borderColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000' }]}
                            multiline
                            placeholder="Décris ton jeu..."
                            placeholderTextColor="#999"
                            value={bio}
                            onChangeText={setBio}
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

function BallerCard({ baller, index }: { baller: BallerProfile; index: number }) {
    const { accentColor } = useAppTheme();
    return (
        <Animated.View 
            entering={FadeInRight.delay(index * 100)}
            style={styles.ballerCard}
        >
            {baller.photoURL ? (
                <Image source={baller.photoURL} style={styles.ballerPhoto} />
            ) : (
                <View style={[styles.ballerPhoto, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={40} color="#666" />
                </View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.ballerOverlay} />
            <View style={styles.ballerContent}>
                <ThemedText style={styles.ballerName}>{baller.displayName}</ThemedText>
                <ThemedText style={styles.ballerPos}>{baller.position} • {baller.height}cm</ThemedText>
                <View style={styles.ballerOvr}>
                    <ThemedText style={styles.ovrText}>{baller.stats?.exp || 85}</ThemedText>
                </View>
            </View>
        </Animated.View>
    );
}

function RadarView() {
    const { accentColor } = useAppTheme();
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0.8);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );
        opacity.value = withRepeat(
            withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={radarStyles.container}>
            <Animated.View style={[radarStyles.pulse, { borderColor: accentColor }, pulseStyle]} />
            <Animated.View style={[radarStyles.pulse, { borderColor: accentColor, borderRadius: 60, opacity: 0.3 }]} />
            <View style={[radarStyles.center, { backgroundColor: accentColor }]}>
                <Ionicons name="flash" size={36} color="#fff" />
            </View>
        </View>
    );
}

const radarStyles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
    },
    center: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
});

function QuickMatchModal({ visible, status, results, onClose }: {
    visible: boolean;
    status: 'searching' | 'results' | 'no_results';
    results: BallerProfile[];
    onClose: () => void;
}) {
    const { accentColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const bgColor = isDark ? '#121212' : '#fff';

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[modalStyles.container, { backgroundColor: bgColor }]}>
                {/* Header */}
                <View style={[modalStyles.header, { borderBottomWidth: 0 }]}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>Quick Match IA</ThemedText>
                    <View style={{ width: 28 }} />
                </View>

                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                    {status === 'searching' && (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 }}>
                            <RadarView />
                            <View style={{ alignItems: 'center', gap: 8 }}>
                                <ThemedText type="subtitle" style={{ textAlign: 'center' }}>Analyse de vos stats...</ThemedText>
                                <ThemedText style={{ opacity: 0.6, textAlign: 'center' }}>L'IA recherche les meilleurs partenaires à proximité selon votre OVR</ThemedText>
                            </View>
                        </View>
                    )}

                    {status === 'results' && (
                        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: 10 }}>
                            <View style={{ marginBottom: 20 }}>
                                <ThemedText type="subtitle">C'est un Match ! 🔥</ThemedText>
                                <ThemedText style={{ opacity: 0.6 }}>Voici les joueurs qui correspondent le mieux à votre profil.</ThemedText>
                            </View>
                            {results.map((baller, index) => (
                                <View key={baller.uid} style={{ marginBottom: 12 }}>
                                   <BallerCard baller={baller} index={index / 10} />
                                   <TouchableOpacity 
                                     style={matchResultStyles.chatBtn}
                                     onPress={() => Alert.alert('Match', `Voulez-vous lancer un défi à ${baller.displayName}?`)}
                                    >
                                     <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                                     <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Contacter</ThemedText>
                                   </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {status === 'no_results' && (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                            <View style={[radarStyles.center, { backgroundColor: '#FF3B30' }]}>
                                <Ionicons name="alert-circle" size={40} color="#fff" />
                            </View>
                            <View style={{ alignItems: 'center', gap: 8 }}>
                                <ThemedText type="subtitle" style={{ textAlign: 'center' }}>Aucun match direct</ThemedText>
                                <ThemedText style={{ opacity: 0.6, textAlign: 'center' }}>Pas de partenaire trouvé avec votre niveau dans votre zone pour le moment.</ThemedText>
                            </View>
                            
                            <View style={{ width: '100%', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity 
                                    style={[matchResultStyles.fallbackBtn, { borderColor: accentColor }]}
                                    onPress={() => { onClose(); /* Trigger create ad callback if we had one */ }}
                                >
                                    <Ionicons name="add-circle" size={22} color={accentColor} />
                                    <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>Créer une annonce</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[matchResultStyles.fallbackBtn, { borderColor: '#8E8E93' }]}
                                    onPress={onClose}
                                >
                                    <Ionicons name="people" size={22} color="#8E8E93" />
                                    <ThemedText style={{ opacity: 0.8, fontWeight: 'bold' }}>Chercher un Crew</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const matchResultStyles = StyleSheet.create({
    chatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        marginTop: -10, // Fuse with BallerCard bottom
        zIndex: -1,
    },
    fallbackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    }
});


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  logo: {
    width: 100,
    height: 100,
    position: 'absolute',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 45,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
    paddingTop: 15,
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    position: 'absolute',
    bottom: 35,
    left: 24,
    zIndex: 100,
  },
  heroActions: {
    marginTop: 15,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    height: 50,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    top:30,
    marginBottom:30,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    opacity: 0.8,
  },
  quickMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  quickMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  quickMatchTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickMatchDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  spotlightContainer: {
    marginTop: 10,
  },
  horizontalScroll: {
    gap: 16,
    paddingRight: 20,
  },
  ballerCard: {
    width: 140,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  ballerPhoto: {
    width: '100%',
    height: '100%',
  },
  ballerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ballerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  ballerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ballerPos: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  ballerOvr: {
    position: 'absolute',
    top: -160,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovrText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filtersBar: {
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  adTime: {
    fontSize: 10,
    opacity: 0.5,
  },
  adBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  adDesc: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 16,
  },
  adFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  adAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    gap: 8,
  },
  adActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adSecondaryAction: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    gap: 8,
  },
  adSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    gap: 4,
  },
  joinBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  profileBigAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileInfo: {
    flex: 1,
  },
  profileHandle: {
    opacity: 0.5,
    fontSize: 14,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bioContainer: {
    marginBottom: 24,
    gap: 12,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLab: {
    fontSize: 10,
    opacity: 0.4,
    fontWeight: 'bold',
    marginTop: 4,
  },
  floatingProfile: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.OS === 'ios' ? 16 : undefined,
  },
  waveContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 5,
  },
  waveSvg: {
    bottom: 0,
  },
  // Modal création d'annonce
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  modalTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
