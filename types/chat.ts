export interface Message {
    id: string;
    senderId: string;
    text: string;
    createdAt: number;
    read: boolean;
}

export interface Conversation {
    id: string;
    participants: string[];
    participantProfiles?: Record<string, {
        displayName: string;
        avatarUrl?: string;
        pseudo?: string;
    }>;
    lastMessage?: {
        text: string;
        senderId: string;
        createdAt: number;
    };
    updatedAt: number;
    unreadCount?: Record<string, number>;
}
