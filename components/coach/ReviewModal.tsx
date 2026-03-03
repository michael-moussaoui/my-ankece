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

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    coachName: string;
}

export const ReviewModal = ({ visible, onClose, onSubmit, coachName }: ReviewModalProps) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const tintColor = Colors[colorScheme].tint;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert(t('common.error'), t('coach.review.error_no_rating'));
            return;
        }
        if (!comment.trim()) {
            Alert.alert(t('common.error'), t('coach.review.error_no_comment'));
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(rating, comment);
            setRating(0);
            setComment('');
            onClose();
            Alert.alert(t('common.success'), t('coach.review.success_msg'));
        } catch (error) {
            Alert.alert(t('common.error'), t('coach.review.error_msg'));
        } finally {
            setSubmitting(false);
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
                        <ThemedText type="subtitle">{t('coach.review.title', { name: coachName })}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.label}>{t('coach.review.rating_label')}</ThemedText>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={40}
                                    color={star <= rating ? "#FFD700" : "#8E8E93"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ThemedText style={styles.label}>{t('coach.review.comment_label')}</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            { 
                                color: Colors[colorScheme].text,
                                borderColor: colorScheme === 'dark' ? '#333' : '#E5E5EA',
                                backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7'
                            }
                        ]}
                        placeholder={t('coach.review.comment_placeholder')}
                        placeholderTextColor="#8E8E93"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={comment}
                        onChangeText={setComment}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: tintColor }, submitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <ThemedText style={styles.submitButtonText}>{t('coach.review.submit')}</ThemedText>
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
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    input: {
        height: 100,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    submitButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
