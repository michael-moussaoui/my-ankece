import { useAppTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ visible, onClose }) => {
    const { subscribe, isSubscribing } = useUser();
    const { accentColor, accentTextColor } = useAppTheme();

    const handleSubscribe = async () => {
        // Use a test price ID
        await subscribe('price_elite_pro_test');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <ThemedView style={styles.content}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="star" size={40} color="#FFD700" />
                        </View>
                        <ThemedText type="subtitle" style={styles.title}>Passez à l'Elite Pro</ThemedText>
                        <ThemedText style={styles.subtitle}>Débloquez le plein potentiel d'Ankece</ThemedText>
                    </View>

                    <View style={styles.benefits}>
                        <BenefitItem accentColor={accentColor} icon="color-palette" title="Templates Premium" description="Accédez à des designs de CV exclusifs et professionnels." />
                        <BenefitItem accentColor={accentColor} icon="analytics" title="Analyse IA Illimitée" description="Analysez tous vos tirs avec précision grâce à notre IA." />
                        <BenefitItem accentColor={accentColor} icon="megaphone-outline" title="Zéro Publicité" description="Profitez d'une expérience fluide sans aucune interruption." />
                    </View>

                    <View style={styles.footer}>
                        <ThemedText style={styles.price}>4,90€ / mois</ThemedText>
                        <TouchableOpacity 
                            style={[styles.subscribeButton, { backgroundColor: accentColor }]} 
                            onPress={handleSubscribe}
                            disabled={isSubscribing}
                        >
                            {isSubscribing ? (
                                <ActivityIndicator color={accentTextColor} />
                            ) : (
                                <>
                                    <ThemedText style={[styles.subscribeText, { color: accentTextColor }]}>S'abonner maintenant</ThemedText>
                                    <Ionicons name="arrow-forward" size={20} color={accentTextColor} />
                                </>
                            )}
                        </TouchableOpacity>
                        <ThemedText style={styles.disclaimer}>Sans engagement, annulez à tout moment.</ThemedText>
                    </View>
                </ThemedView>
            </View>
        </Modal>
    );
};

const BenefitItem = ({ accentColor, icon, title, description }: { accentColor: string, icon: any, title: string, description: string }) => (
    <View style={styles.benefitItem}>
        <View style={[styles.benefitIcon, { backgroundColor: accentColor + '1a' }]}>
            <Ionicons name={icon} size={24} color={accentColor} />
        </View>
        <View style={styles.benefitText}>
            <ThemedText type="defaultSemiBold">{title}</ThemedText>
            <ThemedText style={styles.benefitDescription}>{description}</ThemedText>
        </View>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 4,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
        textAlign: 'center',
    },
    benefits: {
        marginBottom: 30,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    benefitIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    benefitText: {
        flex: 1,
    },
    benefitDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    subscribeButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    subscribeText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    disclaimer: {
        fontSize: 12,
        color: '#999',
    },
});
