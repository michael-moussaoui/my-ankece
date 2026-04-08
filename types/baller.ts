import { UserStats } from './tracker';

export type PlayingPosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G' | 'F';

export type SkillLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface BallerProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    position: PlayingPosition;
    skillLevel: SkillLevel;
    height?: number; // in cm
    weight?: number; // in kg
    city: string;
    bio?: string;
    stats?: Partial<UserStats>;
    highlights: string[]; // array of video/image URLs
    badges: string[];
    clubs: string[];
    coachIds: string[];
    isVerified: boolean;
    followingCount: number;
    followersCount: number;
    checkInCount: number;
}

export type AdType = 'run' | 'scrimmage' | 'training' | 'market';

export interface BallerAd {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    type: AdType;
    title: string;
    content: string;
    location: {
        name: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        courtId?: string;
    };
    dateTime: string;
    requirements?: {
        minLevel?: SkillLevel;
        positions?: PlayingPosition[];
    };
    price?: number;
    currency?: string;
    responsesCount: number;
    interestedIds?: string[];    // UIDs des personnes intéressées
    interestedCount?: number;    // Compteur dénormalisé
    createdAt: number;
    tags: string[];
}

export interface Crew {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    adminId: string;
    memberIds: string[];
    pendingRequests?: string[]; // UIDs des joueurs ayant fait une demande
    isPrivate: boolean;
    xp: number;
    level: number;
    createdAt: number;
    chatGroupId: string;
    recentWins: number;
}
