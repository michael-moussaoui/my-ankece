import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createPlaygroundEvent, EventType } from '@/services/eventService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface EventCreationModalProps {
    visible: boolean;
    playgroundId: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const EVENT_TYPES: {key: EventType, labelKey: string}[] = [
    { key: 'Match', labelKey: 'events.types.match' },
    { key: '3x3', labelKey: 'events.types.3x3' },
    { key: '1vs1', labelKey: 'events.types.1vs1' },
    { key: 'Coaching', labelKey: 'events.types.coaching' },
    { key: 'Séance Shoot', labelKey: 'events.types.shoot' },
    { key: 'Autre', labelKey: 'events.types.other' },
];

export const EventCreationModal = ({ visible, playgroundId, userId, onClose, onSuccess }: EventCreationModalProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor, accentTextColor } = useAppTheme();
    const tintColor = accentColor;
    const { t } = useTranslation();
    
    const [title, setTitle] = useState('');
    const [type, setType] = useState<EventType>('Match');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setFullYear(selectedDate.getFullYear());
            newDate.setMonth(selectedDate.getMonth());
            newDate.setDate(selectedDate.getDate());
            setDate(newDate);
        }
    };

    const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(date);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setDate(newDate);
        }
    };

    const handleSubmit = async () => {
        if (!title) {
            Alert.alert(t('common.error'), t('events.title_required'));
            return;
        }

        setLoading(true);
        try {
            await createPlaygroundEvent(
                playgroundId,
                userId,
                title,
                type,
                date,
                description
            );

            Alert.alert(t('common.success'), t('events.create_success'));
            onSuccess();
            resetForm();
            onClose();
        } catch (error) {
            Alert.alert(t('common.error'), t('events.create_error'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setType('Match');
        setDescription('');
        setDate(new Date());
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <ThemedView style={styles.content}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle">{t('events.propose_title')}</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form}>
                        <ThemedText style={styles.label}>{t('events.event_title')}</ThemedText>
                        <TextInput
                            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }]}
                            placeholder={t('events.title_placeholder')}
                            placeholderTextColor="#888"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <ThemedText style={styles.label}>{t('events.event_type')}</ThemedText>
                        <View style={styles.typeContainer}>
                            {EVENT_TYPES.map((tItem) => (
                                <TouchableOpacity 
                                    key={tItem.key}
                                    style={[
                                        styles.typeBadge, 
                                        { borderColor: tintColor },
                                        type === tItem.key && { backgroundColor: tintColor }
                                    ]}
                                    onPress={() => setType(tItem.key)}
                                >
                                    <ThemedText style={[styles.typeText, type === tItem.key && { color: '#fff' }]}>{t(tItem.labelKey)}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <ThemedText style={styles.label}>{t('events.date')}</ThemedText>
                                <TouchableOpacity 
                                    style={[styles.pickerTrigger, { borderColor: Colors[colorScheme].border }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={tintColor} />
                                    <ThemedText style={styles.pickerValue}>
                                        {format(date, 'dd/MM/yyyy')}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <ThemedText style={styles.label}>{t('events.time')}</ThemedText>
                                <TouchableOpacity 
                                    style={[styles.pickerTrigger, { borderColor: Colors[colorScheme].border }]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={20} color={tintColor} />
                                    <ThemedText style={styles.pickerValue}>
                                        {format(date, 'HH:mm')}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                minimumDate={new Date()}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={date}
                                mode="time"
                                display="default"
                                is24Hour={true}
                                onChange={onTimeChange}
                            />
                        )}

                        <ThemedText style={styles.label}>{t('events.description_label')}</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }]}
                            placeholder={t('events.description_placeholder')}
                            placeholderTextColor="#888"
                            multiline
                            numberOfLines={3}
                            value={description}
                            onChangeText={setDescription}
                        />

                        <TouchableOpacity 
                            style={[styles.submitButton, { backgroundColor: tintColor }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color={accentTextColor} /> : <ThemedText style={[styles.submitText, { color: accentTextColor }]}>{t('events.publish_button')}</ThemedText>}
                        </TouchableOpacity>
                    </ScrollView>
                </ThemedView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    form: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
    },
    pickerTrigger: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
    },
    pickerValue: {
        fontSize: 16,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
