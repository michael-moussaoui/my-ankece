import { db } from '@/config/firebase';
import { Challenge, ChallengeParticipation } from '@/types/challenge';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';

const CHALLENGES_COLLECTION = 'challenges';
const PARTICIPATIONS_COLLECTION = 'challenge_participations';
const STATS_COLLECTION = 'user_stats';

export const challengeService = {
    // Create a new challenge
    async createChallenge(userId: string, userName: string, challengeData: Omit<Challenge, 'id' | 'creatorId' | 'creatorName' | 'status' | 'createdAt' | 'participantsCount'>) {
        const challengeRef = collection(db, CHALLENGES_COLLECTION);
        const docRef = await addDoc(challengeRef, {
            ...challengeData,
            creatorId: userId,
            creatorName: userName,
            status: 'active',
            createdAt: serverTimestamp(),
            participantsCount: 0,
        });

        // Update creator stats
        const statsRef = doc(db, STATS_COLLECTION, userId);
        await updateDoc(statsRef, {
            challengesCreated: increment(1)
        });

        return docRef.id;
    },

    // Get active challenges
    async getChallenges(limitCount = 20) {
        const q = query(
            collection(db, CHALLENGES_COLLECTION),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
    },

    // Participate in a challenge
    async participateInChallenge(challengeId: string, participantId: string, participantName: string, isSuccess: boolean) {
        return await runTransaction(db, async (transaction) => {
            const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
            const challengeSnap = await transaction.get(challengeRef);

            if (!challengeSnap.exists()) {
                throw new Error('Challenge non trouvé');
            }

            const challengeData = challengeSnap.data() as Challenge;

            // 1. Create participation record
            const pointsEarned = isSuccess ? challengeData.pointsSuccess : challengeData.pointsFailure;
            const participationRef = doc(collection(db, PARTICIPATIONS_COLLECTION));

            transaction.set(participationRef, {
                challengeId,
                participantId,
                participantName,
                isSuccess,
                pointsEarned,
                completedAt: serverTimestamp(),
            });

            // 2. Update challenge participant count
            transaction.update(challengeRef, {
                participantsCount: increment(1)
            });

            // 3. Update participant stats (Challenge points & participations)
            const participantStatsRef = doc(db, STATS_COLLECTION, participantId);
            transaction.update(participantStatsRef, {
                challengePoints: increment(pointsEarned),
                challengeParticipations: increment(1)
            });

            // 4. Update creator stats (Passive points for having participants)
            if (challengeData.creatorId !== participantId) {
                const creatorStatsRef = doc(db, STATS_COLLECTION, challengeData.creatorId);
                transaction.update(creatorStatsRef, {
                    challengePoints: increment(challengeData.pointsCreator || 5)
                });
            }

            return { pointsEarned };
        });
    },

    // Get participations for a challenge
    async getChallengeParticipations(challengeId: string) {
        const q = query(
            collection(db, PARTICIPATIONS_COLLECTION),
            where('challengeId', '==', challengeId),
            orderBy('completedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeParticipation));
    }
};
