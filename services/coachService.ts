import { db } from '@/config/firebase';
import { Coach } from '@/types/coach';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { notificationService } from './notificationService';

const COACHES_COLLECTION = 'coaches';

/**
 * Create a new coach profile with pending status
 */
export const createCoachProfile = async (coachData: Omit<Coach, 'id' | 'status' | 'rating' | 'reviewCount' | 'studentCount'>): Promise<string> => {
    try {
        const coachesRef = collection(db, COACHES_COLLECTION);
        const docRef = await addDoc(coachesRef, {
            ...coachData,
            status: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            rating: 0,
            reviewCount: 0,
            studentCount: 0,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating coach profile:', error);
        throw error;
    }
};

/**
 * Update an existing coach profile
 * If profile is already active, store changes in pendingUpdate instead of overwriting
 */
export const updateCoachProfile = async (coachId: string, coachData: Partial<Coach>): Promise<void> => {
    try {
        const coachRef = doc(db, COACHES_COLLECTION, coachId);
        const coachSnap = await getDoc(coachRef);

        if (!coachSnap.exists()) throw new Error('Coach not found');
        const currentCoach = coachSnap.data() as Coach;

        if (currentCoach.status === 'active') {
            await updateDoc(coachRef, {
                pendingUpdate: coachData,
                updatedAt: Timestamp.now(),
            });
        } else {
            await updateDoc(coachRef, {
                ...coachData,
                status: 'pending',
                updatedAt: Timestamp.now(),
            });
        }
    } catch (error) {
        console.error('Error updating coach profile:', error);
        throw error;
    }
};

/**
 * Get all coaches with a specific status
 */
export const getCoachesByStatus = async (status: 'pending' | 'active' | 'rejected'): Promise<Coach[]> => {
    try {
        const coachesRef = collection(db, COACHES_COLLECTION);
        const q = query(
            coachesRef,
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Coach));
    } catch (error) {
        console.error(`Error fetching ${status} coaches:`, error);
        return [];
    }
};

/**
 * Update coach profile status (admin action)
 */
export const updateCoachStatus = async (coachId: string, adminId: string, status: 'active' | 'rejected', rejectionReason?: string): Promise<void> => {
    try {
        const coachRef = doc(db, COACHES_COLLECTION, coachId);

        const coachSnap = await getDoc(coachRef);
        if (coachSnap.exists()) {
            const coachData = coachSnap.data() as Coach;
            const finalStatus = status;

            // If validating a pending update on an active coach
            if (status === 'active' && coachData.pendingUpdate) {
                const newData = { ...coachData.pendingUpdate };
                // If there's a requested badge in the update, we approve it automatically during validation
                if (newData.requestedBadge) {
                    (newData as any).badge = newData.requestedBadge;
                    newData.requestedBadge = null;
                }

                await updateDoc(coachRef, {
                    ...newData,
                    pendingUpdate: null,
                    updatedAt: Timestamp.now(),
                });
            } else if (status === 'rejected') {
                // If rejecting a pending update, we just clear it
                if (coachData.status === 'active' && coachData.pendingUpdate) {
                    await updateDoc(coachRef, {
                        pendingUpdate: null,
                        rejectionReason,
                        updatedAt: Timestamp.now(),
                    });
                } else {
                    await updateDoc(coachRef, { status, rejectionReason, updatedAt: Timestamp.now() });
                }
            } else if (status === 'active') {
                // Initial validation: if a badge was requested, approve it automatically
                const updates: any = { status, updatedAt: Timestamp.now() };
                if (coachData.requestedBadge) {
                    updates.badge = coachData.requestedBadge;
                    updates.requestedBadge = null;
                }
                await updateDoc(coachRef, updates);
            } else {
                await updateDoc(coachRef, { status, updatedAt: Timestamp.now() });
            }

            const title = status === 'active' ? 'Profil Coach Validé !' : 'Profil Coach Refusé';
            const message = status === 'active'
                ? 'Félicitations ! Votre profil de coach a été validé.'
                : `Désolé, votre profil n'a pas pu être validé. Raison : ${rejectionReason || 'Non spécifiée'}`;

            await notificationService.sendToUser(
                coachData.userId,
                adminId,
                title,
                message,
                status === 'active' ? 'success' : 'warning',
                status === 'rejected' ? {
                    screen: '/coach/create',
                    params: { id: coachId }
                } : undefined
            );
        }
    } catch (error) {
        console.error('Error updating coach status:', error);
        throw error;
    }
};

/**
 * Get a specific coach by ID
 */
export const getCoachById = async (coachId: string): Promise<Coach | null> => {
    try {
        const coachRef = doc(db, COACHES_COLLECTION, coachId);
        const docSnap = await getDoc(coachRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            } as Coach;
        }
        return null;
    } catch (error) {
        console.error('Error fetching coach by ID:', error);
        return null;
    }
};
/**
 * Get a specific coach by User ID
 */
