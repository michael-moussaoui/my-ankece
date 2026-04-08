import { db } from '@/config/firebase';
import { BookingSession } from '@/types/booking';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    runTransaction,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';

const BOOKINGS_COLLECTION = 'bookings';

/**
 * Create a new session (coach action)
 */
export const createSession = async (sessionData: Omit<BookingSession, 'id' | 'status'>): Promise<string> => {
    try {
        const bookingsRef = collection(db, BOOKINGS_COLLECTION);
        const docRef = await addDoc(bookingsRef, {
            ...sessionData,
            status: 'available',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

/**
 * Get sessions for a coach by date
 */
export const getCoachSessionsByDate = async (coachId: string, date: string): Promise<BookingSession[]> => {
    try {
        const bookingsRef = collection(db, BOOKINGS_COLLECTION);
        const q = query(
            bookingsRef,
            where('coachId', '==', coachId),
            where('date', '==', date),
            orderBy('startTime', 'asc')
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BookingSession));
    } catch (error) {
        console.error('Error fetching coach sessions:', error);
        return [];
    }
};

/**
 * Reserve a session (player action)
 */
export const reserveSession = async (sessionId: string, playerId: string, playerName: string): Promise<void> => {
    try {
        const sessionRef = doc(db, BOOKINGS_COLLECTION, sessionId);

        await runTransaction(db, async (transaction) => {
            const sessionDoc = await transaction.get(sessionRef);
            if (!sessionDoc.exists()) throw new Error('Session does not exist');

            const sessionData = sessionDoc.data() as BookingSession;
            if (sessionData.status !== 'available') {
                throw new Error('Session is no longer available');
            }

            const coachId = sessionData.coachId;

            // Check if this student is already indexed for this coach
            const relationId = `${coachId}_${playerId}`;
            const relationRef = doc(db, 'coach_students', relationId);
            const relationDoc = await transaction.get(relationRef);

            if (!relationDoc.exists()) {
                // New student for this coach, update studentCount
                const coachRef = doc(db, 'coaches', coachId);
                const coachDoc = await transaction.get(coachRef);

                if (coachDoc.exists()) {
                    const currentCount = coachDoc.data().studentCount || 0;
                    transaction.update(coachRef, {
                        studentCount: currentCount + 1,
                        updatedAt: Timestamp.now()
                    });
                }

                // Create the relationship
                transaction.set(relationRef, {
                    coachId,
                    playerId,
                    playerName,
                    firstBookingDate: Timestamp.now(),
                    lastBookingDate: Timestamp.now(),
                    bookingCount: 1
                });
            } else {
                // Existing student, just update the last booking date and count
                transaction.update(relationRef, {
                    lastBookingDate: Timestamp.now(),
                    bookingCount: (relationDoc.data().bookingCount || 0) + 1
                });
            }

            // Update the session
            transaction.update(sessionRef, {
                playerId,
                playerName,
                status: 'reserved',
                updatedAt: Timestamp.now(),
            });
        });
    } catch (error) {
        console.error('Error reserving session:', error);
        throw error;
    }
};

/**
 * Cancel a session (coach or player action)
 */
export const cancelSession = async (sessionId: string): Promise<void> => {
    try {
        const sessionRef = doc(db, BOOKINGS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            status: 'cancelled',
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error cancelling session:', error);
        throw error;
    }
};

/**
 * Delete a session (coach action, only if not reserved)
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
    try {
        const sessionRef = doc(db, BOOKINGS_COLLECTION, sessionId);
        await deleteDoc(sessionRef);
    } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
    }
};

/**
 * Get a single session by ID
 */
export const getSessionById = async (sessionId: string): Promise<BookingSession | null> => {
    try {
        const sessionRef = doc(db, BOOKINGS_COLLECTION, sessionId);
        const snapshot = await getDoc(sessionRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as BookingSession;
        }
        return null;
    } catch (error) {
        console.error('Error fetching session:', error);
        throw error;
    }
};
