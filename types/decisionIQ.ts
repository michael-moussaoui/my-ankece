// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// types/decisionIQ.ts
// Types TypeScript pour le module Decision IQ Trainer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Position du joueur sur le terrain */
export type PlayerPosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

/** Difficulté de la session */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Type de situation tactique */
export type SituationCategory =
  | 'pick_and_roll'
  | 'transition'
  | 'half_court'
  | 'clutch'
  | 'isolation'
  | 'zone_offense'
  | 'press_break'
  | 'defense_reads';

/** Une option de décision (l'une des 4 proposées) */
export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
}

/** Une situation de jeu complète */
export interface Situation {
  id: string;
  position: PlayerPosition;
  category: SituationCategory;
  difficulty: Difficulty;
  /** Description narrative de la situation */
  description: string;
  /** URL Cloudinary de l'image (vue du dessus ou photo réaliste) */
  imageUrl?: string;
  /** 4 options de décision */
  options: DecisionOption[];
  /** Index (0-3) de la bonne réponse */
  correctIndex: number;
  /** Explication tactique détaillée après révélation */
  explanation: string;
  /** Tags pour la catégorisation et la filtration */
  tags: string[];
}

/** Résultat d'une réponse à une situation */
export interface SituationResult {
  situationId: string;
  category: SituationCategory;
  selectedIndex: number;
  isCorrect: boolean;
  timeUsed: number; // en secondes
  iqGained: number; // points IQ gagnés/perdus
}

/** Résumé d'une session complète */
export interface SessionResult {
  sessionId: string;
  userId: string;
  mode: Difficulty;
  position: PlayerPosition;
  category?: SituationCategory;
  startedAt: Date;
  finishedAt?: Date;
  totalSituations: number;
  correctAnswers: number;
  iqScore: number;        // Score IQ de la session (base 1000)
  iqDelta: number;        // Variation de l'IQ (+ ou -)
  situationResults: SituationResult[];
  streak: number;         // Meilleure série consécutive
  badges: string[];       // Badges gagnés cette session
}

/** Stats globales d'un joueur sur Decision IQ */
export interface PlayerIQStats {
  currentIQ: number;      // IQ global (base 1000, vise 1500+)
  bestIQ: number;
  totalSessions: number;
  totalCorrect: number;
  totalAttempts: number;
  streak: number;         // Streak de sessions parfaites
  lastPlayed: Date | null;
  byCategory: Record<SituationCategory, { correct: number; total: number }>;
}

/** Configuration de l'écran setup */
export interface SessionConfig {
  mode: Difficulty;
  position: PlayerPosition;
  category?: SituationCategory; // "all" si non défini
  situationCount: 10 | 15 | 20;
}

/** Réponse du backend FastAPI */
export interface GenerateSituationResponse {
  success: boolean;
  situation: Situation;
  error?: string;
}

/** État interne du hook useDecisionTrainer */
export interface DecisionTrainerState {
  config: SessionConfig;
  situations: Situation[];
  currentIndex: number;
  currentSituation: Situation | null;
  selectedOption: number | null;
  isRevealed: boolean;
  timeLeft: number;
  sessionResult: SessionResult;
  isLoading: boolean;
  isFinished: boolean;
  streak: number;
}
