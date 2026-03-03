import { useAppTheme } from '@/context/ThemeContext';
import { ShotAnalysisData } from '@/types/editor';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShotAnalysisEditorProps {
    visible: boolean;
    currentTime: number; // Temps actuel de la vidéo (pour marquer le timestamp)
    onSave: (data: ShotAnalysisData) => void;
    onCancel: () => void;
    initialData?: ShotAnalysisData;
}

type Step = 'intro' | 'release' | 'apex' | 'hoop' | 'review';

export const ShotAnalysisEditor: React.FC<ShotAnalysisEditorProps> = ({
    visible,
    currentTime,
    onSave,
    onCancel,
    initialData
}) => {
    const { accentColor, accentTextColor } = useAppTheme();
    const [step, setStep] = useState<Step>('intro');
    const [data, setData] = useState<ShotAnalysisData>(initialData || { isGoodShot: true });
    const { t } = useTranslation();

    if (!visible) return null;

    const handleTap = (evt: any) => {
        const { locationX, locationY } = evt.nativeEvent;
        // Convertir en pourcentage (0-100)
        const x = (locationX / SCREEN_WIDTH) * 100;
        // La hauteur est 16:9 par rapport à la largeur
        const height = SCREEN_WIDTH * (16 / 9); // Supposons format portrait ou container 
        const y = (locationY / height) * 100;

        // Pour simplifier ici, on suppose que le container parent fait la bonne taille.
        // Dans une vraie implémentation, on récupérerait la taille exacte du container via onLayout.
        // Ici on va utiliser juste les coordonnées relatives standardisées.
        
        const point = { x, y, time: currentTime };

        if (step === 'release') {
            setData(prev => ({ ...prev, releasePoint: point }));
            setStep('apex');
        } else if (step === 'apex') {
            setData(prev => ({ ...prev, apexPoint: point }));
            setStep('hoop');
        } else if (step === 'hoop') {
            setData(prev => ({ ...prev, hoopPoint: point }));
            setStep('review');
        }
    };

    const handleSave = () => {
        // Calcul simple pour la démo
        const calculatedData = {
            ...data,
            entryAngle: 45, // Simulé
            arcHeight: 12,  // Simulé
        };
        onSave(calculatedData);
    };

    // Générer le path SVG pour la courbe quadratique ou cubique
    const trajectoryPath = useMemo(() => {
        if (!data.releasePoint || !data.hoopPoint) return '';
        
        // Coordonnées en pixels (basées sur SCREEN_WIDTH pour l'affichage)
        const w = SCREEN_WIDTH;
        const h = SCREEN_WIDTH * (9/16); // Format 16:9 landscape ou inverse ?
        // Attention : VideoEditor semble utiliser SCREEN_WIDTH * (9 / 16) pour le container.
        
        const sx = (data.releasePoint.x / 100) * w;
        const sy = (data.releasePoint.y / 100) * h;
        
        const ex = (data.hoopPoint.x / 100) * w;
        const ey = (data.hoopPoint.y / 100) * h;

        if (data.apexPoint) {
            const ax = (data.apexPoint.x / 100) * w;
            const ay = (data.apexPoint.y / 100) * h;
            // Bezier quadratique: Start -> Control -> End
            // Le point Apex n'est pas le point de contrôle direct, mais le sommet.
            // On peut approximer un point de contrôle qui ferait passer la courbe par l'apex.
            // Pour simplifier : M sx,sy Q ax,ay ex,ey (mais ça ne passera pas exactement par ax,ay)
            // Ou utiliser une cubique si on veut être plus précis.
            
            // Approximation simple : on utilise l'apex comme point de controle * 2 en hauteur ?
            // Une meilleure approche mathématique serait de calculer le control point.
            // P(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2. Sommet à t=0.5 => P(0.5) = 0.25 P0 + 0.5 P1 + 0.25 P2
            // Apex = 0.25 Start + 0.5 Control + 0.25 End
            // 0.5 Control = Apex - 0.25 Start - 0.25 End
            // Control = 2 * Apex - 0.5 Start - 0.5 End
            
            const cx = 2 * ax - 0.5 * sx - 0.5 * ex;
            const cy = 2 * ay - 0.5 * sy - 0.5 * ey;
            
            return `M ${sx},${sy} Q ${cx},${cy} ${ex},${ey}`;
        }
        
        return '';
    }, [data]);

    const trajectoryAnalysis = useMemo(() => {
        if (!data.releasePoint || !data.apexPoint || !data.hoopPoint) return null;
        
        const sx = data.releasePoint.x;
        const sy = data.releasePoint.y;
        const ax = data.apexPoint.x;
        const ay = data.apexPoint.y;
        const ex = data.hoopPoint.x;
        const ey = data.hoopPoint.y;

        // Quadratic Bezier control point calculation (consistent with path above)
        const cx = 2 * ax - 0.5 * sx - 0.5 * ex;
        const cy = 2 * ay - 0.5 * sy - 0.5 * ey;

        // Slope at $t=0$ for $P(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$
        // $P'(0) = 2(P_1 - P_0)$
        // Slope = $(cy - sy) / (cx - sx)$
        const slopeValue = (cx - sx) !== 0 ? (cy - sy) / (cx - sx) : 999;
        const angle = Math.atan(Math.abs(slopeValue)) * (180 / Math.PI);

        let quality: 'too-low' | 'optimal' | 'too-high' = 'optimal';
        if (angle < 35) quality = 'too-low';
        else if (angle > 55) quality = 'too-high';

        let color = '#34C759'; // Optimal
        if (data.isGoodShot) color = '#00F2FF'; // Made
        else if (quality === 'too-low') color = '#FF3B30'; // Too low (Red)
        else if (quality === 'too-high') color = '#FF9500'; // Too high (Orange)

        return { quality, color, angle };
    }, [data]);

    const renderOverlay = () => {
        const w = SCREEN_WIDTH;
        const h = SCREEN_WIDTH * (9/16);

        return (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <Svg height="100%" width="100%" viewBox={`0 0 ${w} ${h}`}>
                    {trajectoryPath ? (
                        <Path
                            d={trajectoryPath}
                            stroke={trajectoryAnalysis?.color || (data.isGoodShot ? "#00F2FF" : "#34C759")}
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={data.isGoodShot ? [] : [10, 5]}
                        />
                    ) : null}
                    
                    {data.releasePoint && (
                        <Circle
                            cx={(data.releasePoint.x / 100) * w}
                            cy={(data.releasePoint.y / 100) * h}
                            r="5"
                            fill="#FFFFFF"
                            stroke={accentColor}
                            strokeWidth="2"
                        />
                    )}
                    {data.apexPoint && (
                        <Circle
                            cx={(data.apexPoint.x / 100) * w}
                            cy={(data.apexPoint.y / 100) * h}
                            r="5"
                            fill="#FFFFFF"
                            stroke="#FF9500"
                            strokeWidth="2"
                        />
                    )}
                    {data.hoopPoint && (
                        <Circle
                            cx={(data.hoopPoint.x / 100) * w}
                            cy={(data.hoopPoint.y / 100) * h}
                            r="8" // Plus gros pour le panier
                            fill="none"
                            stroke="#FF3B30"
                            strokeWidth="3"
                        />
                    )}
                </Svg>
            </View>
        );
    };

    const getInstructionText = () => {
        switch (step) {
            case 'intro': return t('analysis.intro_msg') || "Nous allons analyser votre tir.";
            case 'release': return t('analysis.step_release') || "1. Placez la vidéo au moment du tir\n2. Touchez le ballon (Point de départ)";
            case 'apex': return t('analysis.step_apex') || "1. Placez la vidéo au sommet de la courbe\n2. Touchez le ballon (Sommet)";
            case 'hoop': return t('analysis.step_hoop') || "1. Placez la vidéo à l'arrivée\n2. Touchez le panier";
            case 'review': return t('analysis.step_review') || "Analyse terminée !";
             default: return "";
        }
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Overlay de dessin (toujours visible pour voir ce qu'on fait) */}
            {renderOverlay()}

            {/* Zone tactile transparente pour capter les clics lors des étapes de marquage */}
            {['release', 'apex', 'hoop'].includes(step) && (
                 <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    activeOpacity={1} 
                    onPress={handleTap}
                />
            )}

            {/* Interface UI */}
            <View style={styles.uiOverlay} pointerEvents="box-none">
                <View style={styles.instructionCard}>
                    <Text style={styles.instructionText}>{getInstructionText()}</Text>
                    {step === 'intro' && (
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: accentColor }]} onPress={() => setStep('release')}>
                            <Text style={styles.actionButtonText}>Commencer</Text>
                        </TouchableOpacity>
                    )}
                     {step === 'review' && (
                         <View style={styles.reviewControls}>
                             <View style={styles.toggleRow}>
                                <Text style={styles.label}>{t('analysis.ball_in_hoop') || 'Tir réussi ?'}</Text>
                                <SwitchButton 
                                    value={data.isGoodShot || false} 
                                    onValueChange={v => setData(d => ({ ...d, isGoodShot: v }))} 
                                />
                             </View>
                             {trajectoryAnalysis && (
                                 <View style={[styles.resultSummary, { backgroundColor: trajectoryAnalysis.color + '22' }]}>
                                     <Text style={[styles.resultTitle, { color: trajectoryAnalysis.color }]}>
                                         {data.isGoodShot ? t('analysis.made') : 
                                          trajectoryAnalysis.quality === 'too-low' ? t('analysis.too_low') :
                                          trajectoryAnalysis.quality === 'too-high' ? t('analysis.too_high') :
                                          t('analysis.optimal')}
                                     </Text>
                                     <Text style={styles.resultDetails}>
                                         {t('analysis.release_angle')}: {trajectoryAnalysis.angle.toFixed(1)}°
                                     </Text>
                                 </View>
                             )}
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: accentColor }]} onPress={handleSave}>
                                <Text style={[styles.actionButtonText, { color: accentTextColor }]}>{t('common.save') || 'Sauvegarder'}</Text>
                            </TouchableOpacity>
                         </View>
                    )}
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                    <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Composant Switch simple
const SwitchButton = ({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) => (
    <TouchableOpacity 
        style={[styles.switch, value ? styles.switchOn : styles.switchOff]}
        onPress={() => onValueChange(!value)}
    >
        <View style={[styles.switchKnob, value ? styles.switchKnobOn : styles.switchKnobOff]} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20, // Au dessus de la vidéo
    },
    uiOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
    },
    instructionCard: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '600',
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 10,
    },
    actionButtonText: {
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    reviewControls: {
        width: '100%',
        alignItems: 'center',
        gap: 15,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    label: { color: '#fff' },
    switch: {
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 2,
    },
    switchOn: { backgroundColor: '#34C759' },
    switchOff: { backgroundColor: '#3a3a3c' },
    switchKnob: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
    },
    switchKnobOn: { alignSelf: 'flex-end' },
    switchKnobOff: { alignSelf: 'flex-start' },
    resultSummary: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    resultDetails: {
        color: '#ccc',
        fontSize: 12,
    },
});
