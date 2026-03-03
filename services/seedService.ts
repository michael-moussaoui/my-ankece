import { db } from '@/config/firebase';
import { DB_COLLECTIONS, Post } from '@/types/user';
import { addDoc, collection, getDocs } from 'firebase/firestore';

const MOCK_VIDEOS = [
    {
        videoUri: 'https://assets.mixkit.co/videos/preview/mixkit-basketball-player-making-a-slam-dunk-22445-large.mp4',
        description: 'Slam dunk spectaculaire ! #basketball #dunk',
        userName: 'Air Jordan JR',
    },
    {
        videoUri: 'https://assets.mixkit.co/videos/preview/mixkit-basketball-player-shooting-a-hoop-22446-large.mp4',
        description: 'La précision avant tout. Entraînement 3pts. 🏀',
        userName: 'Chef Curry Fan',
    },
    {
        videoUri: 'https://assets.mixkit.co/videos/preview/mixkit-basketball-player-dribbling-the-ball-22442-large.mp4',
        description: 'Dribbles rapides. Focus sur le handle. #hoops',
        userName: 'Kyrie Lover',
    }
];

export const seedPosts = async () => {
    try {
        console.log('Seeding posts...');

        // Check if posts already exist
        const existingPosts = await getDocs(collection(db, DB_COLLECTIONS.POSTS));
        if (existingPosts.size > 0) {
            console.log('Posts already exist, skipping seed.');
            return;
        }

        for (const video of MOCK_VIDEOS) {
            const newPost: Omit<Post, 'id'> = {
                userId: 'system-seed',
                userName: video.userName,
                videoUri: video.videoUri,
                description: video.description,
                likes: [],
                createdAt: Date.now(),
            };

            await addDoc(collection(db, DB_COLLECTIONS.POSTS), newPost);
        }

        console.log('Successfully seeded posts!');
    } catch (error) {
        console.error('Error seeding posts:', error);
    }
};
