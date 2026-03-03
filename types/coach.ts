export enum CoachSpecialty {
    SHOOTING = 'shooting',
    BALL_HANDLING = 'ball_handling',
    CONDITIONING = 'conditioning',
    DEFENSE = 'defense',
    MENTAL_PREP = 'mental_prep',
    INDIVIDUAL = 'individual',
    COLLECTIVE = 'collective',
    INDY_AND_COLLECTIVE = 'indy_and_collective',
}

export enum CoachLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    ELITE = 'elite',
}

export interface Coach {
    id: string;
    userId: string;
    name: string;
    photoUrl: string;
    status: 'pending' | 'active' | 'rejected';
    rejectionReason?: string;
    createdAt?: any;
    updatedAt?: any;
    badge?: 'elite' | 'certified' | 'pro' | 'top_rated' | null;
    rating: number;
    reviewCount: number;
    studentCount: number;
    experienceYears: number;
    specialties: CoachSpecialty[];
    levels: CoachLevel[];
    priceRange: {
        min: number;
        max: number;
        currency: string;
    };
    location: {
        latitude: number;
        longitude: number;
        city: string;
        radiusKm: number;
    };
    description: string;
    qualifications: string[];
    pastClubs: string[];
    philosophy: string;
    isIndoor: boolean;
    isOutdoor: boolean;
    atHome: boolean;
    publicCourt: boolean;
    isFree: boolean;
    requestedBadge?: 'pro' | 'certified' | null;
    pendingUpdate?: Partial<Coach>;
}

export interface Review {
    id: string;
    coachId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    rating: number; // 1 to 5
    comment: string;
    createdAt: number;
}
