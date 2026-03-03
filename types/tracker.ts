export type ShotType =
    | '3pt'
    | 'ft'
    | 'mid'
    | 'catch_shoot'
    | 'pull_up'
    | 'step_back'
    | 'fadeaway';

export interface ShotDetail {
    shotType: ShotType;
    attempts: number;
    made: number;
}

export interface ShootingSession {
    id: string;
    userId: string;
    date: any; // Firestore Timestamp
    playgroundId?: string;
    userName?: string;
    type: 'training' | 'match';
    duration: number; // in seconds
    totalShots: number;
    totalMade: number;
    shots: ShotDetail[];
}

export type DribbleDifficulty = 'rookie' | 'pro' | 'elite';

export interface DribbleSession {
    id: string;
    userId: string;
    date: any; // Firestore Timestamp
    comboType: string;
    repetitions: number;
    duration: number; // in seconds
    difficulty: DribbleDifficulty;
    playgroundId?: string;
    userName?: string;
}

export type PlayerLevel = 'Rookie' | 'Shooter' | 'Sniper' | 'Elite' | 'Legend';

export type ChallengeBadge = 'Challenger' | 'Master Challenger' | 'Legend Challenger';

export interface UserStats {
    userId: string;
    dailyStreak: number;
    lastSessionDate: any; // Firestore Timestamp
    badges: string[];
    totalShotsLifetime: number;
    totalMadeLifetime: number;
    level: PlayerLevel;
    exp: number;
    challengePoints?: number;
    challengeParticipations?: number;
    challengesCreated?: number;
    challengeBadges?: ChallengeBadge[];
    shotTypeStats?: Partial<Record<ShotType, { attempts: number; made: number }>>;
}
