import { db } from '@/config/firebase';
import { 
    addDoc, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    serverTimestamp, 
    updateDoc, 
    where,
    orderBy,
    Timestamp,
    limit
} from 'firebase/firestore';

const REPORTS_COLLECTION = 'session_reports';
const METRICS_COLLECTION = 'player_metrics';

export interface SessionReport {
    id?: string;
    sessionId: string;
    coachId: string;
    playerId: string;
    rating: number; // 1-10
    strengths: string[];
    improvements: string[];
    recommendedDrills: string[];
    coachComment: string;
    playerNotes?: string;
    rpe?: number; // Rate of Perceived Exertion (1-10)
    media?: { url: string; type: 'image' | 'video' }[];
    createdAt: any;
}

export interface PlayerMetric {
    id?: string;
    playerId: string;
    date: any;
    category: 'shooting' | 'physical' | 'tactical' | 'game';
    metric: string; // e.g., "3pt_pct", "vertical_jump", "points_per_game"
    value: number;
    source: 'coach' | 'manual' | 'homecourt' | 'apple_health' | 'hudl';
}

export const sessionReportService = {
    /**
     * Crée un nouveau rapport de séance
     */
    async createReport(report: Omit<SessionReport, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
                ...report,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating session report:', error);
            throw error;
        }
    },

    /**
     * Récupère le rapport pour une séance spécifique
     */
    async getReportBySessionId(sessionId: string): Promise<SessionReport | null> {
        try {
            const q = query(collection(db, REPORTS_COLLECTION), where('sessionId', '==', sessionId), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                return { id: snapshot.docs[0].id, ...data } as SessionReport;
            }
            return null;
        } catch (error) {
            console.error('Error fetching session report:', error);
            return null;
        }
    },

    /**
     * Récupère tous les rapports d'un joueur
     */
    async getPlayerReports(playerId: string): Promise<SessionReport[]> {
        try {
            const q = query(
                collection(db, REPORTS_COLLECTION), 
                where('playerId', '==', playerId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionReport));
        } catch (error) {
            console.error('Error fetching player reports:', error);
            return [];
        }
    },

    /**
     * Enregistre une métrique de progression
     */
    async saveMetric(metric: Omit<PlayerMetric, 'id' | 'date'>) {
        try {
            await addDoc(collection(db, METRICS_COLLECTION), {
                ...metric,
                date: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error saving metric:', error);
            throw error;
        }
    },

    /**
     * Récupère les métriques pour un dashboard
     */
    async getPlayerMetrics(playerId: string, category?: string): Promise<PlayerMetric[]> {
        try {
            let q = query(
                collection(db, METRICS_COLLECTION),
                where('playerId', '==', playerId),
                orderBy('date', 'asc')
            );
            
            if (category) {
                q = query(q, where('category', '==', category));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlayerMetric));
        } catch (error) {
            console.error('Error fetching player metrics:', error);
            return [];
        }
    },

    /**
     * Met à jour le ressenti du joueur (Player Log)
     */
    async updatePlayerNotes(reportId: string, playerNotes: string, rpe: number) {
        try {
            const docRef = doc(db, REPORTS_COLLECTION, reportId);
            await updateDoc(docRef, {
                playerNotes,
                rpe,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating player notes:', error);
            throw error;
        }
    }
};
