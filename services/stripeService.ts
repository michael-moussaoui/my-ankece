import { db } from '@/config/firebase';
import { DB_COLLECTIONS } from '@/types/user';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { doc, getDoc } from 'firebase/firestore';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// NOTE: In a real app, the publishable key should be in a .env file or fetched from a config service.
const API_URL = 'http://10.0.2.2:8000'; // For Android emulator. Use YOUR_IP for physical devices.

let mockModalCallback: ((success: boolean) => void) | null = null;
let setMockVisible: ((visible: boolean, amount: number) => void) | null = null;

export const stripeService = {
    /**
     * Internal: Connect the UI modal to the service
     */
    registerMockModal: (setter: (visible: boolean, amount: number) => void) => {
        setMockVisible = setter;
    },

    /**
     * Internal: Handle callback from the UI modal
     */
    handleMockPayment: (success: boolean) => {
        if (mockModalCallback) {
            mockModalCallback(success);
            mockModalCallback = null;
        }
    },

    /**
     * Initializes the payment sheet by calling your backend to get the necessary keys.
     */
    async initializePaymentSheet(amount: number = 500, currency: string = 'eur') {
        if (isExpoGo) {
            console.log('Skipping Stripe initialization (Expo Go) - Using Mock');
            (this as any)._lastAmount = amount;
            return { success: true };
        }

        try {
            // Dynamic require to avoid top-level crash in Expo Go
            const Stripe = require('@stripe/stripe-react-native');
            if (!Stripe) throw new Error('Stripe module not found');

            const { initPaymentSheet } = Stripe;

            // 1. Call Python backend to create PaymentIntent
            const response = await fetch(`${API_URL}/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount, currency }),
            });

            const { clientSecret, publishableKey, error: backendError } = await response.json();

            if (backendError) {
                console.error('Backend Error:', backendError);
                return { success: false, error: backendError };
            }

            // 2. Initialize Payment Sheet
            const { error } = await initPaymentSheet({
                merchantDisplayName: 'Ankece PRO',
                paymentIntentClientSecret: clientSecret,
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: {
                    name: 'Utilisateur Ankece',
                }
            });

            if (error) {
                console.warn('Stripe Init Error:', error);
                return { success: false, error };
            }
            return { success: true };
        } catch (e) {
            console.error('Initialize payment sheet exception:', e);
            return { success: false, error: e };
        }
    },

    /**
     * Displays the payment sheet to the user.
     */
    async openPaymentSheet() {
        if (isExpoGo) {
            console.log('Opening Mock Payment Sheet (Expo Go)');
            return new Promise((resolve) => {
                mockModalCallback = (success) => {
                    if (success) resolve({ success: true });
                    else resolve({ canceled: true });
                };
                if (setMockVisible) {
                    setMockVisible(true, (this as any)._lastAmount || 500);
                } else {
                    console.warn('MockStripeModal not registered! Auto-success fallback.');
                    resolve({ success: true });
                }
            });
        }

        try {
            const Stripe = require('@stripe/stripe-react-native');
            if (!Stripe) throw new Error('Stripe module not found');

            const { presentPaymentSheet } = Stripe;
            const { error } = await presentPaymentSheet();

            if (error) {
                if (error.code === 'Canceled') {
                    return { canceled: true };
                }
                console.error(`Error presenting payment sheet: ${error.code}`, (error as any).message);
                return { error };
            } else {
                return { success: true };
            }
        } catch (e) {
            console.warn('Stripe openPaymentSheet exception:', e);
            return { success: false, error: e };
        }
    },

    /**
     * Fetches the current subscription status from Firestore.
     * This is typically updated via Stripe Webhooks.
     */
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
    }
};
