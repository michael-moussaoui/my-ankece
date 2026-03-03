import { BasketballPlayerData, BasketballTemplate } from '@/types/basketball/template';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert } from 'react-native';

// Type definitions for FFmpeg (will be loaded dynamically)
let FFmpegKit: any;
let ReturnCode: any;

/**
 * Check if FFmpeg is available (only in Development Builds)
 */
const isFFmpegAvailable = () => {
    try {
        const ffmpegModule = require('ffmpeg-kit-react-native');
        FFmpegKit = ffmpegModule.FFmpegKit;
        ReturnCode = ffmpegModule.ReturnCode;
        return !!FFmpegKit;
    } catch (e) {
        console.log('FFmpeg not available (Expo Go). Real video export is disabled.');
        return false;
    }
};

export type ExportFormat = 'mp4' | 'instagram-story' | 'instagram-post' | 'tiktok' | 'youtube';

export interface ExportOptions {
    format: ExportFormat;
    quality: 'low' | 'medium' | 'high';
    includeWatermark?: boolean;
}

export interface ExportProgress {
    stage: 'preparing' | 'processing' | 'saving' | 'complete';
    progress: number;
    message: string;
}

const EXPORT_FORMATS = {
    mp4: { width: 1920, height: 1080, aspectRatio: '16:9', name: 'MP4 Full HD (1080p)', orientation: 'landscape' },
    'instagram-story': { width: 1080, height: 1920, aspectRatio: '9:16', name: 'Instagram Story', orientation: 'portrait' },
    'instagram-post': { width: 1080, height: 1080, aspectRatio: '1:1', name: 'Instagram Post', orientation: 'square' },
    tiktok: { width: 1080, height: 1920, aspectRatio: '9:16', name: 'TikTok', orientation: 'portrait' },
    youtube: { width: 1920, height: 1080, aspectRatio: '16:9', name: 'YouTube', orientation: 'landscape' },
};

/**
 * Service Export - Version Haute Précision avec FFmpeg
 */
export class ExportService {
    static async exportCV(
        template: BasketballTemplate,
        playerData: BasketballPlayerData,
        options: ExportOptions,
        onProgress?: (progress: ExportProgress) => void
    ): Promise<string> {
        try {
            onProgress?.({
                stage: 'preparing',
                progress: 0,
                message: 'Vérification des permissions...',
            });

            // Permission MediaLibrary
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') throw new Error('Permission refusée pour accéder à la galerie');

            onProgress?.({ stage: 'preparing', progress: 5, message: 'Initialisation...' });

            const formatInfo = EXPORT_FORMATS[options.format];
            const fileName = `CV_${playerData.firstName}_${playerData.lastName}_${Date.now()}.mp4`;
            const cacheDir = (FileSystem as any).cacheDirectory || '';
            const outputPath = `${cacheDir}${fileName}`;

            // Vérifier FFmpeg et gérer le mode démo
            const ffmpegReady = isFFmpegAvailable();
            if (!ffmpegReady) {
                onProgress?.({ stage: 'processing', progress: 10, message: 'Mode Démo (Expo Go)...' });
                const demoSource = playerData.offensiveVideo?.uri || playerData.defensiveVideo?.uri;

                if (!demoSource) throw new Error('Aucune vidéo source pour le mode démo.');

                // Copie simple pour simuler l'export dans Expo Go
                await FileSystem.copyAsync({ from: demoSource, to: outputPath });

                // On saute directement à la partie sauvegarde
                return await this.saveToGallery(outputPath, onProgress);
            }

            onProgress?.({ stage: 'processing', progress: 10, message: 'Génération de l\'intro et montage...' });

            /**
             * CONSTRUCTION DE LA COMMANDE FFMPEG
             * 1. On crée une intro de 2s à partir de la photo de profil
             * 2. On unifie la résolution (format sélectionné)
             * 3. On concatène les segments
             */

            const profilePhotoUri = playerData.profilePhoto;
            const segments = [];

            // On commence par l'intro photo si elle existe
            if (profilePhotoUri) {
                segments.push({ uri: profilePhotoUri, isImage: true, duration: 2 });
            }

            // On ajoute les vidéos
            if (playerData.offensiveVideo) segments.push({ uri: playerData.offensiveVideo.uri, isImage: false });
            if (playerData.defensiveVideo) segments.push({ uri: playerData.defensiveVideo.uri, isImage: false });

            if (segments.length === 0) {
                throw new Error('Aucun média selectionné pour l\'export.');
            }

            // Construction des inputs
            let inputsCmd = "";
            let filterComplex = "";
            let concatStr = "";

            segments.forEach((seg, i) => {
                if (seg.isImage) {
                    inputsCmd += `-loop 1 -t ${seg.duration} -i "${seg.uri}" `;
                } else {
                    inputsCmd += `-i "${seg.uri}" `;
                }

                // Redimensionnement et mise au format
                filterComplex += `[${i}:v]scale=${formatInfo.width}:${formatInfo.height}:force_original_aspect_ratio=decrease,pad=${formatInfo.width}:${formatInfo.height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p[v${i}]; `;

                // Gestion de l'audio (silence pour l'image, audio original pour la vidéo)
                if (seg.isImage) {
                    filterComplex += `anullsrc=r=44100:cl=stereo[a${i}]; `;
                } else {
                    filterComplex += `[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]; `;
                }

                concatStr += `[v${i}][a${i}]`;
            });

            const ffmpegCommand = `${inputsCmd}-filter_complex "${filterComplex}${concatStr}concat=n=${segments.length}:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p "${outputPath}"`;

            console.log('Running FFmpeg command:', ffmpegCommand);

            const session = await FFmpegKit.execute(ffmpegCommand);
            const returnCode = await session.getReturnCode();

            if (ReturnCode.isSuccess(returnCode)) {
                return await this.saveToGallery(outputPath, onProgress);
            } else {
                const logs = await session.getAllLogsAsString();
                console.error('FFmpeg failed:', logs);
                throw new Error('Échec de la génération vidéo.');
            }

        } catch (error: any) {
            console.error('❌ Erreur export:', error);
            const message = error.message || 'Une erreur est survenue lors de la génération de la vidéo.';
            Alert.alert('Erreur d\'exportation', message);
            throw error;
        }
    }

