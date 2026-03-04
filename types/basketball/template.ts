/**
 * Types spécifiques pour les templates Basketball
 */

import { MediaAsset } from '../media';

export interface Achievement {
    title: string;
    year: string;
    competition?: string;
}

export type CVTier = 'essentiel' | 'pro' | 'elite';

export interface BasketballPlayerData {
    // Informations personnelles
    firstName: string;
    lastName: string;
    age: number;
    dateOfBirth?: string;
    language?: 'fr' | 'en';

    // Tier du CV
    tier?: CVTier;

    // Informations basketball
    position: BasketballPosition;
    height?: number; // en cm
    wingspan?: number; // en cm
    verticalLeap?: number; // en cm
    dominantHand?: 'Droitier' | 'Gaucher' | 'Ambidextre';
    weight?: number; // en kg

    // Médias
    profilePhoto: MediaAsset | null; // Photo en tenue, corps entier
    defensiveVideos: MediaAsset[]; // Vidéos compétences défensives
    offensiveVideos: MediaAsset[]; // Vidéos compétences offensives
    presentationVideo: MediaAsset | null; // Vidéo de présentation (discours)

    // Points forts
    strengths?: string[];

    // Palmarès / Titres
    achievements?: Achievement[];

    // Parcours
    currentClub: ClubInfo;
    clubHistory: ClubInfo[];


    // Statistiques (optionnel)
    stats?: PlayerStats;

    // Contact (optionnel)
    email?: string;
    phone?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    snapchat?: string;
    facebook?: string;

    // Options Premium (Elite)
    primaryColor?: string;
    accentColor?: string;
    transitionType?: 'fade' | 'zoom' | 'none';
    jobId?: string;
}

export type BasketballPosition =
    | 'Meneur' // Point Guard (PG)
    | 'Arrière' // Shooting Guard (SG)
    | 'Ailier' // Small Forward (SF)
    | 'Ailier Fort' // Power Forward (PF)
    | 'Pivot'; // Center (C)

export interface ClubInfo {
    clubName: string;
    season: string; // ex: "2023-2024"
    category?: string; // ex: "Senior", "U21", "U18"
    league?: string; // ex: "Nationale 1", "Régionale"
    number?: number; // Numéro de maillot
    startDate?: string;
    endDate?: string;
    clubLogo?: MediaAsset | null;
}

export interface PlayerStats {
    // Statistiques par match (moyenne)
    pointsPerGame?: number;
    reboundsPerGame?: number;
    assistsPerGame?: number;
    stealsPerGame?: number;
    blocksPerGame?: number;

    // Pourcentages
    fieldGoalPercentage?: number; // Pourcentage de tir
    threePointPercentage?: number; // Pourcentage 3 points
    freeThrowPercentage?: number; // Pourcentage lancers francs

    // Autres
    gamesPlayed?: number;
    minutesPerGame?: number;
}

export interface BasketballTemplateSection {
    id: string;
    type: 'intro' | 'profile' | 'stats' | 'offensive' | 'defensive' | 'history' | 'contact';
    title: string;
    duration: number; // en ms
    backgroundColor?: string;
    backgroundGradient?: {
        colors: string[];
        angle: number;
    };
    layout: SectionLayout;
}

export interface SectionLayout {
    // Position des éléments dans la section
    photoPosition?: { x: number; y: number; width: number; height: number }; // en %
    videoPosition?: { x: number; y: number; width: number; height: number };
    textZones: TextZone[];
}

export interface TextZone {
    id: string;
    field: keyof BasketballPlayerData | 'custom'; // Quel champ du joueur afficher
    x: number; // %
    y: number; // %
    width?: number; // %
    fontSize: number;
    color: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    label?: string; // Libellé à afficher avant la valeur
    format?: 'uppercase' | 'lowercase' | 'capitalize';
}

export interface BasketballTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    isPremium: boolean;
    tier?: CVTier;

    // Sections du template
    sections: BasketballTemplateSection[];

    // Configuration globale
    totalDuration: number; // en ms
    transitions?: {
        type: 'fade' | 'slide' | 'zoom';
        duration: number;
    };

    // Musique de fond (optionnel)
    musicUrl?: string;

    // Couleurs du thème
    theme: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
    };
}

export interface BasketballTemplateFormProps {
    onComplete: (playerData: BasketballPlayerData) => void;
    onCancel: () => void;
    initialData?: Partial<BasketballPlayerData>;
    templateId?: string;
}

export interface BasketballVideoPreviewProps {
    template: BasketballTemplate;
    playerData: BasketballPlayerData;
    isDemo?: boolean;
    onEdit: () => void;
    onExport: () => void;
    onBack: () => void;
}