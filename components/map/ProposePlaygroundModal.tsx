import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { suggestionService } from '@/services/suggestionService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ProposePlaygroundModalProps {
    visible: boolean;
    onClose: () => void;
    currentCoords: {
        latitude: number;
        longitude: number;
    };
}

export const ProposePlaygroundModal = ({ visible, onClose, currentCoords }: ProposePlaygroundModalProps) => {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor, accentTextColor } = useAppTheme();
    const tintColor = accentColor;
    
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('common.error'), t('cv.form.camera_permission_denied'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert(t('common.error'), t('cv.form.please_enter_name'));
            return;
        }

        if (!photo) {
            Alert.alert(t('common.error'), t('cv.form.please_take_photo'));
            return;
        }

        if (!profile) return;

        setLoading(true);
        try {
            await suggestionService.submitSuggestion(
                name.trim(),
                photo,
                currentCoords.latitude,
                currentCoords.longitude,
                profile.id
            );

            Alert.alert(
                t('cv.form.export_success_title'), 
                "Votre suggestion a été envoyée ! Elle sera visible sur la carte après validation par l'administrateur."
            );
            handleClose();
        } catch (error) {
            Alert.alert(t('common.error'), "Une erreur est survenue lors de l'envoi.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setPhoto(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <ThemedView style={styles.modalContainer}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle">Suggérer un terrain</ThemedText>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.instruction}>
                        Aidez la communauté en ajoutant un terrain manquant.
                        Les coordonnées GPS seront celles de votre position actuelle.
                    </ThemedText>

                    <View style={styles.inputContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>Nom du terrain / Lieu</ThemedText>
                        <TextInput
                            style={[styles.input, { 
                                color: Colors[colorScheme].text, 
                                borderColor: Colors[colorScheme].border,
                                backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7'
                            }]}
                            placeholder="Ex: City Stade Parc Monceau"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.photoSection}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>Photo du terrain (Obligatoire)</ThemedText>
                        {photo ? (
                            <View style={styles.photoContainer}>
                                <Image source={{ uri: photo }} style={styles.previewImage} />
                                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.photoPlaceholder, { borderColor: tintColor }]} onPress={handleTakePhoto}>
                                <Ionicons name="camera" size={32} color={tintColor} />
                                <ThemedText style={{ color: tintColor, marginTop: 8 }}>Prendre une photo</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.submitButton, { backgroundColor: tintColor }, (loading || !name || !photo) && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={loading || !name || !photo}
                        >
                            {loading ? (
                                <ActivityIndicator color={accentTextColor} />
                            ) : (
                                <ThemedText style={[styles.submitButtonText, { color: accentTextColor }]}>Envoyer la suggestion</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    instruction: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    photoSection: {
        marginBottom: 30,
    },
    photoPlaceholder: {
        height: 150,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(150,150,150,0.05)',
    },
    photoContainer: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removePhoto: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    footer: {
        marginBottom: 20,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
