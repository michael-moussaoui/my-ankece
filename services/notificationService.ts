import { db } from '@/config/firebase';
import { AppNotification, DB_COLLECTIONS } from '@/types/user';
import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';

/**
 * Service pour gérer les notifications applicatives
 */
export const notificationService = {
    /**
     * Envoie une notification à un utilisateur spécifique
     */
    async sendToUser(userId: string, senderId: string, title: string, message: string, type: AppNotification['type'] = 'info', data?: AppNotification['data']) {
        try {
            const newNotification: any = {
                title,
                message,
                type,
                senderId,
                createdAt: Date.now(),
                readBy: [],
                archivedBy: [],
                deletedBy: [],
            };

            if (userId) newNotification.recipientId = userId;
            if (data) newNotification.data = data;

            await addDoc(collection(db, DB_COLLECTIONS.NOTIFICATIONS), newNotification);
        } catch (error) {
            console.error('Error sending user notification:', error);
            throw error;
        }
    },

    /**
     * Envoie une notification à tous les utilisateurs (Broadcast)
     */
    async sendBroadcast(title: string, message: string, type: AppNotification['type'] = 'info') {
        try {
            const newNotification: Omit<AppNotification, 'id'> = {
                title,
                message,
                type,
                createdAt: Date.now(),
                readBy: [],
                archivedBy: [],
                deletedBy: [],
            };

            await addDoc(collection(db, DB_COLLECTIONS.NOTIFICATIONS), newNotification);
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },

    /**
     * Récupère TOUTES les notifications (pour l'admin)
     */
    subscribeToAllNotifications(callback: (notifications: AppNotification[]) => void) {
        const q = query(
            collection(db, DB_COLLECTIONS.NOTIFICATIONS),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
            callback(notifications);
        });
    },

    /**
     * Récupère les notifications actives pour un utilisateur (non supprimées)
     */
    subscribeToUserNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
        const q = query(
            collection(db, DB_COLLECTIONS.NOTIFICATIONS),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as AppNotification))
                .filter(n =>
                    (!n.recipientId || n.recipientId === userId) && // Targeted or broadcast
                    !n.deletedBy.includes(userId) // Not deleted
                );

            callback(notifications);
        });
    },

    /**
     * Marque une notification comme lue
     */
    async markAsRead(notificationId: string, userId: string) {
        const docRef = doc(db, DB_COLLECTIONS.NOTIFICATIONS, notificationId);
        await updateDoc(docRef, {
            readBy: arrayUnion(userId)
        });
    },

    /**
     * Archive une notification
     */
    async archiveNotification(notificationId: string, userId: string) {
        const docRef = doc(db, DB_COLLECTIONS.NOTIFICATIONS, notificationId);
        await updateDoc(docRef, {
            archivedBy: arrayUnion(userId)
        });
    },

    /**
     * Supprime une notification (masquée pour cet utilisateur)
     */
    async deleteNotification(notificationId: string, userId: string) {
        const docRef = doc(db, DB_COLLECTIONS.NOTIFICATIONS, notificationId);
        await updateDoc(docRef, {
            deletedBy: arrayUnion(userId)
        });
    }
};
