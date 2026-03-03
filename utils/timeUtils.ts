/**
 * Utilitaires pour la manipulation du temps
 */

/**
 * Formate une durée en millisecondes en format MM:SS
 */
export const formatDuration = (milliseconds: number | null | undefined): string => {
    if (!milliseconds || milliseconds < 0) return '0:00';

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formate une durée en millisecondes en format HH:MM:SS
 */
export const formatDurationLong = (milliseconds: number | null | undefined): string => {
    if (!milliseconds || milliseconds < 0) return '0:00:00';

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Convertit des secondes en millisecondes
 */
export const secondsToMilliseconds = (seconds: number): number => {
    return seconds * 1000;
};

/**
 * Convertit des millisecondes en secondes
 */
export const millisecondsToSeconds = (milliseconds: number): number => {
    return Math.floor(milliseconds / 1000);
};

/**
 * Formate une date de manière sécurisée (supporte les strings, numbers et Timestamps Firestore)
 */
export const safeFormatDate = (dateInfo: any): string => {
    if (!dateInfo) return '-';

    try {
        // Si c'est un Timestamp Firestore avec la méthode toDate()
        if (dateInfo && typeof dateInfo.toDate === 'function') {
            return dateInfo.toDate().toLocaleDateString('fr-FR');
        }

        // Si c'est un objet Timestamp Firestore brut (objet avec seconds)
        if (dateInfo && typeof dateInfo === 'object' && 'seconds' in dateInfo) {
            return new Date(dateInfo.seconds * 1000).toLocaleDateString('fr-FR');
        }

        // Si c'est déjà un objet Date
        if (dateInfo instanceof Date) {
            return dateInfo.toLocaleDateString('fr-FR');
        }

        // Sinon on essaie de construire une Date
        const date = new Date(dateInfo);
        if (isNaN(date.getTime())) {
            // Tentative si c'est un nombre (timestamp en ms)
            if (typeof dateInfo === 'number' || (!isNaN(Number(dateInfo)) && typeof dateInfo === 'string' && dateInfo.length > 0)) {
                const dateFromNum = new Date(Number(dateInfo));
                if (!isNaN(dateFromNum.getTime())) {
                    return dateFromNum.toLocaleDateString('fr-FR');
                }
            }
            return '-';
        }
        return date.toLocaleDateString('fr-FR');
    } catch (e) {
        console.error('Error formatting date:', e);
        return '-';
    }
};