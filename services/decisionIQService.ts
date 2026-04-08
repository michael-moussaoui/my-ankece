// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// services/decisionIQService.ts
// Service Firestore + Backend pour Decision IQ Trainer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
    Difficulty,
    GenerateSituationResponse,
    PlayerIQStats,
    PlayerPosition,
    SessionConfig,
    SessionResult,
    Situation,
    SituationCategory,
} from '@/types/decisionIQ';

// ─── Configuration ──────────────────────────────────────────────────────────
// L'URL de ton backend FastAPI (même port que le current ai-service)
const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

// IQ de base pour un nouveau joueur
const BASE_IQ = 1000;

// ─── Situations Statiques (Fallback) ────────────────────────────────────────
// 20 situations prédéfinies de haute qualité – couvrent toutes les catégories
export const STATIC_SITUATIONS: Situation[] = [
    // ── PICK & ROLL ──────────────────────────────────────────────────
    {
        id: 'pnr_1',
        position: 'PG',
        category: 'pick_and_roll',
        difficulty: 'easy',
        description: "Tu arrives avec le ballon côté droit, ton pivot vient te poser un écran. Le défenseur de ton pivot recule bas (DROP) pour anticiper le passage. Ton propre défenseur passe au-dessus de l'écran. Tu as 1.5 secondes.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/pnr_drop_defense',
        options: [
            { id: 'a', label: 'Pull-up jumper mid-range', description: 'Tu t\'arrêtes à mi-distance et tu tires par-dessus le défenseur en retard' },
            { id: 'b', label: 'Drive vers le cercle', description: 'Tu attaques l\'espace créé par le retard du défenseur' },
            { id: 'c', label: 'Passe au pivot (roll)', description: 'Tu passes au pivot qui roule vers le cercle' },
            { id: 'd', label: 'Recul 3 points', description: 'Tu recules pour tirer un 3 points' },
        ],
        correctIndex: 0,
        explanation: "✅ En DROP defense, le défenseur du pivot recule bas pour bloquer le roll. Cela te laisse un espace libre à mi-distance. Le pull-up jumper est la sanction parfaite – c'est exactement ce que fait Chris Paul sur chaque écran. Le drive risque de tomber sur le grand qui est justement en position de help.",
        tags: ['pick_and_roll', 'drop_defense', 'pull_up', 'meneurs'],
    },
    {
        id: 'pnr_2',
        position: 'PG',
        category: 'pick_and_roll',
        difficulty: 'medium',
        description: "P&R côté gauche. Le défenseur de ton pivot switche sur toi (il est 10cm plus grand). Ton pivot se retrouve sur un meneur adverse plus petit que lui. Tu as une seconde.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/pnr_switch',
        options: [
            { id: 'a', label: 'Passe au pivot – Mismatch post-up', description: 'Tu trouves ton pivot qui a un avantage de taille sur le meneur défenseur' },
            { id: 'b', label: 'Snake – tu rejoubes devant', description: 'Tu coupes devant le pivot pour créer un deuxième pick' },
            { id: 'c', label: 'Pull-up sur le grand', description: 'Tu tires par-dessus le grand adverse qui a switché' },
            { id: 'd', label: 'Recul 3 points lointain', description: 'Tu crées l\'espace maximum avec un step-back' },
        ],
        correctIndex: 0,
        explanation: "✅ Le SWITCH crée un mismatch clair : ton pivot contre leur meneur. C'est un avantage majeur à exploiter IMMÉDIATEMENT avec une passe rapide pour qu'il se place en post-up bas. Si tu tires toi-même, tu perds le mismatch. LeBron James recherche systématiquement ce scénario pour créer des lay-ups faciles.",
        tags: ['pick_and_roll', 'switch_defense', 'mismatch', 'post_up'],
    },
    {
        id: 'pnr_3',
        position: 'SG',
        category: 'pick_and_roll',
        difficulty: 'hard',
        description: "T'es coupeur (curl) dans un P&R. Ton coéquipier en haut attend. Ton défenseur surjoue ton côté pour anticiper la passe. Le joueur de l'autre côté est wide open en corner 3pts. Décision en 0.5 sec.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/pnr_curl_weak_side',
        options: [
            { id: 'a', label: 'Curl – tu continues ta coupe', description: 'Tu exécutes le curl prévu vers le panier' },
            { id: 'b', label: 'Backdoor – tu coupes derrière', description: 'Tu plonges au panier sur la faiblesse défensive' },
            { id: 'c', label: 'Weak side kick-out – tu signales le corner open', description: 'Tu demandes le ballon et tu redistributes côté faible' },
            { id: 'd', label: 'Flare screen – tu demandes un écran flare', description: 'Tu demandes un écran pour un tir en fade' },
        ],
        correctIndex: 1,
        explanation: "✅ Quand ton défenseur surjoue l'écran en obstruant le curl, le backdoor est automatique. Tu exploites son agressivité en coupant derrière lui. C'est la règle numéro 1 en motion offense : si le défenseur te coupe le passage prévu, reverse cut. Klay Thompson et Gordon Hayward en font une signature.",
        tags: ['pick_and_roll', 'backdoor', 'curl', 'motion_offense'],
    },

    // ── TRANSITION ───────────────────────────────────────────────────
    {
        id: 'trans_1',
        position: 'PG',
        category: 'transition',
        difficulty: 'easy',
        description: "Tu récupères un rebond défensif. 3 contre 2 en votre faveur. Tu montes avec le ballon, 2 coéquipiers sur les ailes. Les 2 défenseurs sont au niveau du cercle. Tu arrives à 5m en face.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/transition_3v2',
        options: [
            { id: 'a', label: 'Drive direct – attaque le cercle', description: 'Tu forces le contact au cercle pour obtenir une faute' },
            { id: 'b', label: 'Attaque et kick – passe à l\'un des ailiers open', description: 'Tu attires les 2 défenseurs et passes à l\'ailier libre' },
            { id: 'c', label: 'Stop & tir mi-distance', description: 'Tu t\'arrêtes pour un pull-up' },
            { id: 'd', label: 'Ralentis pour remettre en demi-terrain', description: 'Tu stabilises pour une attaque placée' },
        ],
        correctIndex: 1,
        explanation: "✅ En 3v2, la clé est d'ATTIRER les 2 défenseurs vers toi, puis de distribuer à l'ailier wide open. Drive jusqu'à forcer la décision défensive, puis kick-out. Drive seul = une des 2 options défensives te coupe. Ralentir = tu perds l'avantage du nombre. Magic Johnson était le maître absolu de cette lecture.",
        tags: ['transition', '3v2', 'kick_out', 'lecture'],
    },
    {
        id: 'trans_2',
        position: 'SF',
        category: 'transition',
        difficulty: 'medium',
        description: "Transition 2v1. Tu as le ballon, ton ailier est en avance sur ta droite. L'unique défenseur recule et hésite entre vous deux. Tu arrives à 6m du panier, ton ailier est en ligne de fond.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/transition_2v1',
        options: [
            { id: 'a', label: 'Passe à ton ailier pour le lay-up', description: 'Distance et angle parfaits pour le lay-up' },
            { id: 'b', label: 'Drive gauche – contourne le défenseur', description: 'Tu contournes par le côté faible' },
            { id: 'c', label: 'Tir mi-distance sur le défenseur en déséquilibre', description: 'Le défenseur recule et sera en déséquilibre' },
            { id: 'd', label: 'Stop & dribble en attente', description: 'Tu temporises pour que l\'ailier fasse une coupe' },
        ],
        correctIndex: 0,
        explanation: "✅ En 2v1, le défenseur DOIT choisir. Si ton ailier est dans une position de lay-up direct et que le défenseur t'est face, la passe est automatique. Ne complique pas. Le 2v1 est l'avantage numérique le plus simple – tu n'as besoin que d'une seule bonne passe. Over-penser = tu perds l'avantage avant même le contact.",
        tags: ['transition', '2v1', 'lay_up', 'simplicite'],
    },

    // ── HALF COURT ───────────────────────────────────────────────────
    {
        id: 'hc_1',
        position: 'PG',
        category: 'half_court',
        difficulty: 'medium',
        description: "Attaque placée. Tu joues meneur dans une attaque 4-out 1-in. Ton pivot est en post bas côté fort. La défense joue en zone 2-3. Le wing gauche est statique. Le corner droit est vide.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/zone_attack_23',
        options: [
            { id: 'a', label: 'Pénétration au coeur de la zone – drive milieu', description: 'Tu attaques le trou de la zone' },
            { id: 'b', label: 'Passe au pivot en post pour déstabiliser la base', description: 'Tu utilises le pivot pour créer du mouvement en bas' },
            { id: 'c', label: 'Tir de loin par-dessus la zone (top of key)', description: 'Tu tires au-dessus avant qu\'elle ne se réorganise' },
            { id: 'd', label: 'Swing ball côté faible – fais travailler la zone', description: 'Quick ball movement pour trouver un trou' },
        ],
        correctIndex: 0,
        explanation: "✅ Contre la zone 2-3, la règle d'or est d'ATTAQUER LE TRU CENTRAL. La pénétration au coeur force les 2 guards à s'écarter ET les 3 forwards à monter, créant des tirs ouverts sur les côtés. Le swing ball est correct mais lent. Le tir par-dessus est risqué. La clé : pénètre, attire, distribue. C'est la lecture que fait Nikola Jokic à chaque zone.",
        tags: ['half_court', 'zone_2_3', 'penetration', 'lecture_defense'],
    },
    {
        id: 'hc_2',
        position: 'C',
        category: 'half_court',
        difficulty: 'hard',
        description: "Tu es pivot en post bas côté droit. Tu reçois le ballon avec ton défenseur dans ton dos (deep post). Côté faible, l'ailier est wide open en corner 3. Mais tu as 4cm et 15kg de plus que le défenseur.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/post_deep_mismatch',
        options: [
            { id: 'a', label: 'Drop step côté fort vers le lay-up', description: 'Pas en croix vers la gauche pour un lay-up dos au panier' },
            { id: 'b', label: 'Face-up – jab step + drive', description: 'Tu fais face pour lire puis attaques' },
            { id: 'c', label: 'Kick-out au corner 3pts ouvert', description: 'Tu trouves l\'ailier wide open en corner' },
            { id: 'd', label: 'Hook shot côté droit', description: 'Kareem-style, tu hooker avant le double-team' },
        ],
        correctIndex: 0,
        explanation: "✅ Tu as un mismatch physique en ta faveur ET la position de deep post. Le drop step est le move le plus efficace dans cette situation : il exploite ta position DOS AU PANIER et ta supériorité physique pour aller au cercle. Si tu kick-outes, tu abandonnes l'avantage le plus précieux en basketball – une position de scoring dominant. Karl Malone et Shaquille O'Neal ne passaient jamais dans cette situation.",
        tags: ['half_court', 'post_up', 'drop_step', 'mismatch', 'pivot'],
    },

    // ── CLUTCH ───────────────────────────────────────────────────────
    {
        id: 'clutch_1',
        position: 'SG',
        category: 'clutch',
        difficulty: 'hard',
        description: "Score : -1. 6 secondes restantes. Possession pour toi. Adversaire vient de timeout. Leur meilleur défenseur est sur toi. Ton meneur a le ballon à 8m. Tu peux : couper, demander l'écran, ou demander le ballon.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/clutch_last_6s',
        options: [
            { id: 'a', label: 'Demande le ballon et isole 1v1 direct', description: 'Tu prends tes responsabilités en iso' },
            { id: 'b', label: 'Coupe hard + demande le ballon au cercle', description: 'Tu crées un espace avant de recevoir' },
            { id: 'c', label: 'Demande un P&R avec ton pivot', description: 'Écran pour créer une décision défensive' },
            { id: 'd', label: 'Backdoor surprise – leur défense est fatiguée', description: 'Coupe inattendue pendant qu\'ils organisent la défense' },
        ],
        correctIndex: 2,
        explanation: "✅ En clutch avec leur meilleur défenseur sur toi, le P&R force UNE DÉCISION INSTANTANÉE de leur part. S'ils switchent, tu as un mismatch. S'ils passent au-dessus, tu as le pull-up. S'ils hedgent, ton pivot est en roll libre. L'iso 1v1 contre leur meilleur défenseur ET sous la pression du chrono est rarement optimal. Kobe, LeBron et Curry utilisent tous des écrans en clutch pour créer de l'espace.",
        tags: ['clutch', 'pick_and_roll', 'pression', 'decision_making'],
    },
    {
        id: 'clutch_2',
        position: 'PG',
        category: 'clutch',
        difficulty: 'hard',
        description: "Dernier tir de la mi-temps. 4 secondes. Tu as le ballon au milieu à 7m. Ton ailier droit est un tireur d'élite et est légèrement ouvert en corner. Ton pivot vient d'une coupe et arrive au circle. La défense est désorganisée.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/halftime_buzzer',
        options: [
            { id: 'a', label: 'Tir immédiat – tu as l\'angle', description: 'Tir rapide avant que la défense ne se réorganise' },
            { id: 'b', label: 'Passe au pivot en lay-up (il est démarqué)', description: 'Le pivot en coupe est seul au cercle' },
            { id: 'c', label: 'Passe au corner – tireur d\'élite open', description: '3 points pour l\'ailier qui a un bon % en corner' },
            { id: 'd', label: 'Drive – la défense est en retard', description: 'Tu attaques l\'espace créé par la désorganisation' },
        ],
        correctIndex: 1,
        explanation: "✅ Le pivot EN COUPE AU CERCLE avec 4 secondes représente le tir le plus garanti (lay-up = 2 points à 90%+ de réussite). Le corner 3 est tentant mais risqué (temps de passe + temps de tir). Ton propre tir serait acceptable mais moins optimal. En fin de mi-temps, maximise tes chances = prends le tir le plus sûr. Les Warriors font ça systématiquement – ils cherchent le lay-up garanti, pas le spectaculaire.",
        tags: ['clutch', 'buzzer', 'decision_rapide', 'shot_selection'],
    },

    // ── ISOLATION ────────────────────────────────────────────────────
    {
        id: 'iso_1',
        position: 'SF',
        category: 'isolation',
        difficulty: 'medium',
        description: "Isolation pour toi côté droit. Ton défenseur est en bonne position mais légèrement sur ta main forte (gauche). Tu as reçu le ballon à 5m du panier. Il te surveille les yeux dans les yeux.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/iso_right_wing',
        options: [
            { id: 'a', label: 'Jab step droit + drive gauche (main libre)', description: 'Tu utilises le jab pour le déséquilibrer, puis drives côté faible' },
            { id: 'b', label: 'Step-back 3 points – crée de l\'espace', description: 'Recul pour un tir ouvert' },
            { id: 'c', label: 'Drive direct sur ta main forte', description: 'Tu attaques frontalement côté gauche' },
            { id: 'd', label: 'Post-up – tourne le dos et demande l\'espace', description: 'Tu joues en post-up avec ton physique' },
        ],
        correctIndex: 0,
        explanation: "✅ Le défenseur sur ta main gauche signifie qu'il te coupe ton drive préféré mais LAISSE SA DROITE OUVERTE. Le jab step vers la gauche va le faire réagir et se déséquilibrer, puis tu drives droit (sa faiblesse). C'est exactement la lecture que fait Kevin Durant sur 80% de ses isos : il force le défenseur à s'engager d'un côté, puis attaque l'autre.",
        tags: ['isolation', 'jab_step', 'lecture', 'drive'],
    },
    {
        id: 'iso_2',
        position: 'PG',
        category: 'isolation',
        difficulty: 'hard',
        description: "Iso bas côté gauche. -2 points, 20 secondes. Ton adversaire te garde en position basse (il sait que tu drives). Ses coéquipiers ont remonté pour aider. Le coin droit est vide mais ton tireur y est.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/iso_vs_help_defense',
        options: [
            { id: 'a', label: 'Dribble hesitation + step-back 3 (mi-distance)', description: 'Tu crées ton tir avec la hesitation' },
            { id: 'b', label: 'Drive et kick-out au corner 3 open', description: 'Attaque le drive et trouve le corner ouvert' },
            { id: 'c', label: 'Spin move vers le cercle', description: 'Mouvement complexe vers le cercle' },
            { id: 'd', label: 'Remet le ballon et reset l\'attaque', description: 'Tu reset pour recommencer' },
        ],
        correctIndex: 1,
        explanation: "✅ Leur help defense remontée CRÉE un corner ouvert. La stratégie optimale : force le drive pour attirer le help, puis kick-out au corner open. C'est le dribble pénétrant classique : tu n'attaques pas pour scorer, tu attaques pour CRÉER. Si tu tires toi-même avec les aidants, c'est un tir difficile. Le reset gaspille 8-10 secondes précieuses. NBA Reading : c'est exactement ce que fait Trae Young.",
        tags: ['isolation', 'help_defense', 'kick_out', 'creation'],
    },

    // ── DEFENSE READS ────────────────────────────────────────────────
    {
        id: 'def_1',
        position: 'PF',
        category: 'defense_reads',
        difficulty: 'medium',
        description: "Tu défends sur un ailier puissant en post-up. Il vient de recevoir et tourne le dos. Son équipe a un meneur explosive sur le côté faible. Ton aide vient d'être tirée par une coupe. Tu es seul.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/post_defense_alone',
        options: [
            { id: 'a', label: 'Frontal – tu le devances par-devant', description: 'Tu te places devant pour bloquer la réception' },
            { id: 'b', label: 'Three-quarter côté fort', description: 'Positionnement 3/4 pour forcer côté faible' },
            { id: 'c', label: 'Fais faute stratégiquement avant le tir', description: 'Faute préventive avant qu\'il n\'attaque' },
            { id: 'd', label: 'Joue derrière et attend l\'attaque', description: 'Position basse pour te placer entre lui et le cercle' },
        ],
        correctIndex: 3,
        explanation: "✅ Seul sur un pivot fort avec une aide temporairement absente, la position DERRIÈRE est la plus sage. Elle préserve ta position entre lui et le cercle, et si l'aide revient, tu peux la coordonner. Le three-quarter expose une erreur de feinte vers le côté faible. La faute stratégique est coûteuse si tu es à 3 fautes. Le frontal ne fonctionne qu'avec une aide permanente. Rudy Gobert utilise cette position dans 90% de ses défenses de post-up en isolation.",
        tags: ['defense', 'post_defense', 'positioning', 'pivot'],
    },
    {
        id: 'def_2',
        position: 'PG',
        category: 'defense_reads',
        difficulty: 'hard',
        description: "Tu gardes un meneur très rapide côté ballon. Il vient de bloquer ton pick-up (tu l'as manqué). Il est en avance sur toi de 2 pas. Tu peux sprint et couper l'angle vers le cercle ou appeler de l'aide.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/blown_defense_recovery',
        options: [
            { id: 'a', label: 'Sprint – tu rattapes et coupes l\'angle', description: 'Effort athlétique pour revenir' },
            { id: 'b', label: 'Appelle le help immédiatement', description: 'Tu signales à ton coéquipier de venir aider' },
            { id: 'c', label: 'Hack-a en faute intentionnelle', description: 'Faute avant qu\'il ne score facilement' },
            { id: 'd', label: 'Recule, bloque l\'angle et laisse son élan se perdre', description: 'Positionnement intelligent plutôt que sprint' },
        ],
        correctIndex: 3,
        explanation: "✅ Contre un joueur plus rapide déjà en avance, le sprint direct crée souvent une faute ou still rate la coupe. La MEILLEURE stratégie est de bloquer l'angle (couper le chemin vers le centre) et de le forcer en ligne de fond où il n'est pas en avantage direct au cercle. Appeler le help EST la bonne option secondaire, mais le recul + angle est plus immédiat. Kawhi Leonard et Jrue Holiday utilisent ce recul pour transformer les situations perdues en avantages.",
        tags: ['defense', 'recovery', 'angle', 'athletisme_intelligent'],
    },

    // ── ZONE OFFENSE ─────────────────────────────────────────────────
    {
        id: 'zone_1',
        position: 'SG',
        category: 'zone_offense',
        difficulty: 'medium',
        description: "L'adversaire vient de passer en zone 2-3 au milieu du 4e quart. Tu es ailier gauche. Le ballon est en haut avec ton meneur. Le wing droit est inexploré. La zone est refermée vers le milieu.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/zone_23_fourth_quarter',
        options: [
            { id: 'a', label: 'Reste en place – attends le swing ball', description: 'Tu restes positionné pour recevoir le swing' },
            { id: 'b', label: 'Cut dans le trou de la zone – middle cut', description: 'Tu plonges dans l\'espace entre les défenseurs' },
            { id: 'c', label: 'Flash high – remonte pour recevoir', description: 'Tu remontes pour ouvrir un passing lane' },
            { id: 'd', label: 'Corner cut – tu te retrouves dans le corner 3', description: 'Tu coupes vers le corner pour un 3pts' },
        ],
        correctIndex: 1,
        explanation: "✅ Le middle cut (trou de la zone) est l'arme numéro 1 contre la 2-3. Les deux forwards guardent les côtés, le centre est entre les deux. Un coupeur rapide dans ce trou crée un lay-up ou force la zone à se réorganiser, créant des ouvertures aux wings. La zone 2-3 déteste les cutters décisifs – c'est sa principale vulnérabilité que Syracuse elle-même reconnaît.",
        tags: ['zone_offense', 'zone_2_3', 'middle_cut', 'spacing'],
    },

    // ── PRESS BREAK ──────────────────────────────────────────────────
    {
        id: 'press_1',
        position: 'PG',
        category: 'press_break',
        difficulty: 'medium',
        description: "Remise en jeu sous ton panier. Adversaire en full-court press. Ton meneur relayeur est doublé avant même de prendre le ballon. Un ailier est seul à mi-terrain. Tu as 5 secondes pour la remise.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/full_court_press_break',
        options: [
            { id: 'a', label: 'Force la remise à ton meneur sous pression', description: 'Tu lui fais confiance malgré le double-team' },
            { id: 'b', label: 'Passe long air-ball à l\'ailier seul à mi-terrain', description: 'Passe longue à l\'ailier qui court' },
            { id: 'c', label: 'Timeout immédiat pour réorganiser', description: 'Tu préserves la possession avec un timeout' },
            { id: 'd', label: 'Inbound au pivot qui revient vers toi', description: 'Passe courte sécurisée au pivot libre' },
        ],
        correctIndex: 1,
        explanation: "✅ Un ailier seul à mi-terrain pendant une press = lay-up quasi-garanti si la passe est propre. La press sacrifie le coverage profond POUR cette raison précise : créer un double-team bas mais laisser quelqu'un seul en profondeur. Il faut voir et exploiter ça IMMÉDIATEMENT. Forcer le meneur sous pression = turnover probable. Timeout = tu gaspilles un timeout précieux. Karl Malone et Anfernee Hardaway étaient des maîtres du press break long.",
        tags: ['press_break', 'full_court_press', 'passe_longue', 'lecture'],
    },

    // ── CLUTCH AVANCÉ ────────────────────────────────────────────────
    {
        id: 'clutch_3',
        position: 'PF',
        category: 'clutch',
        difficulty: 'hard',
        description: "4e quart, -3, 12 secondes. Tu reçois le ballon en post mi-distance côté droit (elbow). Tom coéquipier le meilleur 3pts tireur fait un cut vers le corner gauche et est COMPLETEMENT open. Toi aussi tu as un bon % de mi-distance.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/clutch_elbow_vs_corner3',
        options: [
            { id: 'a', label: 'Pivot-shoot immédiat – tu prends la responsabilité', description: 'Mi-distance sur ta main forte' },
            { id: 'b', label: 'Passe au corner pour le catch-and-shoot 3pts', description: 'Tu trouves le tireur wide open' },
            { id: 'c', label: 'Drive vers le cercle pour 2pts sûrs + faute', description: 'Tu forces le contact pour 2 ou 3 points' },
            { id: 'd', label: 'Pump fake puis réévalue', description: 'Tu forces la défense à bouger avant de décider' },
        ],
        correctIndex: 1,
        explanation: "✅ -3 = tu DOIS marquer 3 points. Un coéquipier wide open en corner 3 est mathématiquement LA meilleure option : 3 points potentiels + le tireur est au meilleur endroit du terrain pour les 3. Ton 2pts ne suffit pas arithmétiquement (-1). Le drive peut offrir une faute mais est incertain. Le catch-and-shoot en corner est le tir le plus efficace au basket (42-45% en moyenne). Steph Curry, Klay Thompson et Danny Green sont définis par cette décision.",
        tags: ['clutch', 'math_du_basket', 'corner_3', 'shot_selection_arithmetique'],
    },

    // ── ISOLATION AVANCÉ ─────────────────────────────────────────────
    {
        id: 'iso_3',
        position: 'C',
        category: 'isolation',
        difficulty: 'medium',
        description: "Tu es pivot face au panier (face-up) à 4m. Ton défenseur est à 1m de toi en bonne position. Tes coéquipiers ont ouvert le terrain. Tu peux shooter ou attaquer. Ton adversaire t'a déjà bloqué 2 fois ce match.",
        imageUrl: 'https://res.cloudinary.com/da2ju2dod/image/upload/v1/ankece/situations/center_face_up',
        options: [
            { id: 'a', label: 'Tir direct – tu as l\'angle et la confiance', description: 'Shoot dès la réception' },
            { id: 'b', label: 'Jab step + drive côté faible du défenseur', description: 'Tu lis sa position et attaques son faible' },
            { id: 'c', label: 'Pump fake pour provoquer la faute', description: 'Son historique de blocs = il peut sauter sur le fake' },
            { id: 'd', label: 'Kick-out périphérie si la défense monte', description: 'Tu redistribues si quelqu\'un monte' },
        ],
        correctIndex: 2,
        explanation: "✅ Il t'a bloqué 2 fois = il est susceptible de trop réagir à un fake. Le pump fake EST l'arme intelligente ici. S'il saute, tu as 2 lancers-francs ou un drive libre. S'il ne saute pas, tu en sais plus sur sa discipline défensive. Le tir direct contre quelqu'un qui a déjà fait 2 blocs = risque élevé. DeMarcus Cousins et Joel Embiid adorent le pump fake contre les défenseurs qui ont déjà bloqué.",
        tags: ['isolation', 'pump_fake', 'pivot', 'lecture_historique'],
    },
];

