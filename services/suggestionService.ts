import { db } from '@/config/firebase';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { uploadImageToCloudinary } from './cloudinaryService';

export interface PlaygroundSuggestion {
    id: string;
    name: string;
    lat: number;
    lon: number;
    photoUrl: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

const COLLECTION_NAME = 'playground_suggestions';

export const suggestionService = {
    /**
     * Submit a new playground suggestion
     */
    async submitSuggestion(
        name: string,
        photoUri: string,
        lat: number,
        lon: number,
        userId: string
    ): Promise<string> {
        try {
            // 1. Upload photo to Cloudinary
            const photoUrl = await uploadImageToCloudinary(photoUri);
            if (!photoUrl) throw new Error('Failed to upload photo');

            // 2. Save suggestion to Firestore
            const suggestionsRef = collection(db, COLLECTION_NAME);
            const docRef = await addDoc(suggestionsRef, {
                name,
                lat,
                lon,
                photoUrl,
                userId,
                status: 'pending',
                createdAt: Timestamp.now(),
            });

            return docRef.id;
        } catch (error) {
            console.error('Error submitting suggestion:', error);
            throw error;
        }
    },

    /**
     * Get pending suggestions for admin
     */
    async getPendingSuggestions(): Promise<PlaygroundSuggestion[]> {
        try {
            const suggestionsRef = collection(db, COLLECTION_NAME);
            const q = query(
                suggestionsRef,
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PlaygroundSuggestion));
        } catch (error) {
            console.error('Error fetching pending suggestions:', error);
            throw error;
        }
    },

    /**
     * Get approved suggestions for the map
     */
    async getApprovedSuggestions(): Promise<PlaygroundSuggestion[]> {
        try {
            const suggestionsRef = collection(db, COLLECTION_NAME);
            const q = query(suggestionsRef, where('status', '==', 'approved'));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PlaygroundSuggestion));
        } catch (error) {
            console.error('Error fetching approved suggestions:', error);
            return [];
        }
    },

    /**
     * Update suggestion status (Admin only)
     */
    async updateSuggestionStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, { status });
        } catch (error) {
            console.error('Error updating suggestion status:', error);
            throw error;
        }
    }
};
