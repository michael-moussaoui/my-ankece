import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { BasketballPlayerData } from '../types/basketball/template';
import { cloudinaryService } from './cloudinaryService';

const getBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    
    // Si on est sur un simulateur Android, 10.0.2.2 est l'hôte
    if (Platform.OS === 'android' && !hostUri?.includes('192.168.')) {
        return 'http://10.0.2.2:8000';
    }

    // Sinon, on essaie de récupérer l'IP de la machine de dev via Expo
    if (hostUri) {
        const debuggerHost = hostUri.split(':')[0];
        if (debuggerHost) {
            return `http://${debuggerHost}:8000`;
        }
    }

    // Fallback par défaut (iOS Simulator ou cas où hostUri est absent)
    return 'http://localhost:8000';
};

const API_BASE_URL = getBaseUrl();

export interface CVGenerationResponse {
    success: boolean;
    message: string;
    job_id?: string;
}

export const basketballCVService = {
    /**
     * Internal base URL logic
     */
    getBaseUrl,

    /**
     * Triggers the video CV generation on the backend.
     */
    generateVideoCV: async (playerData: BasketballPlayerData): Promise<CVGenerationResponse> => {
        try {
            console.log("📤 Uploading media to Cloudinary...");

            // Upload separate files - Only if they are local URIs
            const uploadIfNeeded = async (uri: string | null | undefined, type: 'image' | 'video') => {
                if (!uri) return null;
                if (uri.startsWith('http')) return uri; // Already uploaded
                return type === 'image' ? await cloudinaryService.uploadImage(uri) : await cloudinaryService.uploadVideo(uri);
            };

            const profilePhotoUrl = await uploadIfNeeded(playerData.profilePhoto?.uri, 'image');
            const clubLogoUrl = await uploadIfNeeded(playerData.currentClub.clubLogo?.uri, 'image');
            const presentationVideoUrl = await uploadIfNeeded(playerData.presentationVideo?.uri, 'video');

            // Upload offensive videos in parallel
            const offensiveVideoUrls = await Promise.all(
                (playerData.offensiveVideos || []).map(async (v) =>
                    uploadIfNeeded(v.uri, 'video')
                )
            ).then(results => results.filter((url): url is string => !!url));

            // Upload defensive videos in parallel
            const defensiveVideoUrls = await Promise.all(
                (playerData.defensiveVideos || []).map(async (v) =>
                    uploadIfNeeded(v.uri, 'video')
                )
            ).then(results => results.filter((url): url is string => !!url));

            console.log(`✅ Media uploaded. (${offensiveVideoUrls.length} off, ${defensiveVideoUrls.length} def). Triggering backend...`);

            // Prepare the data for the backend
            const payload = {
                firstName: playerData.firstName,
                lastName: playerData.lastName,
                age: playerData.age,
                position: playerData.position,
                height: playerData.height,
                wingspan: playerData.wingspan,
                verticalLeap: playerData.verticalLeap,
                dominantHand: playerData.dominantHand,
                strengths: playerData.strengths,
                currentClub: {
                    clubName: playerData.currentClub.clubName,
                    season: playerData.currentClub.season,
                    category: playerData.currentClub.category,
                    league: playerData.currentClub.league,
                    number: playerData.currentClub.number,
                },
                clubHistory: (playerData.clubHistory || []).map(club => ({
                    clubName: club.clubName,
                    season: club.season,
                    category: club.category,
                    league: club.league,
                    number: club.number,
                })),
                stats: playerData.stats,
                clubLogoUrl: clubLogoUrl || undefined,
                instagram: playerData.instagram || undefined,
                twitter: playerData.twitter || undefined,
                facebook: playerData.facebook || undefined,
                primaryColor: playerData.primaryColor || undefined,
                accentColor: playerData.accentColor || undefined,
                transitionType: playerData.transitionType || 'fade',
                jobId: playerData.jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                tier: playerData.tier,
                templateId: playerData.templateId,
                language: playerData.language || 'fr',
                // Now using Cloudinary URLs
                profilePhotoUrl,
                offensiveVideoUrls,
                defensiveVideoUrls,
                presentationVideoUrl,
            };

            const response = await fetch(`${API_BASE_URL}/generate-cv-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse JSON response:', responseText);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
            }
        } catch (error) {
            console.error('❌ Error triggering CV generation:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },

    /**
     * Polls or checks the status of a CV generation job.
     */
    getJobStatus: async (jobId: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/job-status/${jobId}`);
            const responseText = await response.text();
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse status JSON:', responseText);
                throw new Error(`Invalid Status JSON from ${API_BASE_URL}: ${responseText.substring(0, 100)}...`);
            }
        } catch (error) {
            console.error('❌ Error checking job status:', error);
            return {
                success: false,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Unknown status error',
            };
        }
    },

    /**
     * Cancels a video CV generation job.
     */
    cancelVideoCV: async (jobId: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/cancel-cv-generation/${jobId}`, {
                method: 'POST',
            });
            return await response.json();
        } catch (error) {
            console.error('❌ Error cancelling CV generation:', error);
            throw error;
        }
    }
};
