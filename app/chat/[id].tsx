import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { chatService } from '@/services/chatService';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { id: conversationId } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor } = useAppTheme();
    const tintColor = accentColor;
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!conversationId || !user) return;

        // 1. Subscribe to messages
        const unsubscribe = chatService.subscribeToMessages(conversationId, (data) => {
            setMessages(data);
            setLoading(false);
            // Mark as read when messages arrive and we are in the chat
            chatService.markAsRead(conversationId, user.uid);
        });

        return () => unsubscribe();
    }, [conversationId, user]);

    const handleDeleteMessage = (messageId: string) => {
        if (!conversationId) return;

        Alert.alert(
            "Supprimer le message",
            "Voulez-vous vraiment supprimer ce message ?",
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Supprimer", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await chatService.deleteMessage(conversationId, messageId);
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer le message.");
                        }
                    }
                }
            ]
        );
    };

    const handleSend = async () => {
        if (!inputText.trim() || !conversationId || !user || sending) return;

        setSending(true);
        try {
            await chatService.sendMessage(conversationId, user.uid, inputText.trim());
            setInputText('');
            // Scroll to end is handled by the data update usually, but can be forced if needed
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.senderId === user?.uid;

        return (
            <View style={[
                styles.messageRow,
                isMine ? styles.myMessageRow : styles.theirMessageRow
            ]}>
                <TouchableOpacity 
                    onLongPress={() => handleDeleteMessage(item.id)}
                    activeOpacity={0.7}
                    style={[
                        styles.bubble,
                        isMine ? { backgroundColor: tintColor } : { backgroundColor: colorScheme === 'dark' ? '#3A3A3C' : '#E9E9EB' }
                    ]}
                >
                    <ThemedText style={[
                        styles.messageText,
                        isMine ? { color: '#fff' } : { color: Colors[colorScheme].text }
                    ]}>
                        {item.text}
                    </ThemedText>
                    <ThemedText style={[
                        styles.timestamp,
                        isMine ? { color: 'rgba(255,255,255,0.7)' } : { color: '#8e8e93' }
                    ]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={tintColor} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ 
                headerShown: true,
                title: 'Discussion',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <Ionicons name="chevron-back" size={28} color={Colors[colorScheme].text} />
                    </TouchableOpacity>
                ),
            }} />

            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <SafeAreaView edges={['bottom']} style={[styles.inputArea, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, { color: Colors[colorScheme].text, backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#FFF' }]}
                            placeholder="Votre message..."
                            placeholderTextColor="#8e8e93"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendButton, { backgroundColor: inputText.trim() ? tintColor : '#ccc' }]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
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
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageRow: {
        marginBottom: 10,
        maxWidth: '80%',
    },
    myMessageRow: {
        alignSelf: 'flex-end',
    },
    theirMessageRow: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputArea: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#ccc',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'flex-end',
        gap: 10,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
});
