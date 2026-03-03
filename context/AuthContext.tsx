import { auth, db } from '@/config/firebase';
import { notificationService } from '@/services/notificationService';
import { DB_COLLECTIONS, UserProfile } from '@/types/user';
import { notificationUtils } from '@/utils/notificationUtils';
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Real-time listener for user profile
        unsubscribeProfile = onSnapshot(
          doc(db, DB_COLLECTIONS.USERS, firebaseUser.uid),
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              
              // Sync missing createdAt from Auth metadata if necessary
              if (!data.createdAt && firebaseUser.metadata.creationTime) {
                try {
                  await updateDoc(doc(db, DB_COLLECTIONS.USERS, firebaseUser.uid), {
                    createdAt: new Date(firebaseUser.metadata.creationTime).toISOString()
                  });
                } catch (e) {
                  console.warn("Could not sync createdAt to Firestore:", e);
                }
              }

              // Update lastSeen
              const now = new Date();
              const lastSeenDate = data.lastSeen ? new Date(data.lastSeen) : null;
              
              // If last seen was more than 7 days ago, we could trigger something here
              if (lastSeenDate) {
                const diffTime = Math.abs(now.getTime() - lastSeenDate.getTime());
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                
                if (diffDays > 7 && data.notificationsEnabled) {
                  notificationService.sendToUser(
                    firebaseUser.uid,
                    'system',
                    'Bon retour !',
                    'On est ravi de vous revoir ! Reprenez vos entraînements pour rester au top.',
                    'success'
                  );
                }
              }

              // Update the field in Firestore
              try {
                await updateDoc(doc(db, DB_COLLECTIONS.USERS, firebaseUser.uid), {
                  lastSeen: now.toISOString()
                });
              } catch (e) {
                console.warn("Could not update lastSeen:", e);
              }

              setProfile({ ...data, id: firebaseUser.uid, lastSeen: now.toISOString() });
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Handle re-engagement notifications based on AppState
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        notificationUtils.scheduleReengagementReminder(profile);
      } else if (nextAppState === 'active') {
        notificationUtils.cancelReengagementReminders();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      appStateSubscription.remove();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;

    // Create a profile in Firestore
    const userProfile: UserProfile = {
      id: newUser.uid,
      email: newUser.email || '',
      displayName: newUser.email?.split('@')[0] || 'User',
      plan: 'essential',
      role: 'user',
      editsThisMonth: 0,
      lastEditDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isAdFree: false,
    };

    await setDoc(doc(db, DB_COLLECTIONS.USERS, newUser.uid), userProfile);
    setProfile(userProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin,
      login, 
      register, 
      logout, 
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
