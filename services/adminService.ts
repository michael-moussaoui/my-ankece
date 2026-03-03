import { db } from '@/config/firebase';
import { DB_COLLECTIONS, UserProfile } from '@/types/user';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

export const adminService = {
    /**
     * Fetch all users from Firestore
     */
    async getAllUsers(): Promise<UserProfile[]> {
        const querySnapshot = await getDocs(collection(db, DB_COLLECTIONS.USERS));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserProfile));
    },

    /**
     * Update a user's subscription plan
     */
    async updateUserPlan(userId: string, plan: UserProfile['plan']): Promise<void> {
        const userRef = doc(db, DB_COLLECTIONS.USERS, userId);
        await updateDoc(userRef, {
            plan,
            isAdFree: plan === 'elite-pro'
        });
    },

    /**
     * Update a user's role
     */
    async updateUserRole(userId: string, role: UserProfile['role']): Promise<void> {
        const userRef = doc(db, DB_COLLECTIONS.USERS, userId);
        await updateDoc(userRef, { role });
    }
};
