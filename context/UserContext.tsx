import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { stripeService } from '@/services/stripeService';
import { DB_COLLECTIONS, SubscriptionPlan, UserProfile } from '@/types/user';
import { doc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

interface UserContextType {
    user: UserProfile | null;
    setPlan: (plan: SubscriptionPlan) => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    subscribe: (priceId: string) => Promise<void>;
    recordEdit: () => Promise<boolean>;
    canEdit: () => boolean;
    isSubscribing: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { profile: user, user: authUser } = useAuth();
    const [isSubscribing, setIsSubscribing] = useState(false);

    const setPlan = async (plan: SubscriptionPlan) => {
        if (!authUser) return;
        
        try {
            const userRef = doc(db, DB_COLLECTIONS.USERS, authUser.uid);
            await updateDoc(userRef, {
                plan,
                isAdFree: plan === 'elite-pro'
            });
        } catch (error) {
            console.error("Error updating plan:", error);
        }
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!authUser) return;
        try {
            const userRef = doc(db, DB_COLLECTIONS.USERS, authUser.uid);
            await updateDoc(userRef, data);
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const subscribe = async (priceId: string) => {
        if (!user || !authUser) return;
        
        setIsSubscribing(true);
        try {
            // 1. Initialize Payment Sheet (Calling Python backend via stripeService)
            // For this demo, we use a fixed amount based on priceId or default to 499
            const amount = priceId === 'elite-pro' ? 499 : 499;
            const initRes = await stripeService.initializePaymentSheet(amount, 'eur');
            
            // Note: In development/Expo Go, init might fail if key is invalid, 
            // but we proceed for the demo flow if initRes.success is returned by our service
            if (!initRes.success) {
                Alert.alert('Erreur', 'Impossible d\'initialiser le paiement.');
                return;
            }

            // 2. Open Payment Sheet
            const presentRes = await stripeService.openPaymentSheet();
            
            if (presentRes.success) {
                // Update Firestore to grant access
                await setPlan('elite-pro');
                Alert.alert('Succès', 'Félicitations ! Votre pack Elite Pro est désormais activé.');
            } else if (presentRes.error) {
                Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
            }
        } catch (error) {
            console.error("Subscription error:", error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'abonnement.');
        } finally {
            setIsSubscribing(false);
        }
    };

    const canEdit = () => {
        if (!user) return false;
        if (user.plan === 'elite-pro') return true;
        return user.editsThisMonth < 1;
    };

    const recordEdit = async () => {
        if (!user || !authUser) return false;
        if (!canEdit()) return false;

        try {
            const userRef = doc(db, DB_COLLECTIONS.USERS, authUser.uid);
            await updateDoc(userRef, {
                editsThisMonth: user.editsThisMonth + 1,
                lastEditDate: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error recording edit:", error);
            return false;
        }
    };

    return (
        <UserContext.Provider value={{ user, setPlan, updateProfile, subscribe, recordEdit, canEdit, isSubscribing }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
