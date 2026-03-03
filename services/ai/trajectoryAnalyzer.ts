import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

/**
 * Ball position with timestamp
 */
export interface BallPosition {
    x: number;
    y: number;
    timestamp: number;
    confidence: number;
}

export interface BasketPosition {
    x: number;
    y: number;
    radius: number;
    confidence: number;
}

/**
 * Trajectory analysis result
 */
export interface TrajectoryAnalysis {
    positions: BallPosition[];
    peakAngle: number;
    arcHeight: number;
    releaseAngle: number;
    entryAngle: number;
    quality: 'too-low' | 'optimal' | 'too-high';
    color: string;
    shotResult?: 'made' | 'missed' | 'unknown';
    basketPosition?: BasketPosition | null;
}

/**
 * Service for analyzing basketball shot trajectories
 */
class TrajectoryAnalyzer {
    private readonly MIN_POSITIONS = 5;
    private readonly OPTIMAL_RELEASE_ANGLE_MIN = 35;
    private readonly OPTIMAL_RELEASE_ANGLE_MAX = 50;
    private model: cocoSsd.ObjectDetection | null = null;
    private isModelLoading = false;

    /**
     * Load the COCO-SSD model
     */
    private async loadModel() {
        if (this.model || this.isModelLoading) return;
        this.isModelLoading = true;
        try {
            this.model = await cocoSsd.load({
                base: 'lite_mobilenet_v2' // Fast for mobile
            });
        } catch (error) {
            console.error('Error loading COCO-SSD model:', error);
        } finally {
            this.isModelLoading = false;
        }
    }

    /**
     * Detect basketball in a tensor frame
     * Uses COCO-SSD model to find 'sports ball'
     */
    async detectBall(tensor: tf.Tensor3D): Promise<BallPosition | null> {
        try {
            if (!this.model) {
                await this.loadModel();
                if (!this.model) return null;
            }

            // Run detection
            const predictions = await this.model.detect(tensor);

            // Find 'sports ball' (COCO class for basketball, soccer, etc.)
            // We use a relatively low threshold (0.4) as movement might blur the ball
            const ball = predictions.find(p => p.class === 'sports ball' && p.score > 0.4);

            if (ball) {
                const [x, y, width, height] = ball.bbox;
                return {
                    x: x + width / 2, // Center of bounding box
                    y: y + height / 2,
                    timestamp: Date.now(),
                    confidence: ball.score,
                };
            }

            return null;
        } catch (error) {
            console.error('Ball detection error:', error);
            return null;
        }
    }

    /**
     * Calculate trajectory from ball positions
     */
    calculateTrajectory(positions: BallPosition[], basket?: BasketPosition | null): TrajectoryAnalysis | null {
        if (positions.length < this.MIN_POSITIONS) {
            return null;
        }

        // Fit parabolic curve: y = ax^2 + bx + c
        const { a, b, c } = this.fitParabola(positions);

        // Calculate peak angle (derivative at release point)
        const releasePoint = positions[0];
        const releaseAngle = this.calculateAngle(a, b, releasePoint.x);

        // Calculate peak height
        const peakX = -b / (2 * a);
        const peakY = a * peakX * peakX + b * peakX + c;
        const arcHeight = Math.abs(peakY - releasePoint.y);

        // Calculate entry angle (at the end)
        const entryPoint = positions[positions.length - 1];
        const entryAngle = this.calculateAngle(a, b, entryPoint.x);

        // Evaluate quality
        const quality = this.evaluateArc(releaseAngle);

        // Shot success validation
        let shotResult: 'made' | 'missed' | 'unknown' = 'unknown';
        if (basket) {
            shotResult = this.validateShot(positions, basket);
        }

        const color = this.getTrajectoryColor(quality, shotResult);

        return {
            positions,
            peakAngle: Math.abs(releaseAngle),
            arcHeight,
            releaseAngle: Math.abs(releaseAngle),
            entryAngle: Math.abs(entryAngle),
            quality,
            color,
            shotResult,
            basketPosition: basket
        };
    }

