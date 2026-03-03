import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ContactModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
    coachName: string;
}

export const ContactModal = ({ visible, onClose, onSend, coachName }: ContactModalProps) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const tintColor = Colors[colorScheme].tint;
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) {
            Alert.alert(t('common.error'), t('coach.contact.error_no_message'));
            return;
        }

        setSending(true);
        try {
            await onSend(message);
            setMessage('');
            onClose();
            Alert.alert(t('common.success'), t('coach.contact.success_msg'));
        } catch (error) {
            Alert.alert(t('common.error'), t('coach.contact.error_msg'));
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.centeredView}
            >
                <View style={[styles.modalView, { backgroundColor: Colors[colorScheme].background }]}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle">{t('coach.contact.title', { name: coachName })}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.label}>{t('coach.contact.label')}</ThemedText>
                    
                    <TextInput
                        style={[
                            styles.input,
                            { 
                                color: Colors[colorScheme].text,
                                borderColor: colorScheme === 'dark' ? '#333' : '#E5E5EA',
                                backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7'
                            }
                        ]}
                        placeholder={t('coach.contact.placeholder')}
                        placeholderTextColor="#8E8E93"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        value={message}
                        onChangeText={setMessage}
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: tintColor }, sending && { opacity: 0.7 }]}
                        onPress={handleSend}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <ThemedText style={styles.sendButtonText}>{t('coach.contact.submit')}</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    label: {
        fontSize: 16,
        marginBottom: 12,
        opacity: 0.8,
    },
    input: {
        height: 150,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    sendButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
