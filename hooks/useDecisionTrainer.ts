// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// hooks/useDecisionTrainer.ts
// Hook custom qui orchestre toute la logique du simulateur
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    calculateIQDelta,
    calculateSingleIQ,
    generateSituationQueue,
    getPlayerIQStats,
    getRecentSessions,
    getSessionBadges,
    saveSessionResult,
} from '@/services/decisionIQService';
import {
    Difficulty,
    PlayerIQStats,
    SessionConfig,
    SessionResult,
    Situation,
    SituationCategory,
    SituationResult,
} from '@/types/decisionIQ';

// Durée du timer par difficulté (en secondes)
const TIMER_DURATION: Record<Difficulty, number> = {
    easy: 15,
    medium: 12,
    hard: 8,
};

// ─── État du Hook ────────────────────────────────────────────────────────────

interface UseDecisionTrainerReturn {
    // État de la session
    isLoading: boolean;
    isSessionActive: boolean;
    isFinished: boolean;

    // Situation courante
    currentSituation: Situation | null;
    currentIndex: number;
    totalSituations: number;

    // Timer
    timeLeft: number;
    timerProgress: number; // 0-1 pour la barre de progression

    // Réponse
    selectedOption: number | null;
    isRevealed: boolean;
    lastResult: SituationResult | null;

    // Scores
    score: { correct: number; total: number; streak: number };
    currentIQ: number;
    playerStats: PlayerIQStats | null;

    // Session summary
    sessionResult: SessionResult | null;
    recentSessions: SessionResult[];

    // Actions
    startSession: (config: SessionConfig) => Promise<void>;
    selectOption: (index: number) => void;
    nextSituation: () => void;
    finishSession: () => Promise<void>;
    resetTrainer: () => void;
}

const INITIAL_SCORE = { correct: 0, total: 0, streak: 0 };

// ─── Hook Principal ──────────────────────────────────────────────────────────

