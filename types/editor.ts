/**
 * Types pour l'éditeur vidéo
 */

import { MediaAsset } from './media';
import { SportTemplate } from './template';

export interface VideoEditorProps {
    video: MediaAsset;
    template?: SportTemplate;
    onSave: (editedVideo: EditedVideo) => void;
    onCancel: () => void;
}

export interface EditedVideo {
    originalVideo: MediaAsset;
    template?: SportTemplate;
    trim: {
        startTime: number; // en ms
        endTime: number; // en ms
    };
    textOverlays: TextOverlay[];
    statsOverlays: StatOverlay[];
    shotAnalysis?: ShotAnalysisData;
}

export interface ShotAnalysisData {
    releasePoint?: { x: number; y: number; time: number };
    apexPoint?: { x: number; y: number; time: number };
    hoopPoint?: { x: number; y: number; time: number };
    isGoodShot?: boolean;
    entryAngle?: number; // Calculé
    arcHeight?: number; // Calculé
}

export interface TextOverlay {
    id: string;
    text: string;
    x: number; // position x en %
    y: number; // position y en %
    fontSize: number;
    color: string;
    fontWeight?: 'normal' | 'bold';
    startTime: number; // en ms
    endTime: number; // en ms
    animation?: 'fadeIn' | 'slideIn' | 'zoomIn' | 'none';
}

export interface StatOverlay {
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

export interface TimelineProps {
    duration: number; // durée totale en ms
    currentTime: number; // temps actuel en ms
    trimStart: number; // début du trim en ms
    trimEnd: number; // fin du trim en ms
    onSeek: (time: number) => void;
    onTrimChange: (start: number, end: number) => void;
    textOverlays: TextOverlay[];
    statsOverlays: StatOverlay[];
}

export interface TextEditorProps {
    overlay?: TextOverlay;
    onSave: (overlay: TextOverlay) => void;
    onCancel: () => void;
    currentTime: number;
    videoDuration: number;
}

export interface TrimControlsProps {
    duration: number;
    trimStart: number;
    trimEnd: number;
    onTrimChange: (start: number, end: number) => void;
}