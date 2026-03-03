import { Timestamp } from 'firebase/firestore';

export type ChallengeStatus = 'active' | 'completed' | 'expired';

export interface Challenge {
    id: string;
    creatorId: string;
    creatorName: string;
    title: string;
    description: string;
    objective: string;
    pointsSuccess: number;
    pointsFailure: number;
    pointsCreator: number; // Points awarded to creator when someone participates
    status: ChallengeStatus;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
    participantsCount: number;
}

export interface ChallengeParticipation {
    id: string;
    challengeId: string;
    participantId: string;
    participantName: string;
    isSuccess: boolean;
    pointsEarned: number;
    completedAt: Timestamp;
    feedback?: string;
}
