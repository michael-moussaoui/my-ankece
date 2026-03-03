import { UserProfile } from '@/types/user';

// Simulation d'un service de notification locale si expo-notifications n'est pas installé
export const notificationUtils = {
    /**
     * Planifie une notification de rappel pour dans 7 jours.
     * Cette fonction devrait être appelée à chaque fois que l'utilisateur quitte l'application.
     */
    async scheduleReengagementReminder(profile: UserProfile | null) {
        if (!profile?.notificationsEnabled) {
            console.log("Notifications disabled, skipping reminder schedule.");
            return;
        }

        console.log("Scheduling re-engagement reminder for 7 days from now...");

        /* 
        Si expo-notifications est installé :
        
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "On vous attend sur le terrain ! 🏀",
                body: "Cela fait 7 jours que vous n'êtes pas venu vous entraîner. Prêt pour une petite session ?",
                data: { screen: 'tracker' },
            },
            trigger: {
                seconds: 7 * 24 * 60 * 60, // 7 jours en secondes
            },
        });
        */
    },

    /**
     * Annule les rappels existants (quand l'utilisateur revient).
     */
    async cancelReengagementReminders() {
        console.log("Cancelling scheduled reminders...");
        // await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
