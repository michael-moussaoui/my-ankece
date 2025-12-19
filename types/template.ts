/**
 * Types pour les templates sportifs
 */

export type SportType =
    | 'football'
    | 'basketball'
    | 'tennis'
    | 'rugby'
    | 'handball'
    | 'volleyball'
    | 'athletics'
    | 'swimming'
    | 'cycling'
    | 'other';

export interface TextElement {
    id: string;
    text: string;
    x: number; // position x en %
    y: number; // position y en %
    fontSize: number;
    fontFamily?: string;
    color: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    textAlign?: 'left' | 'center' | 'right';
    animation?: 'fadeIn' | 'slideIn' | 'zoomIn' | 'none';
    animationDuration?: number; // en ms
    startTime: number; // moment d'apparition en ms
    endTime: number; // moment de disparition en ms
}

export interface StatElement {
    id: string;
    label: string;
    value: string | number;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    icon?: string;
    startTime: number;
    endTime: number;
}

export interface SportTemplate {
    id: string;
    name: string;
    sport: SportType;
    thumbnail: string;
    description: string;
    isPremium: boolean;
    textElements: TextElement[];
    statElements: StatElement[];
    backgroundColor?: string;
    backgroundGradient?: {
        colors: string[];
        start: { x: number; y: number };
        end: { x: number; y: number };
    };
    musicUrl?: string;
    duration: number; // durée par défaut en ms
}

export interface PlayerProfile {
    name: string;
    position: string;
    number?: number;
    team?: string;
    stats?: Record<string, string | number>;
    photo?: string;
}