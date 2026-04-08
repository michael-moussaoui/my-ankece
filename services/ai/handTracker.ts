import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs';

/**
 * Simple 2D Kalman Filter to smooth x, y positions
 */
export class KalmanFilter2D {
    private x: number = 0;
    private y: number = 0;
    private p: number = 1;
    private q: number = 0.05;
    private r: number = 0.1;
    private k: number = 0;
    private firstRun: boolean = true;

    filter(newX: number, newY: number): { x: number, y: number } {
        if (this.firstRun) {
            this.x = newX;
            this.y = newY;
            this.firstRun = false;
            return { x: newX, y: newY };
        }

        this.p = this.p + this.q;
        this.k = this.p / (this.p + this.r);
        this.x = this.x + this.k * (newX - this.x);
        this.y = this.y + this.k * (newY - this.y);
        this.p = (1 - this.k) * this.p;

        return { x: this.x, y: this.y };
    }

    reset() {
        this.firstRun = true;
    }
}

export class HandTracker {
    private detector: handPoseDetection.HandDetector | null = null;
    private kalman = new KalmanFilter2D();
    private handYHistory: number[] = [];
    private readonly HISTORY_SIZE = 15; // Shorter window for faster detection

    async initialize() {
        // We use Tfjs runtime for stability in React Native
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
            runtime: 'tfjs',
            modelType: 'lite',
            maxHands: 1,
        };
        this.detector = await handPoseDetection.createDetector(model, detectorConfig);
    }

    getContactPoint(hands: handPoseDetection.Hand[]): { x: number, y: number } | null {
        if (hands.length === 0) return null;

        const keypoints = hands[0].keypoints;
        const indexTip = keypoints.find(kp => kp.name === 'index_finger_tip');
        const middleTip = keypoints.find(kp => kp.name === 'middle_finger_tip');

        if (!indexTip || !middleTip) return null;

        const avgX = (indexTip.x + middleTip.x) / 2;
        const avgY = (indexTip.y + middleTip.y) / 2;

        const smoothed = this.kalman.filter(avgX, avgY);

        return {
            x: smoothed.x,
            y: smoothed.y
        };
    }

    updateDribbleStatus(y: number): boolean {
        this.handYHistory.push(y);
        if (this.handYHistory.length > this.HISTORY_SIZE) {
            this.handYHistory.shift();
        }
        return this.isDribbling();
    }

    isDribbling(): boolean {
        if (this.handYHistory.length < 10) return false;
        let directionChanges = 0;
        let lastDiff = 0;
        for (let i = 1; i < this.handYHistory.length; i++) {
            const diff = this.handYHistory[i] - this.handYHistory[i - 1];
            if (lastDiff !== 0 && ((diff > 0 && lastDiff < 0) || (diff < 0 && lastDiff > 0))) {
                if (Math.abs(diff) > 5) { // Very sensitive threshold
                    directionChanges++;
                }
            }
            if (diff !== 0) lastDiff = diff;
        }
        return directionChanges >= 2; // Only 2 changes (down-up) is enough to stay active
    }

    async detectHands(image: tf.Tensor3D | ImageData) {
        if (!this.detector) await this.initialize();
        return await this.detector!.estimateHands(image);
    }
}

export const handTracker = new HandTracker();
