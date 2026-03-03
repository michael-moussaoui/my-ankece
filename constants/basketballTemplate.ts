import { BasketballTemplate } from '@/types/basketball/template';

/**
 * Template Basketball professionnel
 */
export const BASKETBALL_PRO_TEMPLATE: BasketballTemplate = {
    id: 'basketball-pro-cv',
    name: 'Pack Elite Pro',
    description: 'Le template ultime pour les pros : Photo plein pied, Highlights attaque/défense, Stats avancées et Parcours complet.',
    thumbnail: 'https://via.placeholder.com/300x200/7c3aed/FFFFFF?text=Basketball+CV+Pro',
    isPremium: false,
    tier: 'pro',
    totalDuration: 45000, 

    theme: {
        primary: '#7c3aed', // Premium Violet
        secondary: '#5b21b6',
        accent: '#00E5FF', // Cyan Harmonieux
        text: '#FFFFFF',
        background: '#1a1a1a',
    },

    transitions: {
        type: 'fade',
        duration: 500,
    },

    sections: [
        // 1. INTRO - Photo en tenue corps entier
        {
            id: 'intro',
            type: 'intro',
            title: 'Introduction',
            duration: 5000, // 5 secondes
            backgroundColor: '#1a1a1a',
            backgroundGradient: {
                colors: ['#1a1a1a', '#7c3aed'],
                angle: 135,
            },
            layout: {
                photoPosition: { x: 12.5, y: 12.5, width: 75, height: 75 },
                textZones: [
                    {
                        id: 'name',
                        field: 'firstName',
                        x: 50,
                        y: 85,
                        fontSize: 48,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        format: 'uppercase',
                    },
                    {
                        id: 'lastname',
                        field: 'lastName',
                        x: 50,
                        y: 90,
                        fontSize: 52,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        format: 'uppercase',
                    },
                ],
            },
        },

        // 2. PROFIL - Informations personnelles
        {
            id: 'profile',
            type: 'profile',
            title: 'Profil',
            duration: 6000, // 6 secondes
            backgroundColor: '#7c3aed',
            layout: {
                photoPosition: { x: 5, y: 20, width: 25, height: 60 },
                textZones: [
                    {
                        id: 'age-label',
                        field: 'custom',
                        x: 40,
                        y: 20,
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: 'normal',
                        label: 'ÂGE',
                    },
                    {
                        id: 'age',
                        field: 'age',
                        x: 40,
                        y: 25,
                        fontSize: 32,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                    },
                    {
                        id: 'height-label',
                        field: 'custom',
                        x: 65,
                        y: 20,
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: 'normal',
                        label: 'TAILLE',
                    },
                    {
                        id: 'height',
                        field: 'height',
                        x: 65,
                        y: 25,
                        fontSize: 32,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                    },
                    {
                        id: 'position-label',
                        field: 'custom',
                        x: 40,
                        y: 40,
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: 'normal',
                        label: 'POSTE',
                    },
                    {
                        id: 'position',
                        field: 'position',
                        x: 40,
                        y: 45,
                        fontSize: 28,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                    },
                    {
                        id: 'club-label',
                        field: 'custom',
                        x: 40,
                        y: 60,
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: 'normal',
                        label: 'CLUB ACTUEL',
                    },
                    {
                        id: 'club',
                        field: 'currentClub',
                        x: 40,
                        y: 65,
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                    },
                ],
            },
        },

        // 3. PARCOURS - Historique des clubs
        {
            id: 'history',
            type: 'history',
            title: 'Parcours',
            duration: 7000, // 7 secondes
            backgroundColor: '#2a2a2a',
            layout: {
                textZones: [
                    {
                        id: 'history-title',
                        field: 'custom',
                        x: 50,
                        y: 10,
                        fontSize: 40,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        label: 'PARCOURS',
                    },
                    // Les clubs seront ajoutés dynamiquement
                ],
            },
        },

        // 4. VIDÉO OFFENSIVE
        {
            id: 'offensive',
            type: 'offensive',
            title: 'Compétences Offensives',
            duration: 10000, // 10 secondes
            backgroundColor: '#1a1a1a',
            layout: {
                videoPosition: { x: 0, y: 15, width: 100, height: 70 },
                textZones: [
                    {
                        id: 'offensive-title',
                        field: 'custom',
                        x: 50,
                        y: 5,
                        fontSize: 32,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        label: 'ATTAQUE',
                    },
                ],
            },
        },

        // 5. VIDÉO DÉFENSIVE
        {
            id: 'defensive',
            type: 'defensive',
            title: 'Compétences Défensives',
            duration: 10000, // 10 secondes
            backgroundColor: '#1a1a1a',
            layout: {
                videoPosition: { x: 0, y: 15, width: 100, height: 70 },
                textZones: [
                    {
                        id: 'defensive-title',
                        field: 'custom',
                        x: 50,
                        y: 5,
                        fontSize: 32,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        label: 'DÉFENSE',
                    },
                ],
            },
        },

        // 6. STATISTIQUES (optionnel)
        {
            id: 'stats',
            type: 'stats',
            title: 'Statistiques',
            duration: 7000, // 7 secondes
            backgroundColor: '#7c3aed',
            layout: {
                textZones: [
                    {
                        id: 'stats-title',
                        field: 'custom',
                        x: 50,
                        y: 10,
                        fontSize: 40,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        label: 'MES STATS',
                    },
                    // Les stats seront ajoutées dynamiquement
                ],
            },
        },
    ],
};

