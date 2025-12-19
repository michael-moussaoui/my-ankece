/**
 * Types pour la gestion des médias (vidéos, images)
 */

export interface MediaAsset {
    uri: string;
    type: 'video' | 'image';
    duration?: number | null;
    width?: number | null;
    height?: number | null;
    fileName?: string | null;
    fileSize?: number | null;
}

export interface MediaPickerProps {
    onMediaSelected: (asset: MediaAsset) => void;
    mediaType?: 'video' | 'image' | 'both';
    maxDuration?: number; // en secondes
    maxFileSize?: number; // en MB
}

export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    frameRate?: number;
    bitrate?: number;
    codec?: string;
}

export interface MediaError {
    code: string;
    message: string;
    details?: any;
}