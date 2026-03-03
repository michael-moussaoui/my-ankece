import { db } from '@/config/firebase';
import { notificationService } from '@/services/notificationService';
import { Conversation, Message } from '@/types/chat';
import { UserProfile } from '@/types/user';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

export const chatService = {
    /**
     * Get or create a unique conversation between two users
     */
    getOrCreateConversation: async (user1: UserProfile, user2: UserProfile): Promise<string> => {
        const conversationId = [user1.id, user2.id].sort().join('_');
        const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) {
            const newConversation: Omit<Conversation, 'id'> = {
                participants: [user1.id, user2.id],
                participantProfiles: {
                    [user1.id]: {
                        displayName: user1.pseudo || user1.displayName,
                        avatarUrl: user1.avatarUrl,
                    },
                    [user2.id]: {
                        displayName: user2.pseudo || user2.displayName,
                        avatarUrl: user2.avatarUrl,
                    }
                },
                updatedAt: Date.now(),
                unreadCount: {
                    [user1.id]: 0,
                    [user2.id]: 0
                }
            };
            await setDoc(convRef, newConversation);
        }
        return conversationId;
    },

    /**
     * Send a message in a conversation
     */
    sendMessage: async (conversationId: string, senderId: string, text: string): Promise<void> => {
        const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
        const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

        // 1. Add the message
        await addDoc(messagesRef, {
            senderId,
            text,
            createdAt: Date.now(),
            read: false
        });

        // 2. Update conversation summary
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
            const data = convSnap.data();
            const recipientId = data.participants.find((id: string) => id !== senderId);

            await updateDoc(convRef, {
                lastMessage: {
                    text,
                    senderId,
                    createdAt: Date.now()
                },
                updatedAt: Date.now(),
                [`unreadCount.${recipientId}`]: increment(1)
            });

            // 3. Send notification to the recipient
            const senderProfile = data.participantProfiles[senderId];
            await notificationService.sendToUser(
                recipientId,
                senderId,
                `Message de ${senderProfile?.displayName || 'un utilisateur'}`,
                text,
                'info',
                {
                    screen: '/chat/[id]',
                    params: { id: conversationId }
                }
            );
        }
    },

    /**
     * Subscribe to messages in a conversation (real-time)
     */
    subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => {
        const q = query(
            collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            callback(messages.reverse());
        });
    },

    /**
     * Subscribe to user's conversations (real-time)
     */
    subscribeToConversations: (userId: string, callback: (conversations: Conversation[]) => void) => {
        const q = query(
            collection(db, CONVERSATIONS_COLLECTION),
            where('participants', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Conversation));
            callback(conversations);
        });
    },

    /**
     * Mark messages as read in a conversation
     */
    markAsRead: async (conversationId: string, userId: string): Promise<void> => {
        const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        await updateDoc(convRef, {
            [`unreadCount.${userId}`]: 0
        });

        // Optionally mark individual messages as read if needed for UI dots per message
    },

    /**
     * Delete a specific message
     */
    deleteMessage: async (conversationId: string, messageId: string) => {
        try {
            await deleteDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    },

    /**
     * Delete an entire conversation and all its messages
     */
    deleteConversation: async (conversationId: string) => {
        try {
            // First, delete all messages in the subcollection
            const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
            const messagesSnapshot = await getDocs(messagesRef);

            const batch = writeBatch(db);
            messagesSnapshot.docs.forEach((messageDoc) => {
                batch.delete(messageDoc.ref);
            });

            // Then delete the conversation document itself
            batch.delete(doc(db, CONVERSATIONS_COLLECTION, conversationId));

            await batch.commit();
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    },

    /**
     * Subscribe to total unread count for a user across all conversations
     */
    subscribeToTotalUnreadCount: (userId: string, callback: (total: number) => void) => {
        const q = query(
            collection(db, CONVERSATIONS_COLLECTION),
            where('participants', 'array-contains', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const total = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data() as Conversation;
                return acc + (data.unreadCount?.[userId] || 0);
            }, 0);
            callback(total);
        });
    }
};
