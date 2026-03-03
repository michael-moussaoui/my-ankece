import { SportTemplate, SportType } from '@/types/template';

/**
 * Templates de démonstration pour le développement et les tests
 */
export const MOCK_TEMPLATES: SportTemplate[] = [
    {
        id: 'football-classic',
        name: 'Football Classic',
        sport: 'football',
        thumbnail: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Football+Classic',
        description: 'Template classique pour CV de footballeur',
        isPremium: false,
        textElements: [],
        statElements: [],
        backgroundColor: '#4CAF50',
        duration: 15000,
        tags: ['football', 'classic', 'simple'],
        popularity: 95,
    },
    {
        id: 'football-pro',
        name: 'Football Pro',
        sport: 'football',
        thumbnail: 'https://via.placeholder.com/300x200/1976D2/FFFFFF?text=Football+Pro',
        description: 'Template professionnel avec animations',
        isPremium: true,
        textElements: [],
        statElements: [],
        backgroundColor: '#1976D2',
        backgroundGradient: {
            colors: ['#1976D2', '#0D47A1'],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
        },
        duration: 20000,
        tags: ['football', 'pro', 'premium', 'animated'],
        popularity: 88,
    },
    {
        id: 'basketball-slam',
        name: 'Basketball Slam',
        sport: 'basketball',
        thumbnail: 'https://via.placeholder.com/300x200/7c3aed/FFFFFF?text=Basketball+Slam',
        description: 'Template dynamique pour basketteurs',
        isPremium: false,
        textElements: [],
        statElements: [],
        backgroundColor: '#7c3aed',
        duration: 15000,
        tags: ['basketball', 'dynamic', 'energy'],
        popularity: 82,
    },
    {
        id: 'basketball-elite',
        name: 'Basketball Elite',
        sport: 'basketball',
        thumbnail: 'https://via.placeholder.com/300x200/5b21b6/FFFFFF?text=Basketball+Elite',
        description: 'Template premium pour joueurs d\'élite',
        isPremium: true,
        textElements: [],
        statElements: [],
        backgroundColor: '#5b21b6',
        duration: 25000,
        tags: ['basketball', 'elite', 'premium'],
        popularity: 90,
    },
    {
        id: 'tennis-ace',
        name: 'Tennis Ace',
        sport: 'tennis',
        thumbnail: 'https://via.placeholder.com/300x200/388E3C/FFFFFF?text=Tennis+Ace',
        description: 'Template élégant pour joueurs de tennis',
        isPremium: false,
        textElements: [],
        statElements: [],
        backgroundColor: '#388E3C',
        duration: 12000,
        tags: ['tennis', 'elegant', 'simple'],
        popularity: 75,
    },
    {
        id: 'rugby-warrior',
        name: 'Rugby Warrior',
        sport: 'rugby',
        thumbnail: 'https://via.placeholder.com/300x200/D32F2F/FFFFFF?text=Rugby+Warrior',
        description: 'Template puissant pour rugbymen',
        isPremium: false,
        textElements: [],
        statElements: [],
        backgroundColor: '#D32F2F',
        duration: 18000,
        tags: ['rugby', 'powerful', 'intense'],
        popularity: 70,
    },
    {
        id: 'athletics-speed',
        name: 'Athletics Speed',
        sport: 'athletics',
        thumbnail: 'https://via.placeholder.com/300x200/7B1FA2/FFFFFF?text=Athletics+Speed',
        description: 'Template rapide pour athlètes',
        isPremium: true,
        textElements: [],
        statElements: [],
        backgroundColor: '#7B1FA2',
        duration: 10000,
        tags: ['athletics', 'speed', 'premium'],
        popularity: 65,
    },
    {
        id: 'handball-power',
        name: 'Handball Power',
        sport: 'handball',
        thumbnail: 'https://via.placeholder.com/300x200/0288D1/FFFFFF?text=Handball+Power',
        description: 'Template énergique pour handballeurs',
        isPremium: false,
        textElements: [],
        statElements: [],
        backgroundColor: '#0288D1',
        duration: 15000,
        tags: ['handball', 'energy', 'dynamic'],
        popularity: 68,
    },
];

/**
 * Récupère tous les templates
 */
export const getAllTemplates = (): SportTemplate[] => {
    return MOCK_TEMPLATES;
};

/**
 * Récupère les templates par sport
 */
export const getTemplatesBySport = (sport: SportType): SportTemplate[] => {
    if (sport === 'all') {
        return MOCK_TEMPLATES;
    }
    return MOCK_TEMPLATES.filter(template => template.sport === sport);
};

/**
 * Récupère les templates premium uniquement
 */
export const getPremiumTemplates = (): SportTemplate[] => {
    return MOCK_TEMPLATES.filter(template => template.isPremium);
};

/**
 * Récupère les templates gratuits uniquement
 */
export const getFreeTemplates = (): SportTemplate[] => {
    return MOCK_TEMPLATES.filter(template => !template.isPremium);
};

/**
 * Récupère un template par ID
 */
export const getTemplateById = (id: string): SportTemplate | undefined => {
    return MOCK_TEMPLATES.find(template => template.id === id);
};