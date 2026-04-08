
export interface Target {
    id: string;
    x: number;
    y: number;
    radius: number;
    speed: number;
    direction: { dx: number; dy: number };
    timeToLive: number;
    points: number;
    type: 'normal' | 'bonus' | 'malus';
    color: string;
    createdAt: number;
}

export class TargetEngine {
    private screenWidth: number;
    private screenHeight: number;

    constructor(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;
    }

    spawnTarget(level: number): Target {
        const id = Math.random().toString(36).substring(7);
        const baseSpeed = 4 + (level * 1.0); // Faster movement
        const radius = Math.max(25, 50 - level * 2);
        const typeRand = Math.random();

        let type: Target['type'] = 'normal';
        let color = '#FF9500'; // Brand Orange
        let points = 10;

        if (typeRand > 0.9) {
            type = 'bonus';
            color = '#FFD700'; // Gold
            points = 50;
        } else if (level >= 5 && typeRand < 0.15) {
            type = 'malus';
            color = '#FF3B30'; // Red
            points = -20;
        }

        return {
            id,
            x: Math.random() * (this.screenWidth - radius * 2) + radius,
            y: this.screenHeight - radius, // Spawn at bottom but visible
            radius,
            speed: baseSpeed * (0.8 + Math.random() * 0.4),
            direction: {
                dx: (Math.random() - 0.5) * 4,
                dy: -1 * (baseSpeed) // Moving up
            },
            timeToLive: 4000, // Longer life to ensure crossing
            points,
            type,
            color,
            createdAt: Date.now()
        };
    }

    updatePositions(targets: Target[], deltaTime: number): Target[] {
        const now = Date.now();
        return targets.map(t => {
            const effectiveDeltaTime = Math.min(deltaTime, 48); // Cap to 48ms to avoid teleporting at low FPS
            const speedFactor = effectiveDeltaTime / 16.67; // Normalize to 60fps
            let nextX = t.x + t.direction.dx * speedFactor;
            let nextY = t.y + t.direction.dy * speedFactor;

            // Bounce on edges
            let dx = t.direction.dx;
            let dy = t.direction.dy;

            if (nextX < t.radius || nextX > this.screenWidth - t.radius) {
                dx *= -1;
            }
            // Only bounce on top edge, let them fly out from bottom or spawn correctly
            if (nextY < t.radius) {
                dy *= -1;
            }

            return {
                ...t,
                x: nextX,
                y: nextY,
                direction: { dx, dy }
            };
        }).filter(t => (now - t.createdAt) < t.timeToLive);
    }

    checkCollision(handPos: { x: number; y: number }, target: Target): boolean {
        const HAND_RADIUS = 25;
        const dist = Math.sqrt(Math.pow(handPos.x - target.x, 2) + Math.pow(handPos.y - target.y, 2));
        return dist < target.radius + HAND_RADIUS;
    }
}
