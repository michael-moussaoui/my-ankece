import { db } from '@/config/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, runTransaction, Timestamp, where } from 'firebase/firestore';

export interface PlaygroundImage {
    id: string;
    url: string;
    userId: string;
    createdAt: Timestamp; // Using Firestore Timestamp
}

export const addPlaygroundImage = async (playgroundId: string, imageUrl: string, userId: string) => {
    try {
        const imagesRef = collection(db, 'playgrounds', playgroundId, 'images');
        await addDoc(imagesRef, {
            url: imageUrl,
            userId: userId,
            createdAt: Timestamp.now(),
        });
        console.log('Image added to Firestore');
    } catch (error) {
        console.error('Error adding playground image to Firestore:', error);
        throw error;
    }
};

export const getPlaygroundImages = async (playgroundId: string): Promise<PlaygroundImage[]> => {
    try {
        const imagesRef = collection(db, 'playgrounds', playgroundId, 'images');
        const q = query(imagesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PlaygroundImage));
    } catch (error) {
        console.error('Error fetching playground images:', error);
        return [];
    }
};

export const deletePlaygroundImage = async (playgroundId: string, imageId: string) => {
    try {
        const imageRef = doc(db, 'playgrounds', playgroundId, 'images', imageId);
        await deleteDoc(imageRef);
        console.log('Image deleted successfully');
    } catch (error) {
        console.error('Error deleting playground image:', error);
        throw error;
    }
};
export const startLiveStream = async (playgroundId: string, userId: string, userName: string, description: string, videoUrl: string) => {
    try {
        const postsRef = collection(db, 'posts');
        const docRef = await addDoc(postsRef, {
            playgroundId,
            userId,
            userName,
            description,
            videoUri: videoUrl,
            isLive: true,
            likes: [],
            createdAt: Date.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error starting live stream:', error);
        throw error;
    }
};

export const getActiveLiveStreams = async () => {
    try {
        const postsRef = collection(db, 'posts');
        // A live stream is active if it's marked isLive and created in the last 60 minutes
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const q = query(
            postsRef,
            where('isLive', '==', true),
            where('createdAt', '>', oneHourAgo),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as any));
    } catch (error) {
        console.error('Error fetching active live streams:', error);
        return [];
    }
};
export const stopLiveStream = async (postId: string) => {
    try {
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
        console.log('Live stream stopped successfully');
    } catch (error) {
        console.error('Error stopping live stream:', error);
        throw error;
    }
};

export const getPlaygroundVibes = async (playgroundId: string) => {
    try {
        const docRef = doc(db, 'playgrounds', playgroundId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data().vibeCounts || {};
        }
        return {};
    } catch (error) {
        console.error('Error fetching playground vibes:', error);
        return {};
    }
};

export const getUserVibeVotes = async (playgroundId: string, userId: string): Promise<string[]> => {
    try {
        const docRef = doc(db, 'playgrounds', playgroundId, 'userVibes', userId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data().selectedStyles || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching user vibe votes:', error);
        return [];
    }
};

export const votePlaygroundStyle = async (playgroundId: string, userId: string, styleId: string) => {
    const playgroundRef = doc(db, 'playgrounds', playgroundId);
    const userVibeRef = doc(db, 'playgrounds', playgroundId, 'userVibes', userId);

    try {
        return await runTransaction(db, async (transaction) => {
            const userVibeDoc = await transaction.get(userVibeRef);
            const playgroundDoc = await transaction.get(playgroundRef);

            let selectedStyles: string[] = [];
            if (userVibeDoc.exists()) {
                selectedStyles = userVibeDoc.data().selectedStyles || [];
            }

            let vibeCounts: Record<string, number> = {};
            if (playgroundDoc.exists()) {
                vibeCounts = (playgroundDoc.data() as any).vibeCounts || {};
            }

            const isAlreadySelected = selectedStyles.includes(styleId);

            if (isAlreadySelected) {
                // Remove vote
                selectedStyles = selectedStyles.filter(s => s !== styleId);
                vibeCounts[styleId] = Math.max(0, (vibeCounts[styleId] || 1) - 1);
            } else {
                // Add vote (max 3)
                if (selectedStyles.length >= 3) {
                    throw new Error('error_max_vibes');
                }
                selectedStyles.push(styleId);
                vibeCounts[styleId] = (vibeCounts[styleId] || 0) + 1;
            }

            // Update user document
            if (!userVibeDoc.exists()) {
                transaction.set(userVibeRef, { selectedStyles });
            } else {
                transaction.update(userVibeRef, { selectedStyles });
            }

            // Update playground aggregate document
            if (!playgroundDoc.exists()) {
                transaction.set(playgroundRef, { vibeCounts });
            } else {
                transaction.update(playgroundRef, { vibeCounts });
            }

            return { selectedStyles, vibeCounts };
        });
    } catch (error) {
        console.error('Error voting for playground style:', error);
        throw error;
    }
};
