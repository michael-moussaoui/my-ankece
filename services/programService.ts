import { db } from '@/config/firebase';
import { 
    addDoc, 
    collection, 
    deleteDoc, 
    doc, 
    getDoc,
    getDocs, 
    query, 
    serverTimestamp, 
    updateDoc, 
    where,
    orderBy
} from 'firebase/firestore';

const PROGRAMS_COLLECTION = 'coaching_programs';

export interface Drill {
    id: string;
    name: string;
    description: string;
    sets: string;
    reps: string;
    duration: string;
    intensity: 'low' | 'medium' | 'high';
    videoUrl?: string;
}

export interface ProgramSession {
    id: string;
    title: string;
    description?: string;
    drills: Drill[];
}

export interface CoachingProgram {
    id?: string;
    coachId: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    durationWeeks: number;
    sessions: ProgramSession[];
    createdAt?: any;
    updatedAt?: any;
    salesCount?: number;
}

export const programService = {
    async createProgram(programData: Omit<CoachingProgram, 'id' | 'createdAt' | 'updatedAt' | 'salesCount'>) {
        try {
            const docRef = await addDoc(collection(db, PROGRAMS_COLLECTION), {
                ...programData,
                salesCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating program:', error);
            throw error;
        }
    },

    async getCoachPrograms(coachId: string): Promise<CoachingProgram[]> {
        try {
            const q = query(
                collection(db, PROGRAMS_COLLECTION),
                where('coachId', '==', coachId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingProgram));
        } catch (error) {
            console.error('Error fetching coach programs:', error);
            return [];
        }
    },

    async getProgramById(programId: string): Promise<CoachingProgram | null> {
        try {
            const docRef = doc(db, PROGRAMS_COLLECTION, programId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() } as CoachingProgram;
            }
            return null;
        } catch (error) {
            console.error('Error fetching program by ID:', error);
            throw error;
        }
    },

    async updateProgram(programId: string, updates: Partial<CoachingProgram>) {
        try {
            const docRef = doc(db, PROGRAMS_COLLECTION, programId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating program:', error);
            throw error;
        }
    },

    async deleteProgram(programId: string) {
        try {
            await deleteDoc(doc(db, PROGRAMS_COLLECTION, programId));
        } catch (error) {
            console.error('Error deleting program:', error);
            throw error;
        }
    }
};
