import Constants from 'expo-constants';

// For Android Emulator, use 10.0.2.2. For iOS/Physical, use your computer's local IP.
const getBaseUrl = () => {
    // If we're debugging on a physical device, 127.0.0.1 refers to the PHONE.
    // We need the local IP of the machine running the FastAPI server.
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) {
        return `http://${debuggerHost}:8000`;
    }
    return 'http://10.0.2.2:8000'; // Default for Android Emulator
};

const AI_SERVICE_URL = getBaseUrl();

export interface ExpertAnalysisResponse {
    success: boolean;
    type: 'video' | 'image';
    filename: string;
    analysis: {
        success: boolean;
        frame_count: number;
        analyzed_frames: number;
        max_elbow_angle: number;
        min_elbow_angle: number;
        avg_torso_lean: number;
        coaching_report: string[];
        sequence: Array<{
            frame: number;
            right_elbow: number;
            right_knee: number;
            torso_lean: number;
            arm_elevation: number;
        }>;
    };
}

export interface ExpertDribbleResponse {
    success: boolean;
    filename: string;
    analysis: {
        success: boolean;
        dribble_count: number;
        moves: string[];
        message: string;
    };
}

export interface ExpertSessionResponse {
    success: boolean;
    filename: string;
    analysis: {
        success: boolean;
        total_shots: number;
        makes: number;
        misses: number;
        accuracy: number;
        composition: {
            free_throws: number;
            three_points: number;
            mid_range: number;
        };
        message: string;
    };
}

class ExpertAiService {
    async analyzeVideo(videoUri: string): Promise<ExpertAnalysisResponse> {
        return this.fetchAiService('/analyze-shot', videoUri);
    }

    async analyzeDribble(videoUri: string): Promise<ExpertDribbleResponse> {
        return this.fetchAiService('/analyze-dribble', videoUri);
    }

    async analyzeSession(videoUri: string): Promise<ExpertSessionResponse> {
        return this.fetchAiService('/analyze-session', videoUri);
    }

    private async fetchAiService(endpoint: string, videoUri: string) {
        const formData = new FormData();
        const filename = videoUri.split('/').pop() || 'video.mov';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `video/${match[1]}` : `video/mov`;

        // @ts-ignore
        formData.append('file', {
            uri: videoUri,
            name: filename,
            type: type,
        });

        const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI Service Error:', errorText);
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    }
}

export const expertAiService = new ExpertAiService();
