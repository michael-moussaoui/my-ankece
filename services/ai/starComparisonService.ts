import Constants from 'expo-constants';

const getBaseUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) {
        return `http://${debuggerHost}:8000`;
    }
    return 'http://10.0.2.2:8000';
};

const AI_SERVICE_URL = getBaseUrl();

export interface StarComparisonMetrics {
    release_angle?: number;
    knee_bend_angle?: number;
    elbow_angle_at_release?: number;
    follow_through_score?: number;
    frequency?: number;
    consistency?: number;
}

export interface StarComparisonResponse {
    success: boolean;
    comparison: {
        star_name: string;
        overall_similarity: number;
        breakdown?: {
            release_similarity: number;
            knee_similarity: number;
            follow_through_similarity: number;
        };
        metrics_comparison?: {
            user_freq: number;
            star_freq: number;
            user_consistency: number;
        };
        pro_tip: string;
    };
}

class StarComparisonService {
    async compareShot(metrics: StarComparisonMetrics, starId: string = 'steph_curry'): Promise<StarComparisonResponse> {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/compare-shot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ metrics, star_id: starId }),
            });

            if (!response.ok) {
                throw new Error(`Comparison failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Star Comparison Error:', error);
            throw error;
        }
    }

    async compareDribble(metrics: StarComparisonMetrics, starId: string = 'kyrie_irving'): Promise<StarComparisonResponse> {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/compare-dribble`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ metrics, star_id: starId }),
            });

            if (!response.ok) {
                throw new Error(`Comparison failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Star Comparison Error:', error);
            throw error;
        }
    }
}

export const starComparisonService = new StarComparisonService();
