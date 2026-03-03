import { BasketballPlayerData } from '@/types/basketball/template';

export const MOCK_BASKETBALL_PLAYER: BasketballPlayerData = {
    firstName: 'Jordan',
    lastName: 'Walker',
    age: 22,
    height: 198,
    weight: 92,
    position: 'Arrière',
    wingspan: 205,
    verticalLeap: 85,
    dominantHand: 'Droitier',
    currentClub: {
        clubName: 'Metropolitans 92',
        season: '2023-2024',
    },
    clubHistory: [
        { clubName: 'Real Madrid Youth', season: '2020-2021', league: 'ACB Youth' },
        { clubName: 'FC Barcelona B', season: '2021-2022', league: 'LEB Oro' },
    ],
    stats: {
        pointsPerGame: 18.5,
        reboundsPerGame: 4.2,
        assistsPerGame: 3.8,
        stealsPerGame: 1.5,
        blocksPerGame: 0.8,
        fieldGoalPercentage: 48,
        threePointPercentage: 39,
        freeThrowPercentage: 82,
    },
    strengths: ['3-Point Shooting', 'Perimeter Defense', 'Athleticism'],
    profilePhoto: {
        id: 'mock-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60',
    },
    offensiveVideo: {
        id: 'mock-2',
        type: 'video',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    defensiveVideo: {
        id: 'mock-3',
        type: 'video',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    email: 'j.walker@example.com',
    phone: '+33 6 12 34 56 78',
    instagram: '@jwalker_ball',
};