export const getCoachByUserId = async (userId: string): Promise<Coach | null> => {
    try {
        const coachesRef = collection(db, COACHES_COLLECTION);
        const q = query(coachesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            } as Coach;
        }
        return null;
    } catch (error) {
        console.error('Error fetching coach by User ID:', error);
        return null;
    }
};

/**
 * Get all coaches with pending actions (new profiles OR pending updates)
 */
export const getPendingChangesForAdmin = async (): Promise<Coach[]> => {
    try {
        const coachesRef = collection(db, COACHES_COLLECTION);

        // 1. Get truly pending coaches
        const qPending = query(coachesRef, where('status', '==', 'pending'));
        const snapPending = await getDocs(qPending);
        const pending = snapPending.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));

        // 2. Get active coaches with pending updates
        const qUpdates = query(coachesRef, where('status', '==', 'active'));
        const snapUpdates = await getDocs(qUpdates);
        const updates = snapUpdates.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Coach))
            .filter(coach => coach.pendingUpdate != null);

        return [...pending, ...updates].sort((a, b) => {
            const timeA = a.updatedAt?.toMillis?.() || 0;
            const timeB = b.updatedAt?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error fetching admin pending changes:', error);
        return [];
    }
};
/**
 * Get all coaches regardless of status
 */
export const getAllCoaches = async (): Promise<Coach[]> => {
    try {
        const coachesRef = collection(db, COACHES_COLLECTION);
        const q = query(coachesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Coach));
    } catch (error) {
        console.error('Error fetching all coaches:', error);
        return [];
    }
};

export const updateCoachBadge = async (coachId: string, badge: Coach['badge']): Promise<void> => {
    try {
        const coachRef = doc(db, COACHES_COLLECTION, coachId);
        await updateDoc(coachRef, {
            badge,
            requestedBadge: null,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating coach badge:', error);
        throw error;
    }
};

/**
 * Get all students associated with a coach
 */
export const getCoachStudents = async (coachId: string): Promise<any[]> => {
    try {
        const studentsRef = collection(db, 'coach_students');
        const q = query(
            studentsRef,
            where('coachId', '==', coachId),
            orderBy('lastBookingDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching coach students:', error);
        return [];
    }
};

/**
 * Update private notes for a student (coach action)
 */
export const updateStudentNotes = async (coachId: string, playerId: string, notes: string): Promise<void> => {
    try {
        const relationId = `${coachId}_${playerId}`;
        const relationRef = doc(db, 'coach_students', relationId);
        await updateDoc(relationRef, {
            notes,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating student notes:', error);
        throw error;
    }
};

/**
 * Scan existing bookings to backfill the coach_students collection and studentCount
 */
export const syncExistingStudents = async (): Promise<{ updatedCoaches: number, newRelations: number }> => {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('status', '==', 'reserved'));
        const bookingSnap = await getDocs(q);

        const coachStudentsMap = new Map<string, Set<string>>(); // coachId -> Set of playerIds
        const relationsData = new Map<string, any>(); // coachId_playerId -> relation data

        bookingSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const coachId = data.coachId;
            const playerId = data.playerId;
            const playerName = data.playerName;
            const updatedAt = data.updatedAt || Timestamp.now();

            if (!coachId || !playerId) return;

            if (!coachStudentsMap.has(coachId)) {
                coachStudentsMap.set(coachId, new Set());
            }
            coachStudentsMap.get(coachId)!.add(playerId);

            const relationId = `${coachId}_${playerId}`;
            const existing = relationsData.get(relationId);

            if (!existing || updatedAt.toMillis() > existing.lastBookingDate.toMillis()) {
                relationsData.set(relationId, {
                    coachId,
                    playerId,
                    playerName,
                    firstBookingDate: existing?.firstBookingDate || updatedAt,
                    lastBookingDate: updatedAt,
                    bookingCount: (existing?.bookingCount || 0) + 1
                });
            } else {
                existing.bookingCount += 1;
                if (updatedAt.toMillis() < existing.firstBookingDate.toMillis()) {
                    existing.firstBookingDate = updatedAt;
                }
            }
        });

        // Update coach_students collection
        let newRelations = 0;
        for (const [id, data] of relationsData.entries()) {
            await setDoc(doc(db, 'coach_students', id), data);
            newRelations++;
        }

        // Update studentCount in coaches collection
        let updatedCoaches = 0;
        for (const [coachId, studentsSet] of coachStudentsMap.entries()) {
            const coachRef = doc(db, 'coaches', coachId);
            await updateDoc(coachRef, {
                studentCount: studentsSet.size,
                updatedAt: Timestamp.now()
            });
            updatedCoaches++;
        }

        return { updatedCoaches, newRelations };
    } catch (error) {
        console.error('Error syncing existing students:', error);
        throw error;
    }
};
