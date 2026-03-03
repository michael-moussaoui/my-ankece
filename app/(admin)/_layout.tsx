import { useAuth } from '@/context/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AdminLayout() {
    const { isAdmin, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (!loading && !isAdmin) {
            // If not admin and trying to access admin screens, redirect to tabs
            router.replace('/(tabs)');
        }
    }, [isAdmin, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!isAdmin) {
        return null; // Will redirect in useEffect
    }

    return (
        <Stack>
            <Stack.Screen 
                name="index" 
                options={{ 
                    title: 'Dashboard Admin',
                    headerShown: true
                }} 
            />
            <Stack.Screen 
                name="users" 
                options={{ 
                    title: 'Gestion Utilisateurs',
                    headerShown: true
                }} 
            />
            <Stack.Screen 
                name="notifications" 
                options={{ 
                    title: 'Gestion Notifications',
                    headerShown: true
                }} 
            />
            <Stack.Screen 
                name="reports" 
                options={{ 
                    title: 'Gestion Signalements',
                    headerShown: true
                }} 
            />
            <Stack.Screen 
                name="coaches" 
                options={{ 
                    title: 'Gestion Coachs',
                    headerShown: true
                }} 
            />
        </Stack>
    );
}
