import { db } from '@/config/firebase';
import { Review } from '@/types/coach';
import {
    collection,
    doc,
    getDocs,
    query,
    runTransaction,
    Timestamp,
    where
} from 'firebase/firestore';

const REVIEWS_COLLECTION = 'coach_reviews';
const COACHES_COLLECTION = 'coaches';

/**
 * Add a review for a coach and update their average rating
 */
export const addReview = async (reviewData: Omit<Review, 'id'>): Promise<string> => {
    try {
        const reviewRef = collection(db, REVIEWS_COLLECTION);
        const coachRef = doc(db, COACHES_COLLECTION, reviewData.coachId);

        let newReviewId = '';

        await runTransaction(db, async (transaction) => {
            // 1. Get current coach data
            const coachDoc = await transaction.get(coachRef);
            if (!coachDoc.exists()) {
                throw new Error("Coach does not exist!");
            }

            const coachData = coachDoc.data();
            const currentRating = coachData.rating || 0;
            const currentReviewCount = coachData.reviewCount || 0;

            // 2. Calculate new rating
            const newReviewCount = currentReviewCount + 1;
            const newRating = ((currentRating * currentReviewCount) + reviewData.rating) / newReviewCount;

            // 3. Add the review
            const newReviewDoc = doc(reviewRef);
            newReviewId = newReviewDoc.id;

            const cleanReviewData: any = {
                ...reviewData,
                createdAt: Timestamp.now().toMillis(),
            };

            // Remove undefined fields
            Object.keys(cleanReviewData).forEach(key => {
                if (cleanReviewData[key] === undefined) {
                    delete cleanReviewData[key];
                }
            });

            transaction.set(newReviewDoc, cleanReviewData);

            // 4. Update the coach
            transaction.update(coachRef, {
                rating: Number(newRating.toFixed(1)),
                reviewCount: newReviewCount,
                updatedAt: Timestamp.now(),
            });
        });

        return newReviewId;
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
};

/**
 * Get all reviews for a specific coach
 */
export const getCoachReviews = async (coachId: string): Promise<Review[]> => {
    try {
        const reviewRef = collection(db, REVIEWS_COLLECTION);
        const q = query(reviewRef, where('coachId', '==', coachId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Review)).sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
};
