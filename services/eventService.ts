import { db } from '@/config/firebase';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';

export type EventType = 'Match' | 'Coaching' | 'Séance Shoot' | '3x3' | '1vs1' | 'Autre';

export interface Participant {
    uid: string;
    name: string; // Formatted "Prenom . InitialNom"
}

export interface PlaygroundEvent {
    id: string;
    playgroundId: string;
    creatorId: string;
    title: string;
    type: EventType;
    description?: string;
    date: Timestamp;
    createdAt: Timestamp;
    interested?: Participant[];
    present?: Participant[];
}

export const createPlaygroundEvent = async (
    playgroundId: string,
    creatorId: string,
    title: string,
    type: EventType,
    date: Date,
    description?: string
) => {
    try {
        const eventsRef = collection(db, 'playgrounds', playgroundId, 'events');
        await addDoc(eventsRef, {
            playgroundId,
            creatorId,
            title,
            type,
            date: Timestamp.fromDate(date),
            description: description || '',
            createdAt: Timestamp.now(),
            interested: [],
            present: []
        });
        console.log('Event created successfully');
    } catch (error) {
        console.error('Error creating playground event:', error);
        throw error;
    }
};

export const getPlaygroundEvents = async (playgroundId: string): Promise<PlaygroundEvent[]> => {
    try {
        const eventsRef = collection(db, 'playgrounds', playgroundId, 'events');
        // Fetch events from today onwards
        const now = Timestamp.now();
        const q = query(
            eventsRef,
            where('date', '>=', now),
            orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PlaygroundEvent));
    } catch (error) {
        console.error('Error fetching playground events:', error);
        return [];
    }
};

export const toggleEventRSVP = async (
    playgroundId: string,
    eventId: string,
    user: { uid: string, displayName: string },
    type: 'interested' | 'present',
    isJoining: boolean
) => {
    try {
        const eventRef = doc(db, 'playgrounds', playgroundId, 'events', eventId);

        // Helper to format "Prenom . I"
        const formatName = (name: string) => {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0]} . ${parts[parts.length - 1][0].toUpperCase()}`;
            }
            return name;
        };

        const participant: Participant = {
            uid: user.uid,
            name: formatName(user.displayName)
        };

        const field = type === 'interested' ? 'interested' : 'present';

        await updateDoc(eventRef, {
            [field]: isJoining ? arrayUnion(participant) : arrayRemove(participant)
        });
    } catch (error) {
        console.error('Error toggling RSVP:', error);
        throw error;
    }
};
