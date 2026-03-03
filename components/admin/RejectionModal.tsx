import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface RejectionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    loading: boolean;
}

const REJECTION_REASON_KEYS = [
    "photo",
    "bio",
    "qualifications",
    "specialties",
    "location",
    "pricing",
    "other"
];

export const RejectionModal = ({ visible, onClose, onConfirm, loading }: RejectionModalProps) => {
  const { t } = useTranslation();
  const { accentColor } = useAppTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = accentColor || Colors[colorScheme].tint;
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [customReason, setCustomReason] = useState<string>('');

    const toggleReason = (key: string) => {
        setSelectedReasons(prev => 
            prev.includes(key) 
                ? prev.filter(r => r !== key)
                : [...prev, key]
        );
    };

    const handleConfirm = () => {
        const reasons = selectedReasons.map(key => t(`coach.admin.reasons.${key}`));
        const otherIndex = selectedReasons.indexOf("other");
        
        if (otherIndex !== -1) {
            // Remove the generic "Other" label and use the custom text if provided
            reasons.splice(otherIndex, 1);
            if (customReason.trim()) {
                reasons.push(customReason.trim());
            } else {
                reasons.push(t('coach.admin.reasons.other'));
            }
        }
        
        if (reasons.length === 0) return;
        
        const finalReason = reasons.join(' ; ');
        onConfirm(finalReason);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ThemedView style={styles.content}>
                        <View style={styles.header}>
                            <ThemedText type="defaultSemiBold" style={styles.title}>{t('coach.admin.reject_title')}</ThemedText>
                            <TouchableOpacity onPress={onClose} disabled={loading}>
                                <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.subtitle}>{t('coach.admin.rejection_subtitle')}</ThemedText>

                        <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                            {REJECTION_REASON_KEYS.map((key, index) => {
                                const isSelected = selectedReasons.includes(key);
                                const reasonLabel = t(`coach.admin.reasons.${key}`);
                                return (
                                    <TouchableOpacity 
                                        key={index}
                                        style={[
                                            styles.reasonItem,
                                            isSelected && { borderColor: tintColor, backgroundColor: tintColor + '10' }
                                        ]}
                                        onPress={() => toggleReason(key)}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            isSelected && { borderColor: tintColor, backgroundColor: tintColor }
                                        ]}>
                                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                        </View>
                                        <ThemedText style={styles.reasonText}>{reasonLabel}</ThemedText>
                                    </TouchableOpacity>
                                );
                            })}

                            {selectedReasons.includes("other") && (
                                <TextInput
                                    style={[
                                        styles.input,
                                        { 
                                            color: colorScheme === 'dark' ? '#FFF' : '#000',
                                            borderColor: colorScheme === 'dark' ? '#333' : '#DDD'
                                        }
                                    ]}
                                    placeholder={t('coach.admin.custom_reason_placeholder')}
                                    placeholderTextColor="#888"
                                    multiline
                                    numberOfLines={4}
                                    value={customReason}
                                    onChangeText={setCustomReason}
                                />
                            )}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={onClose}
                                disabled={loading}
                            >
                                <ThemedText style={styles.cancelButtonText}>{t('common.cancel')}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.button, 
                                    { backgroundColor: '#FF3B30' },
                                    (selectedReasons.length === 0 || (selectedReasons.includes("other") && !customReason.trim() && selectedReasons.length === 1)) && { opacity: 0.5 }
                                ]} 
                                onPress={handleConfirm}
                                disabled={loading || selectedReasons.length === 0 || (selectedReasons.includes("other") && !customReason.trim() && selectedReasons.length === 1)}
                            >
                                <ThemedText style={styles.confirmButtonText}>
                                    {loading ? t('common.sending') : t('common.confirm')}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
    },
    content: {
        borderRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 20,
    },
    reasonsList: {
        maxHeight: 400,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        marginBottom: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#888',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    reasonText: {
        fontSize: 14,
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        height: 100,
        textAlignVertical: 'top',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#888',
    },
    cancelButtonText: {
        color: '#888',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
