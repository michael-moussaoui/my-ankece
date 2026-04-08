import { HandTracker, KalmanFilter2D } from './handTracker';

describe('KalmanFilter2D', () => {
    it('should smooth values over time', () => {
        const filter = new KalmanFilter2D();
        const first = filter.filter(10, 10);
        expect(first).toEqual({ x: 10, y: 10 });

        const second = filter.filter(20, 20);
        // Expect value to be between 10 and 20 (smoothed)
        expect(second.x).toBeGreaterThan(10);
        expect(second.x).toBeLessThan(20);
    });
});

describe('HandTracker', () => {
    it('should detect dribbling based on vertical oscillation', () => {
        const tracker = new HandTracker();

        // Mock a vertical oscillation (dribbling)
        const oscillation = [0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1, 0.3, 0.5, 0.7, 0.5, 0.3];

        let isDribbling = false;
        oscillation.forEach(y => {
            isDribbling = tracker.updateDribbleStatus(y);
        });

        expect(isDribbling).toBe(true);
    });

    it('should NOT detect dribbling for static or slow movement', () => {
        const tracker = new HandTracker();

        // Mock static movement
        const staticMovement = Array(30).fill(0.5);

        let isDribbling = false;
        staticMovement.forEach(y => {
            isDribbling = tracker.updateDribbleStatus(y);
        });

        expect(isDribbling).toBe(false);
    });
});
