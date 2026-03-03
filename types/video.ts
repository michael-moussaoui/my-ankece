/**
 * Types pour la prévisualisation et la manipulation vidéo
 */

import { MediaAsset } from './media';

export interface VideoPreviewProps {
    video: MediaAsset;
    onClose?: () => void;
    onEdit?: () => void;
    showControls?: boolean;
    autoPlay?: boolean;
}

export interface VideoPlayerState {
    isPlaying: boolean;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    isLoading: boolean;
    error: string | null;
}

export interface VideoControlsProps {
    isPlaying: boolean;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    onPlayPause: () => void;
    onMuteToggle: () => void;
    onSeek: (time: number) => void;
    onFullscreen?: () => void;
}