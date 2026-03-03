import { db } from '@/config/firebase';
import { addDoc, collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';

export interface PhotoReport {
    id: string;
    playgroundId: string;
    imageId: string;
    userId: string;
    reason: string;
    createdAt: Timestamp;
}

export const reportPlaygroundPhoto = async (
    playgroundId: string,
    imageId: string,
    reason: string,
    userId: string
) => {
    try {
        // Write to subcollection (for per-photo report count)
        const reportsRef = collection(db, 'playgrounds', playgroundId, 'images', imageId, 'reports');
        await addDoc(reportsRef, {
            userId: userId,
            reason: reason,
            createdAt: Timestamp.now(),
        });

        // Also write to centralized collection (for admin dashboard)
        const centralReportsRef = collection(db, 'photoReports');
        await addDoc(centralReportsRef, {
            playgroundId: playgroundId,
            imageId: imageId,
            userId: userId,
            reason: reason,
            createdAt: Timestamp.now(),
        });

        console.log('Photo reported successfully');
    } catch (error) {
        console.error('Error reporting photo:', error);
        throw error;
    }
};

export const getPhotoReports = async (playgroundId: string, imageId: string): Promise<PhotoReport[]> => {
    try {
        const reportsRef = collection(db, 'playgrounds', playgroundId, 'images', imageId, 'reports');
        const querySnapshot = await getDocs(query(reportsRef));

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            playgroundId,
            imageId,
            ...doc.data()
        } as PhotoReport));
    } catch (error) {
        console.error('Error fetching photo reports:', error);
        return [];
    }
};

export const getAllPhotoReports = async (): Promise<PhotoReport[]> => {
    try {
        const reportsRef = collection(db, 'photoReports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PhotoReport));
    } catch (error) {
        console.error('Error fetching all photo reports:', error);
        return [];
    }
};