    private static async saveToGallery(outputPath: string, onProgress?: (p: ExportProgress) => void): Promise<string> {
        onProgress?.({ stage: 'saving', progress: 90, message: 'Enregistrement dans la galerie...' });

        // Sauvegarder dans la galerie
        const asset = await MediaLibrary.createAssetAsync(outputPath);
        const albumName = 'Ankece CV';
        const album = await MediaLibrary.getAlbumAsync(albumName);

        if (album === null) {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        onProgress?.({ stage: 'complete', progress: 100, message: 'Vidéo sauvegardée !' });

        if (!isFFmpegAvailable()) {
            Alert.alert(
                'Mode Démo Actif',
                'Le montage vidéo réel nécessite une Build de Développement. Dans ce mode Expo Go, nous avons utilisé un clip source pour démontrer le flux d\'enregistrement.'
            );
        }

        return asset.uri;
    }

    static async shareCV(filePath: string) {
        const available = await Sharing.isAvailableAsync();
        if (!available) {
            Alert.alert('Partage non disponible', 'Le partage n’est pas disponible sur cet appareil');
            return;
        }

        await Sharing.shareAsync(filePath, {
            mimeType: 'video/mp4',
            dialogTitle: 'Partager mon CV Basketball',
        });
    }

    static getFormatInfo(format: ExportFormat) {
        return EXPORT_FORMATS[format];
    }

    static getAllFormats() {
        return Object.entries(EXPORT_FORMATS).map(([id, value]) => ({
            id: id as ExportFormat,
            ...value,
        }));
    }
}

/**
 * Hook export
 */
export const useExport = () => {
    const [isExporting, setIsExporting] = React.useState(false);
    const [progress, setProgress] = React.useState<ExportProgress | null>(null);

    const exportCV = async (
        template: BasketballTemplate,
        playerData: BasketballPlayerData,
        options: ExportOptions
    ) => {
        setIsExporting(true);
        setProgress({ stage: 'preparing', progress: 0, message: 'Démarrage...' });

        try {
            return await ExportService.exportCV(template, playerData, options, setProgress);
        } finally {
            setIsExporting(false);
        }
    };

    const shareCV = async (filePath: string) => {
        await ExportService.shareCV(filePath);
    };

    return { isExporting, progress, exportCV, shareCV };
};
