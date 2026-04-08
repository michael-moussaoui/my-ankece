import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';

const CLOUD_NAME = 'da2ju2dod';
const UPLOAD_PRESET = 'playground_photos';

export const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    if (!imageUri) return null;

    // Check file size
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
            console.log(`📸 Image size: ${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB`);
        }
    } catch (e) {
        console.warn('Could not get image info:', e);
    }

    const data = new FormData();
    data.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'upload.jpg',
    } as any);
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data,
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Cloudinary Image Parse Error:', responseText);
            throw new Error(`Cloudinary Image JSON Error: ${responseText.substring(0, 100)}...`);
        }

        if (result.secure_url) {
            return result.secure_url;
        } else {
            console.error('Cloudinary upload failed:', result);
            Alert.alert('Erreur', 'Échec de l\'upload de l\'image.');
            return null;
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'upload.');
        return null;
    }
};

export const cloudinaryService = {
    uploadImage: uploadImageToCloudinary,

    uploadVideo: async (videoUri: string): Promise<string | null> => {
        if (!videoUri) return null;
        if (videoUri.startsWith('http')) return videoUri;

        // Check file size
        try {
            const fileInfo = await FileSystem.getInfoAsync(videoUri);
            if (fileInfo.exists) {
                const sizeMB = fileInfo.size / (1024 * 1024);
                console.log(`🎥 Video size: ${sizeMB.toFixed(2)} MB`);
                
                if (sizeMB > 50) { // Reduced to 50MB for extra safety
                    Alert.alert('Vidéo trop volumineuse', `La vidéo fait ${sizeMB.toFixed(1)} Mo. La limite est de 50 Mo pour garantir l'envoi. Veuillez choisir une vidéo plus courte.`);
                    throw new Error(`Video too large (${sizeMB.toFixed(1)}MB > 50MB)`);
                }
            } else {
                console.warn('File does not exist at URI:', videoUri);
            }
        } catch (e) {
            console.error('Info check failed:', e);
            if (e instanceof Error && e.message.includes('too large')) throw e;
        }

        const data = new FormData();
        data.append('file', {
            uri: videoUri,
            type: 'video/mp4',
            name: 'upload.mp4',
        } as any);
        data.append('upload_preset', 'playground_videos');
        data.append('cloud_name', CLOUD_NAME);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
                method: 'POST',
                body: data,
            });

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Cloudinary Video Parse Error:', responseText);
                throw new Error(`Cloudinary Video JSON Error: ${responseText.substring(0, 100)}...`);
            }

            if (result.secure_url) {
                return result.secure_url;
            } else {
                console.error('Cloudinary video upload failed:', result);
                throw new Error(result.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            throw error;
        }
    }
};
