/**
 * Web-compatible Firebase config — Metro picks this over firebase.ts on web.
 * On web, AsyncStorage persistence doesn't exist; use browserLocalPersistence.
 */
import { initializeApp } from "firebase/app";
import {
    browserLocalPersistence,
    getAuth,
    setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyBcnIaE5HsrdfIdtiIAk3iCPJEU_qQM7kE",
    authDomain: "ankece-4abf1.firebaseapp.com",
    projectId: "ankece-4abf1",
    storageBucket: "ankece-4abf1.firebasestorage.app",
    messagingSenderId: "671236770341",
    appId: "1:671236770341:web:c83e15fee527855f314dcc"
};

const app = initializeApp(firebaseConfig);

// Use browser-native persistence (localStorage) on web
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west1');

export { auth, db, functions };
