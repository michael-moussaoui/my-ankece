import Constants from 'expo-constants';
import { BasketballPlayerData } from '../types/basketball/template';
import { cloudinaryService } from './cloudinaryService';

const getBaseUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) {
        return `http://${debuggerHost}:8000`;
    }
    return 'http://10.0.2.2:8000'; // Default for Android Emulator
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
            
            // Upload separate files
            const profilePhotoUrl = playerData.profilePhoto?.uri ? await cloudinaryService.uploadImage(playerData.profilePhoto.uri) : null;
            const clubLogoUrl = playerData.currentClub.clubLogo?.uri ? await cloudinaryService.uploadImage(playerData.currentClub.clubLogo.uri) : null;
            const presentationVideoUrl = playerData.presentationVideo?.uri ? await cloudinaryService.uploadVideo(playerData.presentationVideo.uri) : null;

            // Upload offensive videos in parallel
            const offensiveVideoUrls = await Promise.all(
                (playerData.offensiveVideos || []).map(async (v) => 
                    v.uri ? await cloudinaryService.uploadVideo(v.uri) : null
                )
            ).then(results => results.filter((url): url is string => !!url));

            // Upload defensive videos in parallel
            const defensiveVideoUrls = await Promise.all(
                (playerData.defensiveVideos || []).map(async (v) => 
                    v.uri ? await cloudinaryService.uploadVideo(v.uri) : null
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

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
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
            if (!response.ok) {
                throw new Error(`Status API Error: ${response.status}`);
            }
            return await response.json();
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
