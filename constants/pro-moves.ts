export interface ProMove {
    id: string;
    player: string;
    moveName: string;
    thumbnail: string; // URL
    videoUrl: string; // URL
    description: string;
}

export const PRO_MOVES: ProMove[] = [
    {
        id: '1',
        player: 'Stephen Curry',
        moveName: '3-Point Shot',
        thumbnail: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=2071&auto=format&fit=crop', // Placeholder
        videoUrl: 'https://videos.pexels.com/video-files/2834438/2834438-hd_1920_1080_30fps.mp4',
        description: 'Master the quick release and fluidity of the greatest shooter of all time.',
    },
    {
        id: '2',
        player: 'LeBron James',
        moveName: 'Fadeaway Jumper',
        thumbnail: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=2070&auto=format&fit=crop', // Placeholder
        videoUrl: 'https://videos.pexels.com/video-files/4497187/4497187-hd_1920_1080_25fps.mp4',
        description: 'Learn the power and balance required for an unstoppable fadeaway.',
    },
    {
        id: '3',
        player: 'Kobe Bryant',
        moveName: 'Mid-Range Pull Up',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Kobe_Bryant_2014.jpg/800px-Kobe_Bryant_2014.jpg',
        videoUrl: 'https://videos.pexels.com/video-files/6146313/6146313-hd_1920_1080_30fps.mp4',
        description: 'The art of the mid-range game. Footwork and elevation.',
    }
];