/**
 * Template Basketball Simple (version gratuite)
 */
export const BASKETBALL_SIMPLE_TEMPLATE: BasketballTemplate = {
    id: 'basketball-simple-cv',
    name: 'Pack Essentiel',
    description: 'Simple, rapide et efficace. Idéal pour un profil clair avec photo et vos meilleurs moments en 30 secondes.',
    thumbnail: 'https://via.placeholder.com/300x200/0288D1/FFFFFF?text=Basketball+Simple',
    isPremium: false,
    tier: 'essentiel',
    totalDuration: 30000, 

    theme: {
        primary: '#0288D1',
        secondary: '#01579B',
        accent: '#E1F5FE', // Bleu très clair
        text: '#FFFFFF',
        background: '#000000',
    },

    sections: [
        {
            id: 'intro',
            type: 'intro',
            title: 'Introduction',
            duration: 5000,
            backgroundColor: '#000000',
            layout: {
                photoPosition: { x: 25, y: 15, width: 50, height: 70 },
                textZones: [
                    {
                        id: 'fullname',
                        field: 'firstName',
                        x: 50,
                        y: 90,
                        fontSize: 44,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    },
                ],
            },
        },
        {
            id: 'profile',
            type: 'profile',
            title: 'Profil',
            duration: 8000,
            backgroundColor: '#0288D1',
            layout: {
                textZones: [
                    {
                        id: 'position',
                        field: 'position',
                        x: 50,
                        y: 40,
                        fontSize: 36,
                        color: '#E1F5FE',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    },
                    {
                        id: 'club',
                        field: 'currentClub',
                        x: 50,
                        y: 55,
                        fontSize: 28,
                        color: '#FFFFFF',
                        fontWeight: 'normal',
                        textAlign: 'center',
                    },
                ],
            },
        },
        {
            id: 'offensive',
            type: 'offensive',
            title: 'Attaque',
            duration: 8000,
            backgroundColor: '#000000',
            layout: {
                videoPosition: { x: 0, y: 10, width: 100, height: 80 },
                textZones: [],
            },
        },
        {
            id: 'defensive',
            type: 'defensive',
            title: 'Défense',
            duration: 9000,
            backgroundColor: '#000000',
            layout: {
                videoPosition: { x: 0, y: 10, width: 100, height: 80 },
                textZones: [],
            },
        },
    ],
};

/**
 * Template AI ELITE - Le futur du scouting
 */
