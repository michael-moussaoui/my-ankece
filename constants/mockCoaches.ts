import { Coach, CoachLevel, CoachSpecialty } from '@/types/coach';

export const MOCK_COACHES: Coach[] = [
    {
        id: 'coach-1',
        name: 'Thomas "Sniper" Durand',
        photoUrl: 'https://images.unsplash.com/photo-1544602823-239a74542a9b?q=80&w=400&h=400&auto=format&fit=crop',
        badge: 'elite',
        rating: 4.9,
        reviewCount: 124,
        studentCount: 450,
        experienceYears: 12,
        specialties: [CoachSpecialty.SHOOTING, CoachSpecialty.MENTAL_PREP, CoachSpecialty.INDIVIDUAL],
        levels: [CoachLevel.ADVANCED, CoachLevel.ELITE],
        priceRange: {
            min: 50,
            max: 80,
            currency: '€'
        },
        location: {
            latitude: 48.8566,
            longitude: 2.3522,
            city: 'Paris',
            radiusKm: 15
        },
        description: 'Ancien joueur pro avec une expertise pointue sur la mécanique de tir. J\'aide les joueurs à atteindre l\'élite en travaillant le shoot et le mental.',
        qualifications: [
            'Diplôme d\'État de la Jeunesse, de l\'Éducation Populaire et du Sport (DEJEPS)',
            'Certification NBA Skills Trainer',
            'Master en Psychologie du Sport'
        ],
        pastClubs: ['Metropolitans 92', 'ASVEL', 'Nanterre 92'],
        philosophy: 'Le tir est une science, le mental est un art. Ma mission est de fusionner les deux pour créer des tireurs d\'élite infatigables.',
        isIndoor: true,
        isOutdoor: true,
        atHome: false,
        publicCourt: true
    },
    {
        id: 'coach-2',
        name: 'Sarah "The Wall" Martin',
        photoUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&h=400&auto=format&fit=crop',
        badge: 'certified',
        rating: 4.7,
        reviewCount: 89,
        studentCount: 210,
        experienceYears: 8,
        specialties: [CoachSpecialty.DEFENSE, CoachSpecialty.CONDITIONING, CoachSpecialty.COLLECTIVE],
        levels: [CoachLevel.BEGINNER, CoachLevel.INTERMEDIATE, CoachLevel.ADVANCED],
        priceRange: {
            min: 40,
            max: 60,
            currency: '€'
        },
        location: {
            latitude: 45.7640,
            longitude: 4.8357,
            city: 'Lyon',
            radiusKm: 10
        },
        description: 'Spécialiste défensive, je vous apprends à devenir un verrou sur le terrain. La condition physique est la base de mon coaching.',
        qualifications: [
            'Brevet d\'État d\'Éducateur Sportif (BEES)',
            'Préparateur Physique Certifié'
        ],
        pastClubs: ['LDLC ASVEL Féminin', 'FC Lyon'],
        philosophy: 'La défense gagne des championnats. Travailleurs de l\'ombre, je vous montre comment impacter le jeu sans marquer un point.',
        isIndoor: true,
        isOutdoor: false,
        atHome: true,
        publicCourt: false
    },
    {
        id: 'coach-3',
        name: 'Julien "Handles" Moreno',
        photoUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=400&h=400&auto=format&fit=crop',
        badge: 'pro',
        rating: 4.85,
        reviewCount: 56,
        studentCount: 120,
        experienceYears: 6,
        specialties: [CoachSpecialty.BALL_HANDLING, CoachSpecialty.INDIVIDUAL],
        levels: [CoachLevel.INTERMEDIATE, CoachLevel.ADVANCED],
        priceRange: {
            min: 45,
            max: 70,
            currency: '€'
        },
        location: {
            latitude: 43.6047,
            longitude: 1.4442,
            city: 'Toulouse',
            radiusKm: 20
        },
        description: 'Expert en dribble et création de shoot. Mon coaching est axé sur la fluidité et la vitesse d\'exécution.',
        qualifications: [
            'BPJEPS Basket',
            'Spécialisation Streetball & Freestyle'
        ],
        pastClubs: ['Toulouse Basket Club'],
        philosophy: 'Le ballon doit être une extension de votre main. Je casse vos mauvaises habitudes pour libérer votre créativité.',
        isIndoor: false,
        isOutdoor: true,
        atHome: true,
        publicCourt: true
    }
];