// ─── Fonctions du Service ────────────────────────────────────────────────────

/**
 * Récupère des situations depuis le backend FastAPI (dynamique via IA)
 * Retombe sur les situations statiques si le backend n'est pas disponible
 */
export const fetchSituationFromBackend = async (
    config: SessionConfig,
    retries = 2
): Promise<Situation> => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/generate-situation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                position: config.position,
                difficulty: config.mode,
                category: config.category || 'all',
                user_level: 'intermediate',
            }),
            signal: AbortSignal.timeout(5000), // 5s timeout pour ne pas bloquer l'UX
        });

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);
        const data: GenerateSituationResponse = await response.json();
        
        if (!data.success || !data.situation) throw new Error('Invalid response');
        return data.situation;

    } catch (err) {
        console.warn('⚠️ Backend indisponible, utilisation des situations statiques', err);
        // Fallback intelligent : filtre selon la config
        return getStaticSituation(config);
    }
};

/**
 * Sélectionne une situation statique selon la configuration de session
 */
export const getStaticSituation = (config: SessionConfig, excludeIds: string[] = []): Situation => {
    let filtered = STATIC_SITUATIONS.filter(s => {
        if (config.category && s.category !== config.category) return false;
        if (config.mode === 'easy' && s.difficulty !== 'easy') return false;
        if (config.mode === 'hard' && s.difficulty !== 'hard') return false;
        if (excludeIds.includes(s.id)) return false;
        return true;
    });

    // Si pas assez de situations filtrées, on élargit
    if (filtered.length === 0) {
        filtered = STATIC_SITUATIONS.filter(s => !excludeIds.includes(s.id));
    }
    if (filtered.length === 0) {
        filtered = STATIC_SITUATIONS;
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
};

/**
 * Génère une liste de N situations pour une session complète
 * Évite les répétitions et équilibre les catégories
 */
export const generateSituationQueue = async (config: SessionConfig): Promise<Situation[]> => {
    const situations: Situation[] = [];
    const usedIds: string[] = [];
    const count = config.situationCount;

    for (let i = 0; i < count; i++) {
        // 1 situation sur 3 vient du backend si disponible
        let situation: Situation;
        if (i % 3 === 0) {
            situation = await fetchSituationFromBackend(config);
        } else {
            situation = getStaticSituation(config, usedIds);
        }

        // Évite les doublons stricts
        if (!usedIds.includes(situation.id)) {
            usedIds.push(situation.id);
        }
        situations.push(situation);
    }

    return situations;
};

// ─── Firestore : Stats Joueur ────────────────────────────────────────────────

/**
 * Récupère les stats IQ Firestore du joueur
 */
export const getPlayerIQStats = async (userId: string): Promise<PlayerIQStats> => {
    const defaultStats: PlayerIQStats = {
        currentIQ: BASE_IQ,
        bestIQ: BASE_IQ,
        totalSessions: 0,
        totalCorrect: 0,
        totalAttempts: 0,
        streak: 0,
        lastPlayed: null,
        byCategory: {} as PlayerIQStats['byCategory'],
    };

    try {
        const ref = doc(db, 'users', userId, 'iq_stats', 'global');
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data();
            return {
                ...defaultStats,
                ...data,
                lastPlayed: data.lastPlayed?.toDate() || null,
            } as PlayerIQStats;
        }
        return defaultStats;
    } catch (err) {
        console.error('Error fetching IQ stats:', err);
        return defaultStats;
    }
};

