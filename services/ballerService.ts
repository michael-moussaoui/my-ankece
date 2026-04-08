import { db } from '@/config/firebase';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { BallerAd, BallerProfile, Crew, AdType } from '@/types/baller';

const BALLER_PROFILES = 'ballerProfiles';
const BALLER_ADS = 'ballerAds';
const CREWS = 'crews';

export const ballerService = {
    // ─── PROFIL JOUEUR ───────────────────────────────────────────────────────────
    async getProfile(uid: string): Promise<BallerProfile | null> {
        const docRef = doc(db, BALLER_PROFILES, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { uid: docSnap.id, ...docSnap.data() } as BallerProfile;
        return null;
    },

    async updateProfile(uid: string, data: Partial<BallerProfile>): Promise<void> {
        const docRef = doc(db, BALLER_PROFILES, uid);
        await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
    },

    async searchPlayers(filters: { city?: string; position?: string; minLevel?: number }): Promise<BallerProfile[]> {
        let q = query(collection(db, BALLER_PROFILES));
        if (filters.city) q = query(q, where('city', '==', filters.city));
        if (filters.position) q = query(q, where('position', '==', filters.position));
        if (filters.minLevel) q = query(q, where('skillLevel', '>=', filters.minLevel));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ uid: d.id, ...d.data() } as BallerProfile));
    },

    /**
     * Recherche de partenaires par IA.
     * Algorithme à 2 niveaux :
     * 1. Strict (Même ville, niveau +/- 1)
     * 2. Large si (1) échoue (Niveau +/- 2, toute ville)
     */
    async getQuickMatches(userProfile: BallerProfile): Promise<BallerProfile[]> {
        const colRef = collection(db, BALLER_PROFILES);
        
        // --- NIVEAU 1 : RECHERCHE STRICTE ---
        // On récupère les joueurs de la ville pour éviter l'index composite (city + skillLevel range)
        // Le filtrage par niveau se fait en mémoire pour plus de flexibilité sans config Firebase
        const q1 = query(colRef, where('city', '==', userProfile.city), limit(50));
        const snap1 = await getDocs(q1);
        
        let results = snap1.docs
            .map(d => ({ uid: d.id, ...d.data() } as BallerProfile))
            .filter(p => 
                p.uid !== userProfile.uid && 
                p.skillLevel >= userProfile.skillLevel - 1 && 
                p.skillLevel <= userProfile.skillLevel + 1
            )
            .slice(0, 10);

        if (results.length > 0) return results;

        // --- NIVEAU 2 : RECHERCHE LARGE ---
        // Si aucun match en ville, on cherche globalement par niveau
        // Cette requête (range sur un seul champ) ne nécessite pas d'index composite
        const q2 = query(
            colRef,
            where('skillLevel', '>=', userProfile.skillLevel - 2),
            where('skillLevel', '<=', userProfile.skillLevel + 2),
            limit(50)
        );
        
        const snap2 = await getDocs(q2);
        return snap2.docs
            .map(d => ({ uid: d.id, ...d.data() } as BallerProfile))
            .filter(p => p.uid !== userProfile.uid)
            .slice(0, 10);
    },

    // ─── ANNONCES ────────────────────────────────────────────────────────────────
    async getAds(filter?: { type?: AdType; city?: string }): Promise<BallerAd[]> {
        let q = query(collection(db, BALLER_ADS), orderBy('createdAt', 'desc'), limit(50));
        if (filter?.type) q = query(q, where('type', '==', filter.type));
        if (filter?.city) q = query(q, where('location.name', '==', filter.city));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as BallerAd));
    },

    async createAd(
        authorId: string,
        authorName: string,
        adData: Omit<BallerAd, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'responsesCount'>
    ): Promise<string> {
        const docRef = await addDoc(collection(db, BALLER_ADS), {
            ...adData,
            authorId,
            authorName,
            createdAt: Date.now(),
            responsesCount: 0,
            interestedIds: [],
            interestedCount: 0,
        });
        return docRef.id;
    },

    /** Supprimer une annonce (auteur seulement — vérifié côté client) */
    async deleteAd(adId: string): Promise<void> {
        await deleteDoc(doc(db, BALLER_ADS, adId));
    },

    /**
     * Toggle l'intérêt pour une annonce.
     * Retourne `true` si c'est la première expression d'intérêt (pour déclencher la notif).
     */
    async toggleInterest(uid: string, adId: string): Promise<{ isFirst: boolean; isNowInterested: boolean }> {
        const adRef = doc(db, BALLER_ADS, adId);
        const snap = await getDoc(adRef);
        if (!snap.exists()) throw new Error('Ad not found');

        const data = snap.data();
        const currentIds: string[] = data.interestedIds ?? [];
        const alreadyInterested = currentIds.includes(uid);

        if (alreadyInterested) {
            // Retrait de l'intérêt
            await updateDoc(adRef, {
                interestedIds: arrayRemove(uid),
                interestedCount: Math.max(0, (data.interestedCount ?? currentIds.length) - 1),
            });
            return { isFirst: false, isNowInterested: false };
        } else {
            // Premier intérêt = on vérifie que c'est bien la 1ère fois
            const isFirst = !currentIds.includes(uid); // always true here, confirms first time
            await updateDoc(adRef, {
                interestedIds: arrayUnion(uid),
                interestedCount: (data.interestedCount ?? currentIds.length) + 1,
            });
            return { isFirst, isNowInterested: true };
        }
    },

    // ─── CREWS ───────────────────────────────────────────────────────────────────
    async getCrews(): Promise<Crew[]> {
        const q = query(collection(db, CREWS), orderBy('xp', 'desc'), limit(20));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Crew));
    },

    async getCrew(crewId: string): Promise<Crew | null> {
        const snap = await getDoc(doc(db, CREWS, crewId));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Crew;
        return null;
    },

    /** Rejoindre directement un crew public */
    async joinCrew(uid: string, crewId: string): Promise<void> {
        await updateDoc(doc(db, CREWS, crewId), { memberIds: arrayUnion(uid) });
    },

    /** Faire une demande pour rejoindre un crew privé */
    async requestToJoin(uid: string, crewId: string): Promise<void> {
        await updateDoc(doc(db, CREWS, crewId), { pendingRequests: arrayUnion(uid) });
    },

    /** Accepter une demande d'adhésion (admin seulement) */
    async acceptMember(crewId: string, uid: string): Promise<void> {
        await updateDoc(doc(db, CREWS, crewId), {
            memberIds: arrayUnion(uid),
            pendingRequests: arrayRemove(uid),
        });
    },

    /** Refuser une demande d'adhésion (admin seulement) */
    async refuseMember(crewId: string, uid: string): Promise<void> {
        await updateDoc(doc(db, CREWS, crewId), { pendingRequests: arrayRemove(uid) });
    },

    /** Retirer un membre du crew (admin seulement) */
    async removeMember(crewId: string, uid: string): Promise<void> {
        await updateDoc(doc(db, CREWS, crewId), { memberIds: arrayRemove(uid) });
    },

    /** Mettre à jour les infos du crew (admin seulement) */
    async updateCrew(crewId: string, data: Partial<Pick<Crew, 'name' | 'description' | 'isPrivate' | 'avatar'>>): Promise<void> {
        await updateDoc(doc(db, CREWS, crewId), { ...data, updatedAt: Date.now() });
    },

    /** Supprimer un crew (admin seulement) */
    async deleteCrew(crewId: string): Promise<void> {
        await deleteDoc(doc(db, CREWS, crewId));
    },
};
