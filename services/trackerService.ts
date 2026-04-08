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
const AI_COLLECTION = 'ai_sessions';
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
        const sessions = await this.getAllShootingSessions(userId);
        if (sessions.length === 0) return { volume: [], accuracy: [] };

        // Better date parsing (handles Firestore Timestamps, JS Dates, strings, etc.)
        const parseDate = (d: any): Date => {
            if (!d) return new Date();
            if (d.toDate && typeof d.toDate === 'function') return d.toDate();
            if (d instanceof Date) return d;
            if (d.seconds) return new Date(d.seconds * 1000);
            const date = new Date(d);
            return isNaN(date.getTime()) ? new Date() : date;
        };

        // For 'D', we show individual sessions (last 20) instead of aggregate by day
        // This makes sure multiple sessions today show as multiple points.
        if (timeframe === 'D') {
            const sorted = [...sessions].sort((a, b) => 
                parseDate(a.date).getTime() - parseDate(b.date).getTime()
            );
            
            const recent = sorted.slice(-20);
            return {
                volume: recent.map(s => s.totalMade || 0),
                accuracy: recent.map(s => s.totalShots > 0 ? Math.round(((s.totalMade || 0) / s.totalShots) * 100) : 0)
            };
        }

        const groupedAttempts: Record<string, number> = {};
        const groupedMade: Record<string, number> = {};

        sessions.forEach(session => {
            const date = parseDate(session.date);
            let key = '';

            if (timeframe === 'W') {
                const d = new Date(date);
                const day = d.getDay() || 7;
                d.setHours(-24 * (day - 1));
                key = d.toISOString().split('T')[0];
            }
            else if (timeframe === 'M') key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            else if (timeframe === 'Y') key = `${date.getFullYear()}`;

            groupedMade[key] = (groupedMade[key] || 0) + (session.totalMade || 0);
            groupedAttempts[key] = (groupedAttempts[key] || 0) + (session.totalShots || 0);
        });

        const sortedKeys = Object.keys(groupedMade).sort();
        
        const volume = sortedKeys.map(key => groupedMade[key]);
        const accuracy = sortedKeys.map(key => {
            const attempts = groupedAttempts[key] || 0;
            const made = groupedMade[key] || 0;
            return attempts > 0 ? Math.round((made / attempts) * 100) : 0;
        });

        return { volume, accuracy };
    },

    async getUnifiedActivity(userId: string, limitCount = 10) {
        const [shooting, dribble, ai] = await Promise.all([
            getDocs(query(collection(db, SHOOTING_COLLECTION), where('userId', '==', userId), orderBy('date', 'desc'), limit(limitCount))),
            getDocs(query(collection(db, DRIBBLE_COLLECTION), where('userId', '==', userId), orderBy('date', 'desc'), limit(limitCount))),
            getDocs(query(collection(db, AI_COLLECTION), where('userId', '==', userId), orderBy('date', 'desc'), limit(limitCount)))
        ]);

        const activities: any[] = [
            ...shooting.docs.map(doc => ({ id: doc.id, activityType: 'shooting', ...doc.data() })),
            ...dribble.docs.map(doc => ({ id: doc.id, activityType: 'dribble', ...doc.data() })),
            ...ai.docs.map(doc => ({ id: doc.id, activityType: 'ai', ...doc.data() }))
        ];

        return activities
            .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
            .slice(0, limitCount);
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

    async saveAiSession(userId: string, type: 'shot' | 'session' | 'dribble', results: any) {
        const docRef = await addDoc(collection(db, AI_COLLECTION), {
            userId,
            type,
            results,
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
