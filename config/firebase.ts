import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
    // @ts-ignore
    getReactNativePersistence,
    initializeAuth
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBcnIaE5HsrdfIdtiIAk3iCPJEU_qQM7kE",
    authDomain: "ankece-4abf1.firebaseapp.com",
    projectId: "ankece-4abf1",
    storageBucket: "ankece-4abf1.firebasestorage.app",
    messagingSenderId: "671236770341",
    appId: "1:671236770341:web:c83e15fee527855f314dcc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore with long polling to prevent RPC errors in React Native
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Initialize Functions
const functions = getFunctions(app, 'europe-west1'); // Or your region

export { auth, db, functions };

