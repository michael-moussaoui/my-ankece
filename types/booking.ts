export type BookingStatus = 'available' | 'reserved' | 'cancelled' | 'completed';

export interface BookingSession {
    id: string;
    coachId: string;
    playerId?: string;
    playerName?: string;
    date: string; // ISO format YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    price: number;
    location: string;
    status: BookingStatus;
    createdAt?: any;
    updatedAt?: any;
}
