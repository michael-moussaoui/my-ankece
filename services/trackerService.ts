import { db } from '@/config/firebase';
import {
    DribbleSession,
    ShootingSession,
    ShotDetail,
    ShotType,
    UserStats
} from '@/types/tracker';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';

const SHOOTING_COLLECTION = 'shooting_sessions';
const DRIBBLE_COLLECTION = 'dribble_sessions';
const STATS_COLLECTION = 'user_stats';

export const trackerService = {
    // Shooting Sessions
    async saveShootingSession(userId: string, userName: string, session: Omit<ShootingSession, 'id' | 'userId' | 'date'>) {
        const docRef = await addDoc(collection(db, SHOOTING_COLLECTION), {
            ...session,
            userId,
            userName,
            date: serverTimestamp(),
        });

        await this.updateUserStats(userId, session.totalShots, session.totalMade, session.shots);
        return docRef.id;
    },

    async getShootingSessions(userId: string, limitCount = 20) {
        const q = query(
            collection(db, SHOOTING_COLLECTION),
            where('userId', '==', userId),
            orderBy('date', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShootingSession));
    },

    async getPlaygroundBestSessions(playgroundId: string, limitCount = 5) {
        const q = query(
            collection(db, SHOOTING_COLLECTION),
            where('playgroundId', '==', playgroundId),
            orderBy('totalMade', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShootingSession));
    },

    async getAllShootingSessions(userId: string) {
        const q = query(
            collection(db, SHOOTING_COLLECTION),
            where('userId', '==', userId),
            orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShootingSession));
    },

    async getDribbleSessions(userId: string) {
        const q = query(
            collection(db, DRIBBLE_COLLECTION),
            where('userId', '==', userId),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DribbleSession));
    },

    async getAggregatedStats(userId: string, timeframe: 'D' | 'W' | 'M' | 'Y') {
        // Fetch all sessions for now and group them. 
        // In production, this would be a separate daily_stats collection or a cloud function.
        const sessions = await this.getAllShootingSessions(userId);
        if (sessions.length === 0) return [];

        const groupedData: Record<string, number> = {};

        sessions.forEach(session => {
            const date = session.date?.toDate() || new Date();
            let key = '';

            if (timeframe === 'D') key = date.toISOString().split('T')[0];
            else if (timeframe === 'W') {
                // Get start of week (Monday)
                const d = new Date(date);
                const day = d.getDay() || 7;
                d.setHours(-24 * (day - 1));
                key = d.toISOString().split('T')[0];
            }
            else if (timeframe === 'M') key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            else if (timeframe === 'Y') key = `${date.getFullYear()}`;

            groupedData[key] = (groupedData[key] || 0) + session.totalMade;
        });

        // Convert to array and sort by date key
        return Object.keys(groupedData)
            .sort()
            .map(date => groupedData[date]);
    },

    // Dribble Sessions
    async saveDribbleSession(userId: string, userName: string, session: Omit<DribbleSession, 'id' | 'userId' | 'date'>) {
        const docRef = await addDoc(collection(db, DRIBBLE_COLLECTION), {
            ...session,
            userId,
            userName,
            date: serverTimestamp(),
        });
        return docRef.id;
    },

    // User Stats & Streaks
    async getUserStats(userId: string): Promise<UserStats | null> {
        const docRef = doc(db, STATS_COLLECTION, userId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as UserStats;
        }
        return null;
    },

    async updateUserStats(userId: string, shotsAdded: number, madeAdded: number, shotDetails?: ShotDetail[]) {
        const statsRef = doc(db, STATS_COLLECTION, userId);
        const currentStats = await this.getUserStats(userId);

        if (!currentStats) {
            // Initialize stats
            const shotTypeStats: Partial<Record<ShotType, { attempts: number; made: number }>> = {};
            if (shotDetails) {
                shotDetails.forEach(s => {
                    shotTypeStats[s.shotType] = { attempts: s.attempts, made: s.made };
                });
            }

            const initialStats: UserStats = {
                userId,
                dailyStreak: 1,
                lastSessionDate: serverTimestamp(),
                badges: [],
                totalShotsLifetime: shotsAdded || 0,
                totalMadeLifetime: madeAdded || 0,
                level: 'Rookie',
                exp: (shotsAdded || 0) * 10,
                shotTypeStats,
            };
            try {
                await setDoc(statsRef, initialStats);
            } catch (error) {
                console.error('Error creating initial stats:', error);
            }
            return;
        }

        // Check for streak safely
        const now = new Date();
        const lastDate = currentStats.lastSessionDate ?
            (typeof currentStats.lastSessionDate.toDate === 'function' ? currentStats.lastSessionDate.toDate() : new Date(currentStats.lastSessionDate))
            : null;

        let newStreak = currentStats.dailyStreak || 1;

        if (lastDate) {
            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak += 1;
            } else if (diffDays > 1) {
                newStreak = 1;
            }
        }

        const newTotalShots = (currentStats.totalShotsLifetime || 0) + shotsAdded;
        const newTotalMade = (currentStats.totalMadeLifetime || 0) + madeAdded;
        const newEXP = (currentStats.exp || 0) + (shotsAdded * 10);

        // Simple level logic
        let newLevel = currentStats.level || 'Rookie';
        if (newEXP > 10000) newLevel = 'Legend';
        else if (newEXP > 5000) newLevel = 'Elite';
        else if (newEXP > 2000) newLevel = 'Sniper';
        else if (newEXP > 500) newLevel = 'Shooter';

        // Badge Logic
        const newBadges = [...(currentStats.badges || [])];
        if (newTotalShots >= 1000 && !newBadges.includes('1000_shots')) newBadges.push('1000_shots');
        if (newTotalShots >= 10000 && !newBadges.includes('10000_shots')) newBadges.push('10000_shots');
        if (newStreak >= 30 && !newBadges.includes('30_days_streak')) newBadges.push('30_days_streak');

        // Update shotTypeStats
        const newShotTypeStats = { ...(currentStats.shotTypeStats || {}) };
        if (shotDetails) {
            shotDetails.forEach(s => {
                const type = s.shotType as ShotType;
                const current = newShotTypeStats[type] || { attempts: 0, made: 0 };
                newShotTypeStats[type] = {
                    attempts: current.attempts + s.attempts,
                    made: current.made + s.made
                };
            });
        }

        await updateDoc(statsRef, {
            dailyStreak: newStreak,
            lastSessionDate: serverTimestamp(),
            totalShotsLifetime: newTotalShots,
            totalMadeLifetime: newTotalMade,
            exp: newEXP,
            level: newLevel,
            badges: newBadges,
            shotTypeStats: newShotTypeStats,
        });
    }
};