    /**
     * Simple shot success validation
     * Checks if any position is inside the basket and moving down
     */
    private validateShot(positions: BallPosition[], basket: BasketPosition): 'made' | 'missed' | 'unknown' {
        let passedThrough = false;

        for (let i = 1; i < positions.length; i++) {
            const pos = positions[i];
            const prevPos = positions[i - 1];

            // Distance to basket center
            const dist = Math.sqrt(Math.pow(pos.x - basket.x, 2) + Math.pow(pos.y - basket.y, 2));

            // Check if inside basket radius and moving downwards (y increasing)
            if (dist < basket.radius * 1.5 && pos.y > prevPos.y) {
                // If the ball was above or near the rim level and now is inside
                passedThrough = true;
                break;
            }
        }

        if (passedThrough) return 'made';

        // If the ball has passed the x-coordinate of the basket but was far above/below
        const lastPos = positions[positions.length - 1];
        if (lastPos.timestamp - positions[0].timestamp > 1000) {
            // If the shot has been tracked for more than a second and hasn't "made" it
            return 'missed';
        }

        return 'unknown';
    }

    /**
     * Fit parabola to points using least squares
     */
    private fitParabola(positions: BallPosition[]): { a: number; b: number; c: number } {
        const n = positions.length;
        let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        let sumXY = 0, sumX2Y = 0;

        for (const pos of positions) {
            const x = pos.x;
            const y = pos.y;
            sumX += x;
            sumY += y;
            sumX2 += x * x;
            sumX3 += x * x * x;
            sumX4 += x * x * x * x;
            sumXY += x * y;
            sumX2Y += x * x * y;
        }

        // Solve system of equations using matrix operations
        // Simplified solution for parabola fitting
        const denom = n * sumX2 * sumX4 - sumX2 * sumX2 * sumX2;

        if (Math.abs(denom) < 0.0001) {
            // Fallback to linear approximation
            return { a: 0, b: (sumXY - sumX * sumY / n) / (sumX2 - sumX * sumX / n), c: sumY / n };
        }

        const a = (n * sumX2Y - sumX2 * sumY) / denom;
        const b = (sumXY - a * sumX3 - sumX * sumY / n) / (sumX2 - sumX * sumX / n);
        const c = (sumY - a * sumX2 - b * sumX) / n;

        return { a, b, c };
    }

    /**
     * Calculate angle of trajectory at point x
     */
    private calculateAngle(a: number, b: number, x: number): number {
        // Derivative: dy/dx = 2ax + b
        const slope = 2 * a * x + b;
        const angleRad = Math.atan(Math.abs(slope));
        return angleRad * (180 / Math.PI); // Convert to degrees
    }

    /**
     * Evaluate arc quality based on release angle
     */
    private evaluateArc(releaseAngle: number): 'too-low' | 'optimal' | 'too-high' {
        const angle = Math.abs(releaseAngle);

        if (angle < this.OPTIMAL_RELEASE_ANGLE_MIN) {
            return 'too-low';
        } else if (angle > this.OPTIMAL_RELEASE_ANGLE_MAX) {
            return 'too-high';
        } else {
            return 'optimal';
        }
    }

    /**
     * Get color based on trajectory quality and result
     */
    private getTrajectoryColor(quality: 'too-low' | 'optimal' | 'too-high', shotResult?: string): string {
        // Priority to success color if made
        if (shotResult === 'made') {
            return '#00F2FF'; // Cyan / Neon Blue
        }

        switch (quality) {
            case 'too-low':
                return '#FF3B30'; // Red
            case 'optimal':
                return '#34C759'; // Green
            case 'too-high':
                return '#FF9500'; // Orange
            default:
                return '#FFFFFF';
        }
    }

    /**
     * Reset trajectory data
     */
    reset(): void {
        // Can be used to clear any cached data if needed
    }
}

export const trajectoryAnalyzer = new TrajectoryAnalyzer();
