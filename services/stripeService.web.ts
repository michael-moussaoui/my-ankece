/**
 * Web stub for stripeService — Stripe React Native is native-only.
 * Metro automatically picks this file over stripeService.ts on web builds.
 */

import { db } from '@/config/firebase';
import { DB_COLLECTIONS } from '@/types/user';
import { doc, getDoc } from 'firebase/firestore';

export const stripeService = {
    async initializePaymentSheet(_userId: string, _priceId: string) {
        console.warn('Stripe is not available on web.');
        return { success: false, error: 'Stripe not available on web' };
    },

    async openPaymentSheet() {
        console.warn('Stripe is not available on web.');
        return { success: false, error: 'Stripe not available on web' };
    },

    async getSubscriptionStatus(userId: string) {
        try {
            const userRef = doc(db, DB_COLLECTIONS.USERS, userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    status: data.subscriptionStatus || 'none',
                    plan: data.plan || 'essential',
                    currentPeriodEnd: data.currentPeriodEnd || null,
                };
            }
            return null;
        } catch (e) {
            console.error('Error fetching subscription status:', e);
            return null;
        }
    },
};
