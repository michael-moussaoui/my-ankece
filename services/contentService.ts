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
    limit,
    Timestamp,
    deleteDoc,
    setDoc
} from 'firebase/firestore';

/**
 * Service for managing training academy content (Invasion Store)
 * Force reload: 2026-03-31T22:05:00Z
 */

const DRILLS_COLLECTION = 'drills_library';
const PROGRAMS_COLLECTION = 'training_programs';
const LIVES_COLLECTION = 'live_sessions';
const PURCHASES_COLLECTION = 'content_purchases';
const PROGRESS_COLLECTION = 'academy_progress';

export interface ChecklistItem {
    id: string;
    label: string;
}

export interface Drill {
    id?: string;
    coachId: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: string; // e.g., "5:00"
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    position?: string[]; // e.g., ["PG", "SG"]
    tags: string[]; // e.g., ["Shoot", "Handles"]
    createdAt: any;
}

export interface Lesson {
    id: string;
    title: string;
    content: string; // Contenu Markdown
    imageUrl?: string;
    videoUrl?: string;
    drills?: string[]; // IDs des exercices associés
    checklist?: ChecklistItem[]; // Liste des objectifs à cocher
}

export interface Module {
    id: string;
    title: string;
    duration?: string; // e.g., "4 semaines"
    lessons: Lesson[];
}

export interface TrainingProgram {
    id?: string;
    coachId: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    weeksCount: number;
    difficulty: string;
    thumbnailUrl: string;
    drills: string[]; // Liste globale des IDs d'exercices
    modules?: Module[]; // Structure riche par phases/modules
    enrolledCount: number;
    rating: number;
    status: 'draft' | 'published';
    createdAt: any;
}

export const contentService = {
    /**
     * Drills Management
     */
    async createDrill(drill: Omit<Drill, 'id' | 'createdAt'>) {
        return await addDoc(collection(db, DRILLS_COLLECTION), {
            ...drill,
            createdAt: serverTimestamp()
        });
    },

    async getCoachDrills(coachId: string): Promise<Drill[]> {
        const q = query(collection(db, DRILLS_COLLECTION), where('coachId', '==', coachId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drill));
    },

    /**
     * Programs Management
     */
    async createProgram(program: Omit<TrainingProgram, 'id' | 'createdAt' | 'enrolledCount' | 'rating'>) {
        return await addDoc(collection(db, PROGRAMS_COLLECTION), {
            ...program,
            enrolledCount: 0,
            rating: 0,
            createdAt: serverTimestamp()
        });
    },

    async upsertProgram(id: string, program: any) {
        const docRef = doc(db, PROGRAMS_COLLECTION, id);
        return await setDoc(docRef, {
            ...program,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    async getCoachPrograms(coachId: string): Promise<TrainingProgram[]> {
        console.log('Fetching coach programs for:', coachId);
        const q = query(
            collection(db, PROGRAMS_COLLECTION), 
            where('coachId', '==', coachId), 
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingProgram));
    },

    async getPublishedPrograms(): Promise<TrainingProgram[]> {
        const q = query(collection(db, PROGRAMS_COLLECTION), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingProgram));
    },

    async getProgramById(id: string): Promise<TrainingProgram | null> {
        if (!id) return null;
        const docRef = doc(db, PROGRAMS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as TrainingProgram : null;
    },

    async updateProgram(id: string, updates: Partial<TrainingProgram>) {
        const docRef = doc(db, PROGRAMS_COLLECTION, id);
        return await updateDoc(docRef, updates);
    },

    async getDrillById(id: string): Promise<Drill | null> {
        if (!id) return null;
        const docRef = doc(db, DRILLS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Drill : null;
    },

    async getDrillsByIds(ids: string[]): Promise<Drill[]> {
        if (!ids || ids.length === 0) return [];
        // Firestore 'in' query is limited to 10 items.
        // For simplicity, we fetch them individually or chunked if needed.
        const drills = await Promise.all(
            ids.map(id => this.getDrillById(id))
        );
        return drills.filter(d => d !== null) as Drill[];
    },

    async updateDrill(id: string, updates: Partial<Drill>) {
        const docRef = doc(db, DRILLS_COLLECTION, id);
        return await updateDoc(docRef, updates);
    },

    async deleteDrill(id: string) {
        const docRef = doc(db, DRILLS_COLLECTION, id);
        return await deleteDoc(docRef);
    },

    async deleteProgram(id: string) {
        const docRef = doc(db, PROGRAMS_COLLECTION, id);
        return await deleteDoc(docRef);
    },

    /**
     * Purchases & Access
     */
    async getUserPurchases(userId: string): Promise<string[]> {
        const q = query(collection(db, PURCHASES_COLLECTION), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data().contentId);
    },

    async checkAccess(userId: string, programId: string): Promise<boolean> {
        const q = query(
            collection(db, PURCHASES_COLLECTION), 
            where('userId', '==', userId), 
            where('contentId', '==', programId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    },

    async recordPurchase(userId: string, contentId: string, type: 'program' | 'live') {
        return await addDoc(collection(db, PURCHASES_COLLECTION), {
            userId,
            contentId,
            contentType: type,
            purchasedAt: serverTimestamp()
        });
    },

    /**
     * Progress Tracking
     */
    async saveLessonProgress(userId: string, programId: string, lessonId: string, completedItemIds: string[]) {
        const docId = `${userId}_${programId}`;
        const docRef = doc(db, PROGRESS_COLLECTION, docId);

        return await setDoc(docRef, {
            userId,
            programId,
            progress: {
                [lessonId]: completedItemIds
            },
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    async getProgramProgress(userId: string, programId: string): Promise<Record<string, string[]>> {
        const q = query(
            collection(db, PROGRESS_COLLECTION), 
            where('userId', '==', userId), 
            where('programId', '==', programId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return {};
        return snapshot.docs[0].data().progress || {};
    }
};