/**
 * Sauvegarde le résultat d'une session complète dans Firestore
 */
export const saveSessionResult = async (
    userId: string,
    session: SessionResult,
    currentStats: PlayerIQStats
): Promise<void> => {
    try {
        // 1. Sauvegarde la session dans decision_sessions
        await addDoc(collection(db, 'decision_sessions'), {
            ...session,
            userId,
            createdAt: serverTimestamp(),
        });

        // 2. Met à jour les stats globales du joueur
        const correctRate = session.correctAnswers / session.totalSituations;
        const iqDelta = calculateIQDelta(correctRate, session.streak, session.mode);
        const newIQ = Math.max(600, Math.min(2000, currentStats.currentIQ + iqDelta));

        // Update byCategory stats
        const byCategory = { ...currentStats.byCategory };
        session.situationResults.forEach(r => {
            if (!byCategory[r.category]) {
                byCategory[r.category] = { correct: 0, total: 0 };
            }
            byCategory[r.category].total += 1;
            if (r.isCorrect) byCategory[r.category].correct += 1;
        });

        const statsRef = doc(db, 'users', userId, 'iq_stats', 'global');
        await setDoc(statsRef, {
            currentIQ: newIQ,
            bestIQ: Math.max(newIQ, currentStats.bestIQ),
            totalSessions: currentStats.totalSessions + 1,
            totalCorrect: currentStats.totalCorrect + session.correctAnswers,
            totalAttempts: currentStats.totalAttempts + session.totalSituations,
            streak: correctRate === 1 ? currentStats.streak + 1 : 0,
            lastPlayed: serverTimestamp(),
            byCategory,
        }, { merge: true });

    } catch (err) {
        console.error('Error saving session result:', err);
    }
};