export const BASKETBALL_AI_ELITE_TEMPLATE: BasketballTemplate = {
    id: 'basketball-ai-elite',
    name: 'Pack AI Elite',
    description: 'Le futur du scouting. Intégration totale de vos analyses IA avec visuels high-tech et données vérifiées.',
    thumbnail: 'https://via.placeholder.com/300x200/00E5FF/000000?text=AI+Elite+CV',
    isPremium: true,
    tier: 'elite',
    totalDuration: 40000,

    theme: {
        primary: '#FF8C00', // Professional Orange (Match backend accent)
        secondary: '#1C1C20', // Card color (Match backend bg_card)
        accent: '#B4B4BE', // Light muted grey (Match backend text_secondary)
        text: '#FFFFFF',
        background: '#0F0F12', // Very dark Charcoal (Match backend bg_dark)
    },

    transitions: {
        type: 'zoom',
        duration: 400,
    },

    sections: [
        {
            id: 'ai-intro',
            type: 'intro',
            title: 'AI Scanning',
            duration: 4000,
            backgroundColor: '#000000',
            layout: {
                photoPosition: { x: 0, y: 0, width: 100, height: 100 },
                textZones: [
                    {
                        id: 'elite-title',
                        field: 'custom',
                        x: 50,
                        y: 10,
                        fontSize: 24,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        label: 'ANKece AI SCOUTING REPORT',
                        format: 'uppercase',
                    },
                    {
                        id: 'player-name',
                        field: 'firstName',
                        x: 50,
                        y: 45,
                        fontSize: 40,
                        color: '#B4B4BE',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        format: 'uppercase',
                    },
                    {
                        id: 'player-lastname',
                        field: 'lastName',
                        x: 50,
                        y: 52,
                        fontSize: 80,
                        color: '#FF8C00',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        format: 'uppercase',
                    },
                    {
                        id: 'player-pos',
                        field: 'position',
                        x: 50,
                        y: 72,
                        fontSize: 25,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        format: 'uppercase',
                    },
                ],
            },
        },
        {
            id: 'ai-profile',
            type: 'profile',
            title: 'Biometric Profile',
            duration: 6000,
            backgroundColor: '#090909',
            layout: {
                photoPosition: { x: 50, y: 10, width: 45, height: 80 },
                textZones: [
                    {
                        id: 'bio-tag',
                        field: 'custom',
                        x: 10,
                        y: 15,
                        fontSize: 14,
                        color: '#00E5FF',
                        fontWeight: 'bold',
                        label: '[ BIO_DATA ]',
                    },
                    { id: 'age', field: 'age', x: 10, y: 30, fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', label: 'AGE: ' },
                    { id: 'height', field: 'height', x: 10, y: 40, fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', label: 'HT: ' },
                    { id: 'pos', field: 'position', x: 10, y: 55, fontSize: 24, color: '#FF8C00', fontWeight: 'bold' },
                    { id: 'club', field: 'currentClub', x: 10, y: 75, fontSize: 20, color: '#B4B4BE', fontWeight: 'normal' },
                ],
            },
        },
        {
            id: 'ai-stats',
            type: 'stats',
            title: 'Advanced Analytics',
            duration: 7000,
            backgroundColor: '#000000',
            layout: {
                textZones: [
                    {
                        id: 'stats-header',
                        field: 'custom',
                        x: 50,
                        y: 10,
                        fontSize: 30,
                        color: '#B4B4BE',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        label: 'KEY PERFORMANCE INDICATORS',
                    },
                ],
            },
        },
        {
            id: 'ai-offensive',
            type: 'offensive',
            title: 'Offensive Breakdown',
            duration: 10000,
            backgroundColor: '#000000',
            layout: {
                videoPosition: { x: 5, y: 15, width: 90, height: 60 },
                textZones: [
                    {
                        id: 'off-tag',
                        field: 'custom',
                        x: 10,
                        y: 80,
                        fontSize: 18,
                        color: '#FF8C00',
                        fontWeight: 'bold',
                        label: 'ATTACKING HIGHLIGHTS',
                    },
                ],
            },
        },
        {
            id: 'ai-defensive',
            type: 'defensive',
            title: 'Defensive Breakdown',
            duration: 10000,
            backgroundColor: '#000000',
            layout: {
                videoPosition: { x: 5, y: 15, width: 90, height: 60 },
                textZones: [
                    {
                        id: 'def-tag',
                        field: 'custom',
                        x: 10,
                        y: 80,
                        fontSize: 18,
                        color: '#FF8C00',
                        fontWeight: 'bold',
                        label: 'DEFENSIVE HIGHLIGHTS',
                    },
                ],
            },
        },
    ],
};

export const BASKETBALL_TEMPLATES = [
    BASKETBALL_AI_ELITE_TEMPLATE,
    BASKETBALL_PRO_TEMPLATE,
    BASKETBALL_SIMPLE_TEMPLATE,
];