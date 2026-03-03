import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cloudinaryService } from '@/services/cloudinaryService';
import { DB_COLLECTIONS } from '@/types/user';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

/**
 * Screen pour ajouter un nouveau post vidéo
 */
export default function AddPostScreen() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { accentColor, accentTextColor } = useAppTheme();
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    
    const player = useVideoPlayer(videoUri, (player) => {
        player.loop = true;
    });

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
            videoMaxDuration: 10, // Max 10 secondes
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            if (asset.duration && asset.duration > 10500) { // Un peu de marge
                Alert.alert('Vidéo trop longue', 'La durée maximale est de 10 secondes.');
                return;
            }
            setVideoUri(asset.uri);
        }
    };

    const handleUpload = async () => {
        if (!videoUri || !user) return;
        
        setUploading(true);
        try {
            // 1. Upload vers Cloudinary
            const videoUrl = await cloudinaryService.uploadVideo(videoUri);
            
            // 2. Créer le post dans Firestore
            await addDoc(collection(db, DB_COLLECTIONS.POSTS), {
                userId: user.uid,
                userName: profile?.displayName || 'Utilisateur Ankece',
                videoUri: videoUrl,
                description: description.trim(),
                likes: [],
                createdAt: Date.now(),
                city: profile?.city || '',
            });

            Alert.alert('Succès', 'Votre vidéo a été publiée !');
            setVideoUri(null);
            setDescription('');
            router.push('/feed');
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Erreur', 'Impossible de publier la vidéo : ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Stack.Screen options={{ headerShown: false }} />
                    
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <IconSymbol name="chevron.left" size={28} color={Colors[colorScheme].text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.header}>
                        <ThemedText type="title">Nouveau Post</ThemedText>
                        <ThemedText style={styles.subtitle}>Partagez votre talent</ThemedText>
                    </View>

                    {videoUri ? (
                        <View style={styles.previewContainer}>
                            <VideoView
                                style={styles.video}
                                player={player}
                                nativeControls={false}
                                contentFit="cover"
                            />
                            <TouchableOpacity 
                                style={styles.removeButton} 
                                onPress={() => setVideoUri(null)}
                            >
                                <IconSymbol name="questionmark.circle.fill" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.pickerButton} onPress={pickVideo}>
                            <IconSymbol name="play.circle.fill" size={60} color={accentColor} />
                            <ThemedText style={styles.pickerText}>Sélectionner une vidéo (max 10s)</ThemedText>
                        </TouchableOpacity>
                    )}

                    <View style={styles.form}>
                        <ThemedText style={styles.label}>Description</ThemedText>
                        <TextInput
                            style={[
                                styles.input, 
                                { 
                                    color: colorScheme === 'dark' ? '#fff' : '#000',
                                    borderColor: colorScheme === 'dark' ? '#444' : '#ddd'
                                }
                            ]}
                            placeholder="Écrivez une légende..."
                            placeholderTextColor="#888"
                            multiline
                            maxLength={150}
                            value={description}
                            onChangeText={setDescription}
                        />
                        <Text style={styles.charCount}>{description.length}/150</Text>
                    </View>

                        <TouchableOpacity 
                            style={[
                                styles.uploadButton, 
                                (!videoUri || uploading) && styles.disabledButton,
                                { backgroundColor: accentColor }
                            ]} 
                            onPress={handleUpload}
                            disabled={!videoUri || uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color={accentTextColor} />
                            ) : (
                                <ThemedText style={[styles.uploadButtonText, { color: accentTextColor }]}>Publier la vidéo</ThemedText>
                            )}
                        </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    headerRow: {
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    subtitle: {
        opacity: 0.6,
        marginTop: 4,
    },
    pickerButton: {
        width: '100%',
        aspectRatio: 9 / 12,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    pickerText: {
        marginTop: 15,
        fontWeight: '600',
        opacity: 0.7,
    },
    previewContainer: {
        width: '100%',
        aspectRatio: 9 / 12,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    video: {
        flex: 1,
    },
    removeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 4,
    },
    form: {
        marginTop: 25,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        height: 100,
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    charCount: {
        textAlign: 'right',
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    uploadButton: {
        marginTop: 30,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
