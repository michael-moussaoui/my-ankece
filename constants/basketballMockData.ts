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
        category: 'SENIOR',
        league: 'Elite',
        number: 0,
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
        uri: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png',
    },
    offensiveVideos: [
        {
            id: 'off-1',
            type: 'video',
            uri: require('../assets/videos/basketball/offensive1.mp4'),
        },
        {
            id: 'off-2',
            type: 'video',
            uri: require('../assets/videos/basketball/offensive2.mp4'),
        }
    ],
    defensiveVideos: [
        {
            id: 'def-1',
            type: 'video',
            uri: require('../assets/videos/basketball/defensive1.mp4'),
        },
        {
            id: 'def-2',
            type: 'video',
            uri: require('../assets/videos/basketball/defensive2.mp4'),
        }
    ],
    presentationVideo: {
        id: 'pres-mock',
        type: 'video',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    achievements: [
        { title: 'MVP All-Star Game', year: '2023', competition: 'LNB' },
        { title: 'Champion de France U21', year: '2022', competition: 'Championnat de France' },
        { title: 'Meilleur Espoir', year: '2021', competition: 'LEB Oro' }
    ],
    email: 'j.walker@example.com',
    phone: '+33 6 12 34 56 78',
    instagram: '@jwalker_ball',
};
