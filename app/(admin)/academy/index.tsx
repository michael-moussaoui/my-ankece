import React, { useEffect, useState } from 'react';
import { 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    View, 
    ActivityIndicator,
    Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
    contentService, 
    TrainingProgram 
} from '@/services/contentService';
import { serverTimestamp } from 'firebase/firestore';

export default function AdminAcademyScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { accentColor: tintColor } = useAppTheme();
    const [loading, setLoading] = useState(true);
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);

    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            setLoading(true);
            const data = await contentService.getPublishedPrograms();
            setPrograms(data);
        } catch (error) {
            console.error('Error loading academy programs:', error);
        } finally {
            setLoading(false);
        }
    };

    const bootstrapConfidenceProgram = async () => {
        try {
            setLoading(true);
            
            const newProgram: any = {
                coachId: "ankece_official",
                title: "CONFIDENCE BASKET BOOST",
                description: "Programme 5 mois pour reprendre confiance et devenir un joueur complet. Mental, tir NBA, dribble elite, jeu feminin WNBA et tactique avancee.",
                price: 19.90,
                currency: "EUR",
                weeksCount: 20,
                difficulty: "Tous niveaux",
                thumbnailUrl: "confidence_cover",
                drills: [],
                status: "published",
                modules: [
                    // ═══════════════════════════════════════
                    // PHASE 1 : FONDATIONS & CONFIANCE
                    // ═══════════════════════════════════════
                    {
                        id: "m1",
                        title: "PHASE 1 : FONDATIONS & CONFIANCE",
                        duration: "Mois 1 - 4 semaines",
                        lessons: [
                            {
                                id: "l1_1",
                                title: "Introduction : Ta Renaissance",
                                content: "# Salut Champion(ne) !\n\nSi tu es ici, c'est que ton talent est la, mais ton mental est reste au vestiaire. Ce programme est une **forge**. On va prendre tes doutes et les transformer en certitude.\n\nPourquoi ? Parce que la confiance vient de la preparation.\n\n### Les 3 Niveaux de ce mois :\n1. **Routine Matinale** obligatoire.\n2. **Drills Fondamentaux** sans pression.\n3. **Journal de Progression** Ankece.",
                                imageUrl: "@/assets/images/academy/confidence_cover.png",
                                checklist: [
                                    { id: "c1_1_1", label: "Definir mon objectif 'Mamba Mentality'" },
                                    { id: "c1_1_2", label: "Installer mon espace d'entrainement" }
                                ]
                            },
                            {
                                id: "l1_2",
                                title: "La Routine Mentale (Top 4)",
                                content: "### Le Secret des Pros : Le Mental Top 4\n\nFais ca chaque jour (10 min) :\n\n- **Respiration Box (2 min)** : Inspire 4s, bloque 4s, expire 4s, bloque 4s.\n- **Visualisation (3 min)** : Vois-toi reussir 5 tirs parfaits.\n- **Affirmations (2 min)** : 'Je suis pret', 'Mon tir est pur'.\n- **Journal des Wins (3 min)** : 3 reussites de la journee.",
                                imageUrl: "@/assets/images/academy/mental_routine.png",
                                checklist: [
                                    { id: "c1_2_1", label: "Respiration Box (5 min)" },
                                    { id: "c1_2_2", label: "3 Affirmations positives ecrites" },
                                    { id: "c1_2_3", label: "Journal des Wins complete" }
                                ]
                            },
                            {
                                id: "l1_3",
                                title: "Recuperation, Sommeil & Etirements",
                                content: "# Recuperation : Ton Arme Secrete\n\nLe talent te fait gagner des matchs, la **recuperation** te fait gagner des championnats.\n\n### 1. Le Sommeil (8h-10h)\nC'est pendant ton sommeil que ton cerveau enregistre les nouveaux mouvements et que tes muscles se reparent.\n\n### 2. Routine d'Etirements (15 min)\n- **Ischio-jambiers** : 1 min par jambe.\n- **Flechisseurs de hanche** : Crucial pour l'explosivite.\n- **Bas du dos** : Position de l'enfant.\n\n> **Regle d'Or Ankece** : Un muscle deshydrate est un muscle qui se blesse. Bois 2L par jour !",
                                imageUrl: "@/assets/images/academy/recovery_routine.png",
                                checklist: [
                                    { id: "c1_3_1", label: "8h de sommeil minimum" },
                                    { id: "c1_3_2", label: "Routine d'etirements du soir" },
                                    { id: "c1_3_3", label: "Bouteille de 2L terminee" }
                                ]
                            }
                        ]
                    },
                    // ═══════════════════════════════════════
                    // PHASE 2 : SHOOTING MASTERY (NBA ROUTINES)
                    // ═══════════════════════════════════════
                    {
                        id: "m2",
                        title: "PHASE 2 : SHOOTING MASTERY (NBA ROUTINES)",
                        duration: "Mois 2 - 4 semaines",
                        lessons: [
                            {
                                id: "l2_1",
                                title: "Stephen Curry : Le GOAT du tir",
                                content: "# La Routine de Steph Curry\n\nCurry est celebre pour sa rapidite, son equilibre et ses tirs off the dribble.\n\n### Routine 20-30 min Intense :\n- **Form Shooting** : 35 makes (10 a 1m, 10 a 1.5m, 10 a 2m, 5 LF).\n- **Mid-range** : 25 makes (5 spots).\n- **Three-point** : 25 makes (5 spots).\n- **Floaters** : 25 makes.\n- **Off the dribble** : Pull-ups & Step-backs explosifs.\n\n### Version Debutant (45-60 min) :\nObjectif : 70-80% de reussite avant de reculer.",
                                imageUrl: "@/assets/images/academy/shooting_curry.png",
                                checklist: [
                                    { id: "c2_1_1", label: "Form Shooting (35 makes)" },
                                    { id: "c2_1_2", label: "Mid-range (25 makes)" },
                                    { id: "c2_1_3", label: "Three-point (25 makes)" },
                                    { id: "c2_1_4", label: "Shot off the dribble valide" }
                                ]
                            },
                            {
                                id: "l2_2",
                                title: "Klay Thompson : Catch & Shoot King",
                                content: "# La Mecanique de Klay\n\nKlay utilise une stance large, preparation ultra-rapide et repetition constante.\n\n### Klay Thompson Shooting Drill (90s) :\nCorner -> Cut Elbow -> Fade Wing (3pts) -> Drift Corner -> Fake Pull-up.\n\n### Focus Technique :\n- **Stance large** (epaules).\n- **Release rapide**.\n- **Preparation du corps** avant reception.",
                                imageUrl: "@/assets/images/academy/shooting_klay.png",
                                checklist: [
                                    { id: "c2_2_1", label: "5 Rounds du Drill Klay (90s)" },
                                    { id: "c2_2_2", label: "Stance large maintenue" },
                                    { id: "c2_2_3", label: "Catch & shoot (50 makes)" }
                                ]
                            },
                            {
                                id: "l2_3",
                                title: "LBJ & KD : Polyvalence & Force",
                                content: "# La Routine LBJ & KD\n\n- **LeBron** : Melange force + technique. Dribbles puissants + pull-up.\n- **Kevin Durant** : Tir tres haut (release tete). Equilibre parfait.\n\n### Exercice Commun :\nForm shooting -> Spot shooting -> Shooting off screens -> Contested shots (avec defenseur imaginaire).",
                                imageUrl: "@/assets/images/academy/shooting_pro_stars.png",
                                checklist: [
                                    { id: "c2_3_1", label: "Spot shooting (5 positions)" },
                                    { id: "c2_3_2", label: "Shooting off screens (10 repetitions)" },
                                    { id: "c2_3_3", label: "Contested shots (makes x15)" }
                                ]
                            },
                            {
                                id: "l2_4",
                                title: "Ma Routine Hybride (Pro Workout)",
                                content: "# Ta Routine NBA Hybride\n\n### 1. Echauffement (10-15 min)\nForm shooting 1 main (30 makes).\n\n### 2. Spot Shooting (20-30 min)\n5 spots : 10 makes par spot.\n\n### 3. Movement Shooting (20 min)\nRelocations apres chaque tir. Klay-style drill.\n\n### 4. Finisher (15 min)\nLancers francs (50) & Around the world.\n\n> **Conseil Pro Ankece** : Filme-toi pour corriger ta forme !",
                                imageUrl: "@/assets/images/academy/shooting_hybrid.png",
                                checklist: [
                                    { id: "c2_4_1", label: "Echauffement complet valide" },
                                    { id: "c2_4_2", label: "Serie de spots terminee" },
                                    { id: "c2_4_3", label: "50 LF reussis" }
                                ]
                            }
                        ]
                    },
                    // ═══════════════════════════════════════
                    // PHASE 3 : DRIBBLE MASTERY
                    // ═══════════════════════════════════════
                    {
                        id: "m3",
                        title: "PHASE 3 : DRIBBLE MASTERY (ULTIMATE HANDLES)",
                        duration: "Mois 3 - 4 semaines",
                        lessons: [
                            {
                                id: "l3_1",
                                title: "Kyrie Irving : Le Roi des Handles",
                                content: "# La Creativite de Kyrie\n\n### Routine Signature (15-30 min) :\n- **Plastic Bag Drill** : Mets un sac plastique autour du ballon pour durcir les mains.\n- **2-ball Drill** : Dribble en avancant avec un partenaire qui lance un 2e ballon.\n- **Combo Moves** : Between legs + behind back + crossover + hesitation.\n- **Low & Tight** : Dribble tres bas, V-dribbles.\n\n### Version Debutant (45-60 min) :\nPound dribble (5 min fort au sol) puis 10 reps par move.",
                                imageUrl: "@/assets/images/academy/dribble_kyrie.png",
                                checklist: [
                                    { id: "c3_1_1", label: "Plastic Bag Drill (10 min)" },
                                    { id: "c3_1_2", label: "Combo moves (20 repetitions)" },
                                    { id: "c3_1_3", label: "Low & Tight dribble valide" }
                                ]
                            },
                            {
                                id: "l3_2",
                                title: "Stephen Curry : Coordination & Fluidite",
                                content: "# Coordination de Steph\n\n### Routine Typique (20-40 min) :\n- **Figure 8** : 20 reps.\n- **Around the waist** : 20 reps.\n- **2-ball drills** : Dribble simultane + combos.\n- **Tennis ball drill** : Lance une balle de tennis pendant que tu dribbles.\n\n### Conseil Pro :\nObjectif : fluidite et pas de carries (pas de paume sous le ballon).",
                                imageUrl: "@/assets/images/academy/dribble_curry_2ball.png",
                                checklist: [
                                    { id: "c3_2_1", label: "Figure 8 (20 reps)" },
                                    { id: "c3_2_2", label: "Tennis ball drill (5 min)" },
                                    { id: "c3_2_3", label: "2-ball combo valide" }
                                ]
                            },
                            {
                                id: "l3_3",
                                title: "Chris Paul : Precision & Rythme",
                                content: "# La Precision de CP3\n\n### Drills Signature :\n- **Quicker Handles** : Pound fort au sol puis moves (cross, in-out, hesi).\n- **Full Court Cone Drill** : Crossover entre chaque cone.\n- **Cone Snake** : In-and-out, cross, spin entre les cones.\n\n### Focus :\nPound dribble avant chaque move pour plus de puissance.",
                                imageUrl: "@/assets/images/academy/dribble_cp3_cones.png",
                                checklist: [
                                    { id: "c3_3_1", label: "Quicker handles (5 min)" },
                                    { id: "c3_3_2", label: "Full Court Cone Drill" },
                                    { id: "c3_3_3", label: "Cone Snake valide" }
                                ]
                            },
                            {
                                id: "l3_4",
                                title: "Ma Routine Hybride Handles",
                                content: "# Ta Routine Handles Hybride\n\n### 1. Echauffement (10-15 min)\nPound dribble 1 min chaque main.\n\n### 2. Stationary Ball Control (15-20 min)\nCrossover, between legs, behind back : 20 reps.\n\n### 3. Movement & Combos (20-30 min)\nWalk-Run-Hesi (explosion -> hesitation). Kyrie-style combo.\n\n### 4. Finisher (10 min)\nDribble fatigue (apres pompes ou squats).\n\n> **Conseil Pro Ankece** : Toujours rester bas (hips down) !",
                                imageUrl: "@/assets/images/academy/dribble_hybrid.png",
                                checklist: [
                                    { id: "c3_4_1", label: "Stationary combos valides" },
                                    { id: "c3_4_2", label: "Walk-Run-Hesi maitrise" },
                                    { id: "c3_4_3", label: "Dribble fatigue termine" }
                                ]
                            }
                        ]
                    },
                    // ═══════════════════════════════════════
                    // PHASE 4 : JEU FEMININ – WNBA & FIBA ELITE
                    // ═══════════════════════════════════════
                    {
                        id: "m4",
                        title: "PHASE 4 : JEU FEMININ – WNBA & FIBA ELITE",
                        duration: "Mois 4 - 4 semaines",
                        lessons: [
                            {
                                id: "l4_1",
                                title: "Sabrina Ionescu : La Reine du Tir en Mouvement",
                                content: "# Sabrina Ionescu – Volume & Precision en Mouvement\n\nSabrina est connue pour son volume enorme de tirs et sa precision en mouvement (catch-and-shoot, pull-up, step-back).\n\n### Routine Tir Signature (45-60 min) :\n- **Form Shooting proche** : 50-100 makes (focus release rapide + follow-through).\n- **Spot Shooting 5 spots** : Corners, wings, top of the key → 5-10 makes en catch-and-shoot.\n- **Drill Exit-Lift-Drift** : Sprint d'un corner a l'autre, reception + tir, puis drift ou lift. Objectif : 10 makes avant 2 misses consecutifs.\n- **Pull-up & Step-back** : 20-30 tirs en dribble (jab step + pull-up ou hesi + step-back 3).\n- **Finisher** : Lancers francs + tirs fatigues apres sprints ou pompes.\n\n### Dribble Sabrina Style :\n2-ball stationary + moving (pound + between legs + behind the back) avec hesitation et quick cross.",
                                imageUrl: "@/assets/images/academy/wnba_sabrina.png",
                                checklist: [
                                    { id: "c4_1_1", label: "Form Shooting (50 makes proches)" },
                                    { id: "c4_1_2", label: "Drill Exit-Lift-Drift (10 makes)" },
                                    { id: "c4_1_3", label: "Pull-up & step-back 3 (30 reps)" },
                                    { id: "c4_1_4", label: "Tirs fatigues termines" }
                                ]
                            },
                            {
                                id: "l4_2",
                                title: "Breanna Stewart : La Polyvalente (Post + 3pts)",
                                content: "# Breanna Stewart – Stewie, la GOAT Polyvalente\n\nStewie (2m) melange tir en extension, mid-range et 3 points. Son jeu est tres FIBA-friendly.\n\n### Routine Tir :\n- **Form Shooting + Mid-range** (elbow, short corner) : Beaucoup de reps avec equilibre et extension haute.\n- **Shooting off screens** : Curl, flare, pin-down → reception + tir rapide.\n- **Face-up attacks** : 1-2 dribbles + pull-up jumper ou drive.\n- **3 points** : Volume moindre mais propre en transition et relocation.\n\n### Dribble :\nMoins flashy, plus controle. Focus sur pound dribble bas + hesitation avant le tir pour creer de l'espace.\n\n> **Cle Ankece** : L'equilibre prime sur tout. Genoux flechis, base large, release haute a chaque rep.",
                                imageUrl: "@/assets/images/academy/wnba_stewie.png",
                                checklist: [
                                    { id: "c4_2_1", label: "Mid-range elbow (15 makes)" },
                                    { id: "c4_2_2", label: "Shooting off screens (10 reps)" },
                                    { id: "c4_2_3", label: "Face-up attack valide" }
                                ]
                            },
                            {
                                id: "l4_3",
                                title: "Caitlin Clark : Volume + Range Extreme",
                                content: "# Caitlin Clark – Logo Shots & Movement constant\n\nCaitlin tire de tres loin et en mouvement constant. La joueuse avec le biggest bag de son epoque.\n\n### Routine Tir :\n- **Deep 3s & Logo shots** : Tirs reguliers de bien au-dela de la ligne.\n- **Drills avec relocation constante** : Bouge apres chaque tir, ne reste jamais statique.\n- **Spot shooting + off-dribble** : Pull-up 3 apres 1-2 dribbles sur chaque spot.\n- **Emphasis sur fatigue** : Repete la routine meme en fin de session, la fatigue revele les failles.\n\n### Autres Joueuses FIBA/WNBA :\n- **Erica Wheeler** : Drills de ball handling avec footwork et agilite.\n- **Kelsey Plum** : Handles rapides + tir en sortie d'ecran.\n- **Skylar Diggins-Smith** : Drill '5 spots, 3 shots' (catch, pull-up, contested par spot).",
                                imageUrl: "@/assets/images/academy/wnba_caitlin.png",
                                checklist: [
                                    { id: "c4_3_1", label: "10 deep 3s depuis le logo" },
                                    { id: "c4_3_2", label: "Relocation drill (bouge apres chaque tir)" },
                                    { id: "c4_3_3", label: "Pull-up 3 off-dribble (5 spots)" }
                                ]
                            },
                            {
                                id: "l4_4",
                                title: "Routine Hybride WNBA/FIBA (Joueuse)",
                                content: "# Ta Routine Hybride Feminine Elite\n\nFais ca 4-5 jours/semaine. Commence bas et lent, focus sur **technique propre**.\n\n### Tir (45-60 min) :\n- Form Shooting (50 makes pres du panier, 1 main puis 2 mains).\n- 5 spots catch-and-shoot (5-8 makes par spot).\n- Movement shooting : Sprint + reception + tir (Exit-Lift-Drift ou curls off screens imaginaires).\n- Pull-up / step-back 3 (20 reps).\n- Lancers francs + 10 tirs fatigues.\n\n### Dribble / Handles (30-45 min) :\n- Pound dribble + V-dribble (bas, tete haute).\n- Stationary combos : Crossover, between legs, behind back (10-20 reps chaque main).\n- Moving drills : 2-ball si possible, ou cone weave avec hesitation + cross.\n- Dribble into shot : 1-2 dribbles + pull-up ou hesitation drive.\n- Finisher fatigue (dribble apres squats ou sprints).\n\n### Conseils specifiques Filles/WNBA :\n- Priorise le footwork et l'equilibre (genoux flechis, base large).\n- Travaille beaucoup sans ballon (cuts, relocations) puis avec reception.\n- **Filme-toi souvent** pour corriger la mecanique (release haute, pas de drifting).\n- Ajoute du conditionnement : tire ou dribble fatiguee en fin de session.",
                                imageUrl: "@/assets/images/academy/wnba_hybrid.png",
                                checklist: [
                                    { id: "c4_4_1", label: "Partie Tir WNBA (45-60 min)" },
                                    { id: "c4_4_2", label: "Partie Handles (30-45 min)" },
                                    { id: "c4_4_3", label: "Session filmee pour analyse" },
                                    { id: "c4_4_4", label: "Finisher fatigue (squats + dribble)" }
                                ]
                            }
                        ]
                    },
                    // ═══════════════════════════════════════
                    // PHASE 5 : MAITRISE TACTIQUE & TECHNIQUE
                    // ═══════════════════════════════════════
                    {
                        id: "m5",
                        title: "PHASE 5 : MAITRISE TACTIQUE & TECHNIQUE",
                        duration: "Mois 5 - 4 semaines",
                        lessons: [
                            {
                                id: "l5_1",
                                title: "Le Pick & Roll (L'Arme du Createur)",
                                content: "# Domine le Pick & Roll : Mode Street Ball\n\nLe P&R n'est pas qu'un ecran, c'est une **guerre de lecture**. A haut niveau, le meneur qui ne sait pas lire un ecran est un meneur sans avenir.\n\n### 1. La Posture d'Engagement\nAvant meme l'ecran, ton defenseur doit etre 'prepare'. Amene-le a l'oppose pour qu'il soit force de subir l'ecran.\n\n### 2. Le Passage (Froler l'Epaule)\nIl ne doit pas y avoir d'espace entre toi et le poseur d'ecran. 'Frotte l'epaule' pour que ton defenseur reste bloque.\n\n### 3. La Lecture en 0.5 seconde :\n- **Le 'Snake'** : Si le defenseur passe au-dessus, repique instantanement devant lui pour le bloquer dans ton dos (methode Chris Paul).\n- **Le 'Drop'** : Si le grand adverse reste en bas, Sanctionne direct par un tir a mi-distance.\n- **Le 'Switch'** : Attaque le grand avec un cross agressif.",
                                imageUrl: "@/assets/images/academy/pick_and_roll_schema.png",
                                drills: ["drill_id_placeholder_pnr"],
                                checklist: [
                                    { id: "c5_1_1", label: "Maitriser le 'Snake' x10" },
                                    { id: "c5_1_2", label: "Sanctionner le 'Drop' au tir" }
                                ]
                            },
                            {
                                id: "l5_2",
                                title: "La Flex Cut : Radar Silencieux",
                                content: "# L'Art de la Coupe Flex : Deviens un Fantome\n\nApprends a devenir invisible pour la defense. Le panier le plus facile est celui que la defense n'a pas vu venir.\n\n### Le Timing est ROUGE\nNe pars pas trop tot. Attends que l'ecran soit pose. Ton objectif est d'arriver au cercle au moment exact ou la passe part.\n\n### La Lecture 'Backdoor'\nSi ton defenseur surjoue l'interception et bloque le chemin vers l'ecran, oublie le systeme et plonge direct au panier (Backdoor). C'est ainsi que tu punis l'agressivite excessive.\n\n> **Pro Tip** : Regarde toujours la cible, pas le ballon. Tes yeux doivent commander tes pieds.",
                                imageUrl: "@/assets/images/academy/flex_cut_schema.png",
                                checklist: [
                                    { id: "c5_2_1", label: "Timing de coupe valide" },
                                    { id: "c5_2_2", label: "Reussir 3 backdoors en match" }
                                ]
                            },
                            {
                                id: "l5_3",
                                title: "Defense Tactique : Le Cote Aide",
                                content: "# L'Art de la Defense Collective\n\nUne defense individuelle gagne des duels, une **defense collective** gagne des championnats.\n\n### 1. La Position 'Pistolet'\nQuand tu es a l'oppose du ballon, tu dois etre en 'Open Stance'. Un doigt pointe ton joueur, l'autre pointe le porteur de balle.\n\n### 2. Le Cote Aide (Help Side)\nSi ton coequipier se fait deborder, c'est **TON** job de fermer la raquette. N'attends pas qu'il soit battu, anticipe la rotation.\n\n### 3. La Communication (Le Mur de Voix)\nUne defense silencieuse est une defense morte.\n- Annonce les ecrans ('ECRAN GAUCHE !')\n- Annonce ton aide ('J'AI L'AIDE !')\n- Annonce la reprise ('REPRISE !')\n\n> **Regle d'Or Ankece** : On ne laisse jamais un lay-up facile. On force le tir difficile.",
                                imageUrl: "@/assets/images/academy/defense_tactique_schema.png",
                                checklist: [
                                    { id: "c5_3_1", label: "Vocalise toutes les defenses" },
                                    { id: "c5_3_2", label: "Position Pistolet maintenue" }
                                ]
                            }
                        ]
                    }
                ]
            };

            // On utilise upsert avec un ID fixe pour eviter les doublons
            await contentService.upsertProgram("confidence-basket-boost-official", {
                ...newProgram,
                coachId: user?.uid || "ankece_official",
                createdAt: serverTimestamp()
            });

            Alert.alert("Succes", "Programme Confidence Basket Boost mis a jour (19.90EUR) - 5 Phases / 20 semaines !");
            loadPrograms();
        } catch (error: any) {
            console.error('Error bootstrapping program:', error);
            Alert.alert("Erreur", `Impossible d'injecter le programme: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderProgramItem = (item: TrainingProgram) => (
        <View key={item.id} style={styles.programItem}>
            <View style={styles.programInfo}>
                <ThemedText type="defaultSemiBold" style={styles.programTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.programMeta}>{item.weeksCount} semaines</ThemedText>
                <ThemedText style={styles.statusBadge}>{item.status.toUpperCase()}</ThemedText>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity 
                    onPress={() => router.push(`/(admin)/academy/edit/${item.id}` as any)}
                    style={[styles.actionBtn, { backgroundColor: '#111' }]}
                >
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce programme ?", [
                        { text: "Annuler", style: "cancel" },
                        { text: "Supprimer", style: "destructive", onPress: async () => {
                            try {
                                await contentService.deleteProgram(item.id!);
                                loadPrograms();
                            } catch (e: any) {
                                Alert.alert("Erreur", "Permissions insuffisantes pour supprimer ce programme.");
                            }
                        }}
                    ])}
                    style={[styles.actionBtn, { backgroundColor: '#111' }]}
                >
                    <Ionicons name="trash-outline" size={20} color="#FF4500" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Gestion Academie", headerTitleStyle: { fontWeight: '900' } }} />
            
            <View style={styles.headerActions}>
                <TouchableOpacity 
                    style={[styles.addBtn, { backgroundColor: tintColor }]}
                    onPress={() => router.push('/(admin)/academy/create' as any)}
                >
                    <Ionicons name="add" size={24} color="#000" />
                    <ThemedText style={styles.addBtnText}>Nouveau Programme</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.bootstrapBtn}
                    onPress={bootstrapConfidenceProgram}
                >
                    <Ionicons name="flash-outline" size={20} color={tintColor} />
                    <ThemedText style={{ color: tintColor, fontSize: 12 }}>Initialiser Confidence Program</ThemedText>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ThemedView style={styles.centered}>
                    <ActivityIndicator size="large" color={tintColor} />
                </ThemedView>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {programs.length === 0 ? (
                        <View style={styles.centered}>
                            <ThemedText style={{ opacity: 0.5 }}>Aucun programme trouve.</ThemedText>
                        </View>
                    ) : (
                        programs.map(renderProgramItem)
                    )}
                </ScrollView>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    headerActions: {
        padding: 20,
        gap: 12,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        gap: 10,
    },
    addBtnText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
    },
    bootstrapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 0, 0.3)',
        gap: 8,
        backgroundColor: 'rgba(255, 69, 0, 0.05)',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    programItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    programInfo: {
        flex: 1,
    },
    programTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    programMeta: {
        fontSize: 12,
        opacity: 0.6,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FF4500',
        marginTop: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