/**
 * Récupère les 5 dernières sessions d'un joueur
 */
export const getRecentSessions = async (userId: string, count = 5): Promise<SessionResult[]> => {
    try {
        const q = query(
            collection(db, 'decision_sessions'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(count)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as SessionResult));
    } catch (err) {
        console.error('Error fetching recent sessions:', err);
        return [];
    }
};

// ─── Logique de Score IQ ─────────────────────────────────────────────────────

/**
 * Calcule la variation d'IQ selon la performance
 * Inspiré du système Elo des échecs, adapté au basket
 */
export const calculateIQDelta = (
    correctRate: number,
    streak: number,
    difficulty: Difficulty
): number => {
    const difficultyMultiplier = { easy: 0.7, medium: 1.0, hard: 1.4 };
    const multiplier = difficultyMultiplier[difficulty];
    
    let delta = 0;
    if (correctRate >= 0.9) delta = 25;       // Session parfaite ou quasi
    else if (correctRate >= 0.75) delta = 15;  // Très bonne session
    else if (correctRate >= 0.6) delta = 5;    // Session correcte
    else if (correctRate >= 0.5) delta = -5;   // Session limite
    else if (correctRate >= 0.35) delta = -15; // Mauvaise session
    else delta = -25;                           // Très mauvaise session

    // Bonus streak
    if (streak >= 3) delta += 10;
    else if (streak >= 2) delta += 5;

    return Math.round(delta * multiplier);
};

