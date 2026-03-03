import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// Singleton to manage model loading
class PoseDetectionService {
    model: poseDetection.PoseDetector | null = null;
    isBackendReady = false;

    async init() {
        if (this.isBackendReady && this.model) return;

        console.log("Initializing TensorFlow backend...");
        await tf.ready();
        this.isBackendReady = true;
        console.log("TensorFlow backend ready.");

        console.log("Loading BlazePose model for full body tracking...");
        // BlazePose (MediaPipe Pose) provides 33 keypoints (detailed face, hands, body)
        const detectorConfig = {
            runtime: 'tfjs', // Better compatibility with Expo/TensorFlow.js
            modelType: 'full', // 'lite', 'full', or 'heavy'. Full is a good balance.
            enableSmoothing: true
        };
        this.model = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, detectorConfig);
        console.log("BlazePose model loaded.");
    }

    async detectPose(imageTensor: tf.Tensor3D): Promise<poseDetection.Pose[]> {
        if (!this.model) {
            console.warn("Model not loaded yet.");
            return [];
        }
        return await this.model.estimatePoses(imageTensor);
    }

    // Fonction utilitaire pour calculer l'angle entre 3 points (A, B, C)
    // Utile pour coude (Epaule, Coude, Poignet) ou genou (Hanche, Genou, Cheville)
    calculateAngle(pointA: poseDetection.Keypoint, pointB: poseDetection.Keypoint, pointC: poseDetection.Keypoint): number {
        if (!pointA || !pointB || !pointC || !pointA.x || !pointB.x || !pointC.x) return 0;

        const AB = Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2));
        const BC = Math.sqrt(Math.pow(pointB.x - pointC.x, 2) + Math.pow(pointB.y - pointC.y, 2));
        const AC = Math.sqrt(Math.pow(pointC.x - pointA.x, 2) + Math.pow(pointC.y - pointA.y, 2));

        // Loi des cosinus: AC^2 = AB^2 + BC^2 - 2*AB*BC*cos(angle)
        // cos(angle) = (AB^2 + BC^2 - AC^2) / (2 * AB * BC)
        const cosAngle = (AB * AB + BC * BC - AC * AC) / (2 * AB * BC);
        const angle = Math.acos(cosAngle) * (180 / Math.PI); // Convertir radians en degrés

        return Math.round(angle);
    }
}

export const poseService = new PoseDetectionService();
