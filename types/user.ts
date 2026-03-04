export type SubscriptionPlan = 'essential' | 'elite-pro';

export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    pseudo?: string;
    personality?: string;
    avatarUrl?: string;
    bio?: string;
    position?: string;
    height?: string;
    plan: SubscriptionPlan;
    language?: 'fr' | 'en';
    role: 'user' | 'admin';
    editsThisMonth: number;
    lastEditDate: string; // ISO string
    createdAt: string; // ISO string
    lastSeen?: string; // ISO string
    notificationsEnabled?: boolean;
    isAdFree: boolean;
    city?: string;
    following?: string[]; // Array of user UIDs
    connections?: string[]; // Array of user UIDs for accepted connections
    latestAnalysis?: {
        type: 'shot' | 'session' | 'dribble';
        date: string;
        results: any;
    };
}

export const DB_COLLECTIONS = {
    USERS: 'users',
    BASKETBALL_PLAYERS: 'basketball_players',
    POSTS: 'posts',
    NOTIFICATIONS: 'notifications',
    CONNECTION_REQUESTS: 'connection_requests',
};

export interface ConnectionRequest {
    id: string;
    fromId: string;
    fromName: string;
    fromPhoto?: string;
    toId: string;
    toName: string;
    toPhoto?: string;
    status: 'pending' | 'accepted' | 'rejected';
    members: string[]; // [fromId, toId] for easier querying
    createdAt: number;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    createdAt: number;
    readBy: string[]; // List of user UIDs who read it
    archivedBy: string[]; // List of user UIDs who archived it
    deletedBy: string[]; // List of user UIDs who deleted it
    recipientId?: string; // Optional: target a specific user. If missing, it's a broadcast.
    data?: {
        screen?: string;
        params?: Record<string, any>;
    };
}

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    videoUri: string;
    description: string;
    likes: string[]; // List of user UIDs who liked the post
    createdAt: number;
    isLive?: boolean;
    playgroundId?: string;
    city?: string;
}

export const PLAN_LIMITS = {
    essential: {
        maxEditsPerMonth: 1,
        hasAds: true,
        price: 0,
        label: 'Pack Essentiel'
    },
    'elite-pro': {
        maxEditsPerMonth: Infinity,
        hasAds: false,
        price: 4.90,
        label: 'Pack Elite Pro'
    }
};
