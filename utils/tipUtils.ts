import { ShotType, UserStats } from '@/types/tracker';

const SHOT_TYPE_LABELS: Record<string, string> = {
    '3pt': '3 Points',
    'ft': 'Lancers Francs',
    'mid': 'Mi-Dist.',
    'catch_shoot': 'Catch & Shoot',
    'pull_up': 'Pull-up',
    'step_back': 'Step Back',
    'fadeaway': 'Fadeaway'
};

const GENERAL_TIPS = [
    "N'oubliez pas d'utiliser vos jambes lors de vos tirs à longue distance.",
    "La répétition est la clé de la mémoire musculaire. Continuez à shooter !",
    "Travaillez votre main faible pour devenir un joueur plus complet.",
    "Regardez toujours l'arceau, pas le ballon, pendant votre tir.",
    "Un bon équilibre au départ garantit une meilleure précision.",
    "Le fouetté du poignet à la fin du geste donne la rotation nécessaire au ballon.",
    "N'oubliez pas de bien vous échauffer avant chaque séance intense."
];

const getDailySeed = () => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export const getDynamicTip = (stats: UserStats | null): string => {
    const seed = getDailySeed();

    if (!stats) {
        const defaultTips = [
            "Bienvenue sur Ankece ! Enregistrez votre première séance pour recevoir des conseils personnalisés.",
            "Prêt pour votre première session ? Ankece vous aidera à suivre votre progression.",
            "Conseil : Pensez à enregistrer vos tirs après chaque entraînement pour voir votre évolution."
        ];
        return defaultTips[seed % defaultTips.length];
    }

    // Potential tips list to choose from based on priority
    const potentialTips: { priority: number; text: string }[] = [];

    // 1. Check Streak (Priority 1)
    if (stats.dailyStreak && stats.dailyStreak >= 3) {
        potentialTips.push({
            priority: 1,
            text: `Incroyable ! Vous êtes sur une série de ${stats.dailyStreak} jours. La régularité est le secret des champions.`
        });
    }

    // 2. Check Weak Point (Priority 2 - Min 10 attempts)
    if (stats.shotTypeStats) {
        let worstType: ShotType | null = null;
        let lowestPercent = 101;

        Object.entries(stats.shotTypeStats).forEach(([type, data]) => {
            if (data.attempts >= 10) {
                const percent = (data.made / data.attempts) * 100;
                if (percent < lowestPercent) {
                    lowestPercent = percent;
                    worstType = type as ShotType;
                }
            }
        });

        if (worstType && lowestPercent < 50) {
            potentialTips.push({
                priority: 2,
                text: `Travaillez un peu plus vos tirs de type "${SHOT_TYPE_LABELS[worstType] || worstType}". C'est actuellement votre point faible avec ${Math.round(lowestPercent)}% de réussite.`
            });
        }
    }

    // 3. Level Progression (Priority 3)
    const levelThresholds = {
        'Rookie': 500,
        'Shooter': 2000,
        'Sniper': 5000,
        'Elite': 10000,
        'Legend': Infinity
    };

    const nextThreshold = levelThresholds[stats.level || 'Rookie'];
    if (nextThreshold !== Infinity) {
        const remaining = nextThreshold - (stats.exp || 0);
        if (remaining > 0 && remaining < 200) {
            potentialTips.push({
                priority: 3,
                text: `Vous êtes tout proche du niveau suivant ! Plus que ${remaining} EXP pour devenir un ${stats.level === 'Rookie' ? 'Shooter' :
                    stats.level === 'Shooter' ? 'Sniper' :
                        stats.level === 'Sniper' ? 'Elite' : 'Legend'
                    }.`
            });
        }
    }

    // 4. Global Accuracy (Priority 4)
    if (stats.totalShotsLifetime && stats.totalShotsLifetime >= 50) {
        const globalAccuracy = (stats.totalMadeLifetime / stats.totalShotsLifetime) * 100;
        if (globalAccuracy > 70) {
            potentialTips.push({
                priority: 4,
                text: `Votre précision globale de ${Math.round(globalAccuracy)}% est excellente. Essayez d'augmenter la distance ou la difficulté !`
            });
        } else if (globalAccuracy < 30) {
            potentialTips.push({
                priority: 4,
                text: "Ne vous découragez pas. Concentrez-vous sur la mécanique de votre tir de près avant de reculer."
            });
        }
    }

    // If we have prioritized tips, pick the best one.
    // To make it change "of the day" even if multiple are available, 
    // we could use the seed to pick among the highest priority ones if there are multiple.
    if (potentialTips.length > 0) {
        // Sort by priority (ascending, 1 is highest)
        potentialTips.sort((a, b) => a.priority - b.priority);

        // Pick from the tips with the highest available priority
        const highestPriority = potentialTips[0].priority;
        const bestTips = potentialTips.filter(t => t.priority === highestPriority);

        return bestTips[seed % bestTips.length].text;
    }

    // 5. Fallback to random general tip (Priority 5)
    // seeded by the date so it only changes once every 24 hours
    return GENERAL_TIPS[seed % GENERAL_TIPS.length];
};
