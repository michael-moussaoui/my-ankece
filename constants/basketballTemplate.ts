import { BasketballTemplate } from '@/types/basketball/template';

/**
 * PACK ESSENTIEL (3 Templates)
 */

export const TEMPLATE_CLASSIC_NBA: BasketballTemplate = {
    id: 'basketball-classic-nba',
    name: 'Classic NBA',
    description: 'Holographique, fond noir, textes dorés. Le style NBA traditionnel.',
    thumbnail: require('../assets/images/basketball/classic.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_classic_nba_preview.mp4',
    isPremium: false,
    tier: 'essentiel',
    totalDuration: 30000,
    theme: {
        primary: '#FFD700', // Gold
        secondary: '#000000',
        accent: '#FFFFFF',
        text: '#FFFFFF',
        background: '#000000',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'Start', duration: 4000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'vignette', layout: { photoPosition: { x: 25, y: 15, width: 50, height: 70 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 90, fontSize: 40, color: '#FFD700', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'Profile', duration: 6000, backgroundColor: '#111', transitionEffect: 'slide', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'Offense', duration: 10000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'Defense', duration: 10000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
    ]
};

export const TEMPLATE_STREET_BALL: BasketballTemplate = {
    id: 'basketball-street-ball',
    name: 'Street Ball',
    description: 'Urban, graffiti animé, couleurs vives. Pour un style playground.',
    thumbnail: require('../assets/images/basketball/street.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_street_preview.mp4',
    isPremium: false,
    tier: 'essentiel',
    totalDuration: 39000,
    theme: {
        primary: '#FF4500', // Orange brûlé
        secondary: '#000000',
        accent: '#FFFFFF',
        text: '#FFFFFF',
        background: '#1A1A1A',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'STREET', duration: 5000, backgroundColor: '#1A1A1A', transitionEffect: 'slide', overlayEffect: 'none', layout: { photoPosition: { x: 10, y: 20, width: 80, height: 75 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 10, fontSize: 40, color: '#FF4500', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'STREET CARD', duration: 6000, backgroundColor: '#000', transitionEffect: 'slide', overlayEffect: 'grain', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'CROSSOVER', duration: 14000, backgroundColor: '#000', transitionEffect: 'slide', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'LOCKDOWN', duration: 14000, backgroundColor: '#000', transitionEffect: 'slide', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
    ]
};

export const TEMPLATE_CLEAN_PRO: BasketballTemplate = {
    id: 'basketball-clean-pro',
    name: 'Clean Pro',
    description: 'Épuré blanc/noir, typographie moderne. Minimaliste et efficace.',
    thumbnail: require('../assets/images/basketball/clean.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_clean_preview.mp4',
    isPremium: false,
    tier: 'essentiel',
    totalDuration: 34000,
    theme: {
        primary: '#2D3436', // Anthracite
        secondary: '#FFFFFF', // Pure White for light shadows
        accent: '#2160FF', // New Vibrant Sport Blue
        text: '#2D3436',
        background: '#F0F2F5', // Neumorphic Base
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'CLEAN', duration: 5000, backgroundColor: '#FFFFFF', transitionEffect: 'fade', overlayEffect: 'none', layout: { photoPosition: { x: 25, y: 20, width: 50, height: 60 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 85, fontSize: 35, color: '#2D3436', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'PROFILE', duration: 7000, backgroundColor: '#F0F2F5', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'HIGHLIGHTS', duration: 11000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'STOPS', duration: 11000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
    ]
};

/**
 * PACK ELITE (3 Templates supplémentaires)
 */

export const TEMPLATE_FIRE_MODE: BasketballTemplate = {
    id: 'basketball-fire-mode',
    name: 'Fire Mode',
    description: 'Flammes, rouge/orange, énergie maximale. Démarquez-vous par votre intensité.',
    thumbnail: require('../assets/images/basketball/fire.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_fire_preview.mp4',
    isPremium: true,
    tier: 'elite',
    totalDuration: 46000,
    theme: {
        primary: '#FFD700', // Gold
        secondary: '#000000',
        accent: '#FF0000', // Fire Red
        text: '#FFFFFF',
        background: '#000000',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'FIRE', duration: 5000, backgroundColor: '#000', transitionEffect: 'zoom', overlayEffect: 'none', layout: { photoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 20, fontSize: 50, color: '#FFD700', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'FIRE PROFILE', duration: 6000, backgroundColor: '#111', backgroundImage: require('../assets/images/basketball/basket_fire_court_empty.png'), transitionEffect: 'zoom', overlayEffect: 'flames', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'STATS', duration: 8000, backgroundColor: '#000', backgroundImage: require('../assets/images/basketball/basket_fire_scoreboard.png'), transitionEffect: 'zoom', overlayEffect: 'flames', layout: { textZones: [] } },
        { id: 'offensive-1', type: 'offensive', title: 'ELITE OFFENSE', duration: 10000, backgroundColor: '#000', backgroundVideo: require('../assets/videos/basketball/offensive1.mp4'), transitionEffect: 'zoom', overlayEffect: 'flames', layout: { videoPosition: { x: 2.5, y: 2.5, width: 95, height: 95 }, textZones: [] } },
        { id: 'offensive-2', type: 'offensive', title: 'ELITE OFFENSE', duration: 10000, backgroundColor: '#000', backgroundVideo: require('../assets/videos/basketball/offensive2.mp4'), transitionEffect: 'zoom', overlayEffect: 'flames', layout: { videoPosition: { x: 2.5, y: 2.5, width: 95, height: 95 }, textZones: [] } },
        { id: 'defensive-1', type: 'defensive', title: 'ELITE DEFENSE', duration: 10000, backgroundColor: '#000', backgroundVideo: require('../assets/videos/basketball/defensive1.mp4'), transitionEffect: 'paper-tear', overlayEffect: 'flames', layout: { videoPosition: { x: 2.5, y: 2.5, width: 95, height: 95 }, textZones: [] } },
        { id: 'defensive-2', type: 'defensive', title: 'ELITE DEFENSE', duration: 10000, backgroundColor: '#000', backgroundVideo: require('../assets/videos/basketball/defensive2.mp4'), transitionEffect: 'paper-tear', overlayEffect: 'flames', layout: { videoPosition: { x: 2.5, y: 2.5, width: 95, height: 95 }, textZones: [] } },
        { id: 'achievements', type: 'achievements', title: 'TITLES', duration: 7000, backgroundColor: '#000', backgroundImage: require('../assets/images/basketball/basket_fire_trophy.png'), transitionEffect: 'zoom', overlayEffect: 'flames', layout: { textZones: [] } },
    ]
};

export const TEMPLATE_ICE_COLD: BasketballTemplate = {
    id: 'basketball-ice-cold',
    name: 'Ice Cold',
    description: 'Glace cristal, bleu/blanc, premium. Calme et précision sous pression.',
    thumbnail: require('../assets/images/basketball/ice.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_ice_preview.mp4',
    isPremium: true,
    tier: 'elite',
    totalDuration: 51000,
    theme: {
        primary: '#00E5FF', // Cyan Ice
        secondary: '#FFFFFF',
        accent: '#B2EBF2',
        text: '#FFFFFF',
        background: '#050505',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'ICE', duration: 6000, backgroundColor: '#050505', transitionEffect: 'blur', overlayEffect: 'none', layout: { photoPosition: { x: 10, y: 10, width: 80, height: 80 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 85, fontSize: 40, color: '#00E5FF', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'COLD PRO', duration: 6000, backgroundColor: '#050505', backgroundImage: require('../assets/images/basketball/ice.png'), transitionEffect: 'fade', overlayEffect: 'vignette', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'ANALYTICS', duration: 8000, backgroundColor: '#050505', transitionEffect: 'blur', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'offensive', type: 'offensive', title: 'COLD FINISH', duration: 12000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'defensive', type: 'defensive', title: 'CHILL DEFENSE', duration: 12000, backgroundColor: '#000', transitionEffect: 'paper-tear', overlayEffect: 'none', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'achievements', type: 'achievements', title: 'HISTORY', duration: 7000, backgroundColor: '#050505', transitionEffect: 'blur', overlayEffect: 'none', layout: { textZones: [] } },
    ]
};

export const TEMPLATE_GALAXY: BasketballTemplate = {
    id: 'basketball-galaxy',
    name: 'Galaxy',
    description: 'Espace, particules étoiles, cinématique. Un talent hors de ce monde.',
    thumbnail: require('../assets/images/basketball/galaxy.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_galaxy_preview.mp4',
    isPremium: true,
    tier: 'elite',
    totalDuration: 46000,
    theme: {
        primary: '#311B92', // Deep Purple
        secondary: '#00E5FF',
        accent: '#00E5FF',
        text: '#FFFFFF',
        background: '#000005',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'GALAXY', duration: 6000, backgroundColor: '#000005', transitionEffect: 'zoom', overlayEffect: 'particles', layout: { photoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 50, fontSize: 60, color: '#00E5FF', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'GALAXY ID', duration: 6000, backgroundColor: '#050510', transitionEffect: 'fade', overlayEffect: 'particles', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'UNIVERSE DATA', duration: 7000, backgroundColor: '#311B92', transitionEffect: 'zoom', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'offensive', type: 'offensive', title: 'SPACE ATTACK', duration: 10000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'particles', layout: { videoPosition: { x: 10, y: 10, width: 80, height: 80 }, textZones: [] } },
        { id: 'defensive', type: 'defensive', title: 'STELLAR DEFENSE', duration: 10000, backgroundColor: '#000', transitionEffect: 'paper-tear', overlayEffect: 'particles', layout: { videoPosition: { x: 10, y: 10, width: 80, height: 80 }, textZones: [] } },
        { id: 'achievements', type: 'achievements', title: 'STAR AWARDS', duration: 7000, backgroundColor: '#000005', transitionEffect: 'zoom', overlayEffect: 'particles', layout: { textZones: [] } },
    ]
};

/**
 * PACK ELITE PRO (4 Templates supplémentaires)
 */

export const TEMPLATE_CHAMPIONS_LEAGUE: BasketballTemplate = {
    id: 'basketball-champions-league',
    name: 'Champions League',
    description: 'Or/noir, trophées animés, prestige. Le niveau des champions.',
    thumbnail: require('../assets/images/basketball/champions.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_champions_preview.mp4',
    isPremium: true,
    tier: 'pro',
    totalDuration: 36000,
    theme: {
        primary: '#C5A059',
        secondary: '#1A1A1A',
        accent: '#FFFFFF',
        text: '#FFFFFF',
        background: '#000000',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'CHAMPIONS', duration: 7000, backgroundColor: '#000', transitionEffect: 'slide', overlayEffect: 'none', layout: { photoPosition: { x: 20, y: 10, width: 60, height: 80 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 92, fontSize: 45, color: '#C5A059', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'ELITE CARD', duration: 6000, backgroundColor: '#111', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'PRO STATS', duration: 8000, backgroundColor: '#C5A059', transitionEffect: 'zoom', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'palmares', type: 'palmares', title: 'PALMARES', duration: 10000, backgroundColor: '#1A1A1A', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'OFFENSE I', duration: 15000, backgroundColor: '#000', transitionEffect: 'zoom', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'off-2', type: 'offensive', title: 'OFFENSE II', duration: 15000, backgroundColor: '#000', transitionEffect: 'flash', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'DEFENSE I', duration: 15000, backgroundColor: '#000', transitionEffect: 'paper-tear', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'contact', type: 'contact', title: 'CONTACT', duration: 7000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
    ]
};

export const TEMPLATE_NEON_CITY: BasketballTemplate = {
    id: 'basketball-neon-city',
    name: 'Neon City',
    description: 'Cyberpunk, néons colorés, ultra moderne. Style futuriste déchaîné.',
    thumbnail: require('../assets/images/basketball/neon.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_neon_preview.mp4',
    isPremium: true,
    tier: 'pro',
    totalDuration: 62000,
    theme: {
        primary: '#FF00FF',
        secondary: '#00FFFF',
        accent: '#FFFF00',
        text: '#FFFFFF',
        background: '#050505',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'NEON', duration: 5000, backgroundColor: '#050505', transitionEffect: 'glitch', overlayEffect: 'none', layout: { photoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 10, fontSize: 40, color: '#FF00FF', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'CYBER CARD', duration: 6000, backgroundColor: '#111', transitionEffect: 'glitch', overlayEffect: 'grain', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'CYBER STATS', duration: 7000, backgroundColor: '#FF00FF', transitionEffect: 'glitch', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'palmares', type: 'palmares', title: 'CYBER LEGACY', duration: 8000, backgroundColor: '#050505', transitionEffect: 'glitch', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'CYBER ATTACK I', duration: 12000, backgroundColor: '#000', transitionEffect: 'glitch', overlayEffect: 'grain', layout: { videoPosition: { x: 5, y: 5, width: 90, height: 90 }, textZones: [] } },
        { id: 'off-2', type: 'offensive', title: 'CYBER ATTACK II', duration: 12000, backgroundColor: '#000', transitionEffect: 'glitch', overlayEffect: 'grain', layout: { videoPosition: { x: 5, y: 5, width: 90, height: 90 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'CYBER DEFENSE I', duration: 12000, backgroundColor: '#000', transitionEffect: 'paper-tear', overlayEffect: 'grain', layout: { videoPosition: { x: 5, y: 5, width: 90, height: 90 }, textZones: [] } },
        { id: 'contact', type: 'contact', title: 'CONNECT', duration: 7000, backgroundColor: '#050505', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
    ]
};

export const TEMPLATE_CINEMATIC: BasketballTemplate = {
    id: 'basketball-cinematic',
    name: 'Cinematic',
    description: 'Hollywood, noir et blanc + couleur, dramatique. Votre carrière est un film.',
    thumbnail: require('../assets/images/basketball/cinematic.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_cinematic_preview.mp4',
    isPremium: true,
    tier: 'pro',
    totalDuration: 88000,
    theme: {
        primary: '#FFFFFF',
        secondary: '#000000',
        accent: '#E50914', // Netflix Red
        text: '#FFFFFF',
        background: '#000000',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'CINEMATIC', duration: 8000, backgroundColor: '#000', transitionEffect: 'blur', overlayEffect: 'vignette', layout: { photoPosition: { x: 0, y: 20, width: 100, height: 60 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 85, fontSize: 55, color: '#E50914', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'STAR CARD', duration: 6000, backgroundColor: '#050505', transitionEffect: 'fade', overlayEffect: 'vignette', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'ACT I: DATA', duration: 8000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'grain', layout: { textZones: [] } },
        { id: 'palmares', type: 'palmares', title: 'ACT II: LEGACY', duration: 10000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'ACT III: OFFENSE I', duration: 15000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'off-2', type: 'offensive', title: 'ACT IV: OFFENSE II', duration: 15000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'ACT V: DEFENSE', duration: 20000, backgroundColor: '#000', transitionEffect: 'paper-tear', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'contact', type: 'contact', title: 'CAST / CONTACT', duration: 8000, backgroundColor: '#000', transitionEffect: 'fade', overlayEffect: 'vignette', layout: { textZones: [] } },
    ]
};

export const TEMPLATE_CUSTOM_BRAND: BasketballTemplate = {
    id: 'basketball-custom-brand',
    name: 'Custom Brand',
    description: 'Couleurs du club générées automatiquement. Intégration totale avec votre équipe.',
    thumbnail: require('../assets/images/basketball/brand.png'),
    videoPreview: 'https://res.cloudinary.com/demo/video/upload/v1/basketball_custom_preview.mp4',
    isPremium: true,
    tier: 'pro',
    totalDuration: 79000,
    theme: {
        primary: '#7c3aed',
        secondary: '#1a1a1a',
        accent: '#00E5FF',
        text: '#FFFFFF',
        background: '#121212',
    },
    sections: [
        { id: 'intro', type: 'intro', title: 'BRAND', duration: 5000, backgroundColor: '#121212', transitionEffect: 'fade', overlayEffect: 'none', layout: { photoPosition: { x: 25, y: 15, width: 50, height: 70 }, textZones: [{ id: 'name', field: 'firstName', x: 50, y: 90, fontSize: 40, color: '#7c3aed', fontWeight: 'bold', textAlign: 'center' }] } },
        { id: 'profile', type: 'profile', title: 'THE BRAND', duration: 6000, backgroundColor: '#121212', transitionEffect: 'zoom', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'stats', type: 'stats', title: 'PERFORMANCE', duration: 8000, backgroundColor: '#7c3aed', transitionEffect: 'zoom', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'achievements', type: 'achievements', title: 'AWARDS', duration: 8000, backgroundColor: '#121212', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
        { id: 'off-1', type: 'offensive', title: 'TEAM OFFENSE I', duration: 15000, backgroundColor: '#000', transitionEffect: 'zoom', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'off-2', type: 'offensive', title: 'TEAM OFFENSE II', duration: 15000, backgroundColor: '#000', transitionEffect: 'zoom', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'def-1', type: 'defensive', title: 'TEAM DEFENSE', duration: 15000, backgroundColor: '#000', transitionEffect: 'paper-tear', overlayEffect: 'grain', layout: { videoPosition: { x: 0, y: 0, width: 100, height: 100 }, textZones: [] } },
        { id: 'contact', type: 'contact', title: 'GET HIRED', duration: 7000, backgroundColor: '#121212', transitionEffect: 'fade', overlayEffect: 'none', layout: { textZones: [] } },
    ]
};

export const BASKETBALL_TEMPLATES = [
    TEMPLATE_CLASSIC_NBA,
    TEMPLATE_STREET_BALL,
    TEMPLATE_CLEAN_PRO,
    TEMPLATE_FIRE_MODE,
    TEMPLATE_ICE_COLD,
    TEMPLATE_GALAXY,
    TEMPLATE_CHAMPIONS_LEAGUE,
    TEMPLATE_NEON_CITY,
    TEMPLATE_CINEMATIC,
    TEMPLATE_CUSTOM_BRAND,
];
