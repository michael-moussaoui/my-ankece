import { Alert } from 'react-native';

const CLOUD_NAME = 'da2ju2dod';
const UPLOAD_PRESET = 'playground_photos';

export const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    if (!imageUri) return null;

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

        const result = await response.json();
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

            const result = await response.json();
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
