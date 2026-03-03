import { db } from '@/config/firebase';
import { ConnectionRequest, DB_COLLECTIONS, UserProfile } from '@/types/user';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    documentId,
    getDoc,
    getDocs,
    limit,
    query,
    updateDoc,
    where
} from 'firebase/firestore';

export const connectionService = {
    /**
     * Send a connection request to another user
     */
    sendConnectionRequest: async (fromUser: UserProfile, toUser: UserProfile) => {
        const requestData: Omit<ConnectionRequest, 'id'> = {
            fromId: fromUser.id,
            fromName: fromUser.pseudo || fromUser.displayName,
            fromPhoto: fromUser.avatarUrl,
            toId: toUser.id,
            toName: toUser.pseudo || toUser.displayName,
            toPhoto: toUser.avatarUrl,
            status: 'pending',
            members: [fromUser.id, toUser.id].sort(), // Sorted for consistency
            createdAt: Date.now(),
        };

        const docRef = await addDoc(collection(db, DB_COLLECTIONS.CONNECTION_REQUESTS), requestData);
        return docRef.id;
    },

    /**
     * Accept a connection request
     */
    acceptConnectionRequest: async (requestId: string) => {
        const requestRef = doc(db, DB_COLLECTIONS.CONNECTION_REQUESTS, requestId);
        await updateDoc(requestRef, { status: 'accepted' });
    },

    /**
     * Reject a connection request
     */
    rejectConnectionRequest: async (requestId: string) => {
        const requestRef = doc(db, DB_COLLECTIONS.CONNECTION_REQUESTS, requestId);
        await updateDoc(requestRef, { status: 'rejected' });
    },

    /**
     * Cancel/Delete a connection request
     */
    cancelConnectionRequest: async (requestId: string) => {
        await deleteDoc(doc(db, DB_COLLECTIONS.CONNECTION_REQUESTS, requestId));
    },

    /**
     * Get the connection status between two users
     */
    getConnectionStatus: async (currentUserId: string, targetUserId: string) => {
        const q = query(
            collection(db, DB_COLLECTIONS.CONNECTION_REQUESTS),
            where('members', 'array-contains', currentUserId),
        );

        const querySnapshot = await getDocs(q);
        const request = querySnapshot.docs.find(doc => {
            const data = doc.data() as ConnectionRequest;
            return data.members.includes(targetUserId);
        });

        if (request) {
            const data = request.data() as ConnectionRequest;
            if (data.status === 'accepted') {
                return { status: 'connected' as const };
            }
            return {
                status: 'pending' as const,
                id: request.id,
                isSender: data.fromId === currentUserId
            };
        }

        return { status: 'none' as const };
    },

    /**
     * Get all received pending requests for a user
     */
    getReceivedRequests: async (userId: string) => {
        const q = query(
            collection(db, DB_COLLECTIONS.CONNECTION_REQUESTS),
            where('members', 'array-contains', userId),
            where('toId', '==', userId),
            where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ConnectionRequest));
    },

    /**
     * Get all sent pending requests for a user
     */
    getSentRequests: async (userId: string) => {
        const q = query(
            collection(db, DB_COLLECTIONS.CONNECTION_REQUESTS),
            where('members', 'array-contains', userId),
            where('fromId', '==', userId),
            where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ConnectionRequest));
    },

    /**
     * Get all established connections (accepted requests)
     */
    getAcceptedConnections: async (userId: string) => {
        const q = query(
            collection(db, DB_COLLECTIONS.CONNECTION_REQUESTS),
            where('members', 'array-contains', userId),
            where('status', '==', 'accepted')
        );

        const querySnapshot = await getDocs(q);
        const connectionRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));

        // Extract the other user IDs
        const otherUserIds = connectionRequests.map(req =>
            req.fromId === userId ? req.toId : req.fromId
        );

        if (otherUserIds.length === 0) return [];

        // Fetch their profiles
        return connectionService.getProfilesByIds(otherUserIds);
    },

    /**
     * Get a user profile by ID
     */
    getUserProfile: async (userId: string) => {
        const userDoc = await getDoc(doc(db, DB_COLLECTIONS.USERS, userId));
        return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as UserProfile : null;
    },

    /**
     * Get all users except the current one for discovery (limited to 50 for performance)
     */
    getAllUsersExceptMe: async (currentUserId: string) => {
        const q = query(
            collection(db, DB_COLLECTIONS.USERS),
            limit(50)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as UserProfile))
            .filter(u => u.id !== currentUserId);
    },

    /**
     * Get multiple user profiles by IDs
     */
    getProfilesByIds: async (userIds: string[]) => {
        if (!userIds || userIds.length === 0) return [];

        const q = query(
            collection(db, DB_COLLECTIONS.USERS),
            where(documentId(), 'in', userIds)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserProfile));
    }
};