export const useDecisionTrainer = (): UseDecisionTrainerReturn => {
    const { user } = useAuth();

    // ── State ──────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const [situations, setSituations] = useState<Situation[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [config, setConfig] = useState<SessionConfig | null>(null);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [lastResult, setLastResult] = useState<SituationResult | null>(null);

    const [timeLeft, setTimeLeft] = useState(15);
    const [timerProgress, setTimerProgress] = useState(1);

    const [score, setScore] = useState(INITIAL_SCORE);
    const [currentIQ, setCurrentIQ] = useState(1000);
    const [sessionResults, setSessionResults] = useState<SituationResult[]>([]);
    const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
    const [playerStats, setPlayerStats] = useState<PlayerIQStats | null>(null);
    const [recentSessions, setRecentSessions] = useState<SessionResult[]>([]);

    // ── Refs pour le timer (évite les stale closures) ────────────────
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const timeLeftRef = useRef(15);
    const maxTimeRef = useRef(15);
    const isRevealedRef = useRef(false);
    const scoreRef = useRef(INITIAL_SCORE);

    // ── Chargement initial des stats ──────────────────────────────
    useEffect(() => {
        if (user?.uid) {
            loadPlayerStats();
        }
    }, [user?.uid]);

    const loadPlayerStats = async () => {
        if (!user?.uid) return;
        try {
            const [stats, sessions] = await Promise.all([
                getPlayerIQStats(user.uid),
                getRecentSessions(user.uid),
            ]);
            setPlayerStats(stats);
            setCurrentIQ(stats.currentIQ);
            setRecentSessions(sessions);
        } catch (err) {
            console.error('Error loading player stats:', err);
        }
    };

    // ── Timer Logic ──────────────────────────────────────────────
    const startTimer = useCallback((duration: number) => {
        // Cleanup du timer précédent
        if (timerRef.current) clearInterval(timerRef.current);

        timeLeftRef.current = duration;
        maxTimeRef.current = duration;
        setTimeLeft(duration);
        setTimerProgress(1);

        timerRef.current = setInterval(() => {
            timeLeftRef.current -= 1;

            setTimeLeft(timeLeftRef.current);
            setTimerProgress(timeLeftRef.current / maxTimeRef.current);

            // Timer expiré : révèle automatiquement (mauvaise réponse)
            if (timeLeftRef.current <= 0) {
                clearInterval(timerRef.current!);
                if (!isRevealedRef.current) {
                    handleTimeUp();
                }
            }
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    /** Appelé quand le temps est écoulé (pas de réponse) */
    const handleTimeUp = useCallback(() => {
        if (isRevealedRef.current) return;
        isRevealedRef.current = true;
        setIsRevealed(true);
        setSelectedOption(-1); // -1 = timeout, aucune sélection

        // Pas de points + penalty streak
        const result: SituationResult = {
            situationId: situations[currentIndex]?.id || '',
            category: situations[currentIndex]?.category || 'half_court',
            selectedIndex: -1,
            isCorrect: false,
            timeUsed: maxTimeRef.current,
            iqGained: -3,
        };

        setLastResult(result);
        setSessionResults(prev => [...prev, result]);
        setScore(prev => {
            const updated = { ...prev, total: prev.total + 1, streak: 0 };
            scoreRef.current = updated;
            return updated;
        });
        setCurrentIQ(prev => Math.max(600, prev - 3));
    }, [situations, currentIndex]);

    // ── Session Actions ───────────────────────────────────────────

    /**
     * Démarre une nouvelle session
     */
    const startSession = async (sessionConfig: SessionConfig) => {
        setIsLoading(true);
        setConfig(sessionConfig);

        try {
            // Génère la queue de situations
            const queue = await generateSituationQueue(sessionConfig);
            setSituations(queue);
            setCurrentIndex(0);
            setScore(INITIAL_SCORE);
            scoreRef.current = INITIAL_SCORE;
            setSessionResults([]);
            setSessionResult(null);
            setSelectedOption(null);
            setIsRevealed(false);
            isRevealedRef.current = false;
            setLastResult(null);
            setIsSessionActive(true);
            setIsFinished(false);

            // Démarre le timer pour la première situation
            const duration = TIMER_DURATION[sessionConfig.mode];
            startTimer(duration);

        } catch (err) {
            console.error('Error starting session:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Sélectionne une option de réponse
     */
    const selectOption = useCallback((index: number) => {
        if (isRevealedRef.current || !situations[currentIndex]) return;

        stopTimer();
        isRevealedRef.current = true;
        setIsRevealed(true);
        setSelectedOption(index);

        const situation = situations[currentIndex];
        const isCorrect = index === situation.correctIndex;
        const timeUsed = maxTimeRef.current - timeLeftRef.current;
        
        // Calcule IQ gagné/perdu pour cette situation
        const iqGained = calculateSingleIQ(
            isCorrect,
            timeUsed,
            maxTimeRef.current,
            config?.mode || 'medium'
        );

        const result: SituationResult = {
            situationId: situation.id,
            category: situation.category,
            selectedIndex: index,
            isCorrect,
            timeUsed,
            iqGained,
        };

        setLastResult(result);
        setSessionResults(prev => [...prev, result]);

        // Mise à jour du score en temps réel
        setScore(prev => {
            const updated = {
                correct: prev.correct + (isCorrect ? 1 : 0),
                total: prev.total + 1,
                streak: isCorrect ? prev.streak + 1 : 0,
            };
            scoreRef.current = updated;
            return updated;
        });

        // Mise à jour IQ en temps réel (feedback visuel)
        setCurrentIQ(prev => Math.max(600, Math.min(2000, prev + iqGained)));

    }, [situations, currentIndex, config, stopTimer]);

    /**
     * Passe à la situation suivante
     */
    const nextSituation = useCallback(() => {
        if (!config) return;

        const nextIndex = currentIndex + 1;

        if (nextIndex >= situations.length) {
            // Session terminée
            finishSession();
            return;
        }

        // Reset pour la prochaine situation
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        setIsRevealed(false);
        isRevealedRef.current = false;
        setLastResult(null);

        // Relance le timer
        const duration = TIMER_DURATION[config.mode];
        startTimer(duration);

    }, [currentIndex, situations.length, config, startTimer]);

    /**
     * Termine la session et sauvegarde dans Firestore
     */
    const finishSession = useCallback(async () => {
        stopTimer();
        setIsSessionActive(false);
        setIsFinished(true);

        const currentScore = scoreRef.current;
        const iqDelta = calculateIQDelta(
            currentScore.correct / Math.max(1, currentScore.total),
            currentScore.streak,
            config?.mode || 'medium'
        );

        const badges = getSessionBadges({
            correctAnswers: currentScore.correct,
            totalSituations: currentScore.total,
            streak: currentScore.streak,
            mode: config?.mode,
        });

        const result: SessionResult = {
            sessionId: `session_${Date.now()}`,
            userId: user?.uid || '',
            mode: config?.mode || 'medium',
            position: config?.position || 'PG',
            category: config?.category,
            startedAt: new Date(),
            finishedAt: new Date(),
            totalSituations: currentScore.total,
            correctAnswers: currentScore.correct,
            iqScore: currentIQ,
            iqDelta,
            situationResults: sessionResults,
            streak: currentScore.streak,
            badges,
        };

        setSessionResult(result);

        // Sauvegarde async en arrière-plan
        if (user?.uid && playerStats) {
            saveSessionResult(user.uid, result, playerStats)
                .then(() => loadPlayerStats()); // Reload stats après sauvegarde
        }
    }, [config, currentIQ, sessionResults, user, playerStats, stopTimer]);

    /**
     * Réinitialise complètement le trainer
     */
    const resetTrainer = useCallback(() => {
        stopTimer();
        setSituations([]);
        setCurrentIndex(0);
        setScore(INITIAL_SCORE);
        scoreRef.current = INITIAL_SCORE;
        setSessionResults([]);
        setSessionResult(null);
        setSelectedOption(null);
        setIsRevealed(false);
        isRevealedRef.current = false;
        setLastResult(null);
        setIsSessionActive(false);
        setIsFinished(false);
        setConfig(null);
    }, [stopTimer]);

    // ── Cleanup au démontage ──────────────────────────────────────
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // ── Situation courante ────────────────────────────────────────
    const currentSituation = situations[currentIndex] || null;

    return {
        isLoading,
        isSessionActive,
        isFinished,
        currentSituation,
        currentIndex,
        totalSituations: situations.length,
        timeLeft,
        timerProgress,
        selectedOption,
        isRevealed,
        lastResult,
        score,
        currentIQ,
        playerStats,
        sessionResult,
        recentSessions,
        startSession,
        selectOption,
        nextSituation,
        finishSession,
        resetTrainer,
    };
};