/**
 * Calcule les points IQ pour une réponse individuelle
 */
export const calculateSingleIQ = (
    isCorrect: boolean,
    timeUsed: number,
    maxTime: number,
    difficulty: Difficulty
): number => {
    if (!isCorrect) return -2;
    
    const speedBonus = Math.max(0, (1 - timeUsed / maxTime) * 3); // max +3 points bonus vitesse
    const diffBonus = { easy: 0, medium: 2, hard: 5 }[difficulty];
    
    return Math.round(5 + diffBonus + speedBonus);
};

/**
 * Retourne le titre IQ selon le score
 */
export const getIQTitle = (iq: number): { title: string; emoji: string; color: string } => {
    if (iq >= 1800) return { title: 'Coach GOAT', emoji: '🏆', color: '#FFD700' };
    if (iq >= 1600) return { title: 'Elite Decision Maker', emoji: '🌟', color: '#FF6B00' };
    if (iq >= 1400) return { title: 'Smart Playmaker', emoji: '🧠', color: '#7C3AED' };
    if (iq >= 1200) return { title: 'Rising IQ', emoji: '📈', color: '#4CC9F0' };
    if (iq >= 1000) return { title: 'Rookie Reader', emoji: '🏀', color: '#80ED99' };
    return { title: 'Decision Apprentice', emoji: '💪', color: '#999' };
};

/**
 * Retourne les badges gagnés pendant une session
 */
export const getSessionBadges = (session: Partial<SessionResult>): string[] => {
    const badges: string[] = [];
    const rate = (session.correctAnswers || 0) / (session.totalSituations || 1);
    
    if (rate === 1) badges.push('perfect_session');
    if (rate >= 0.8) badges.push('clutch_reader');
    if ((session.streak || 0) >= 5) badges.push('hot_streak');
    if (session.mode === 'hard' && rate >= 0.7) badges.push('elite_hard');
    
    return badges;
};
