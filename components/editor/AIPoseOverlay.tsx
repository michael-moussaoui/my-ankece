import * as poseDetection from '@tensorflow-models/pose-detection';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

interface AIPoseOverlayProps {
    poses: poseDetection.Pose[];
    width: number;
    height: number;
    showAngles?: boolean;
}

// BlazePose (MediaPipe Pose) Keypoint indices
// 0: nose, 1: left_eye_inner, 2: left_eye, 3: left_eye_outer
// 4: right_eye_inner, 5: right_eye, 6: right_eye_outer, 7: left_ear, 8: right_ear
// 9: mouth_left, 10: mouth_right, 11: left_shoulder, 12: right_shoulder
// 13: left_elbow, 14: right_elbow, 15: left_wrist, 16: right_wrist
// 17: left_pinky, 18: right_pinky, 19: left_index, 20: right_index
// 21: left_thumb, 22: right_thumb, 23: left_hip, 24: right_hip
// 25: left_knee, 26: right_knee, 27: left_ankle, 28: right_ankle
// 29: left_heel, 30: right_heel, 31: left_foot_index, 32: right_foot_index

const SKELETON_PAIRS = [
    // Face details
    [0, 1], [1, 2], [2, 3], // Oeil gauche
    [0, 4], [4, 5], [5, 6], // Oeil droit
    [3, 7], [6, 8], // Oreilles
    [9, 10], // Bouche
    
    // Body
    [11, 12], // Epaules
    [11, 13], [13, 15], // Bras gauche
    [12, 14], [14, 16], // Bras droit
    [11, 23], [12, 24], // Torse
    [23, 24], // Hanches
    
    // Hands
    [15, 17], [15, 19], [15, 21], // Main gauche
    [17, 19], // Pinky to Index main gauche
    [16, 18], [16, 20], [16, 22], // Main droite
    [18, 20], // Pinky to Index main droite
    
    // Legs
    [23, 25], [25, 27], // Jambe gauche
    [24, 26], [26, 28], // Jambe droite
    
    // Feet
    [27, 29], [29, 31], [27, 31], // Pied gauche
    [28, 30], [30, 32], [28, 32], // Pied droit
];

export const AIPoseOverlay: React.FC<AIPoseOverlayProps> = ({ poses, width, height, showAngles = true }) => {
    if (!poses || poses.length === 0) return null;
    
    // On prend la pose la plus probable
    const pose = poses[0];
    const keypoints = pose.keypoints;
    const scoreThreshold = 0.4; // BlazePose tends to have clearer scores

    // Calcul d'angles pour feedback immédiat
    const calculateAngle = (A: any, B: any, C: any) => {
        if (!A || !B || !C || A.score < scoreThreshold || B.score < scoreThreshold || C.score < scoreThreshold) return null;
        const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
        const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
        const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
        const angle = Math.acos((AB * AB + BC * BC - AC * AC) / (2 * AB * BC)) * (180 / Math.PI);
        return Math.round(angle);
    };

    // Angle Coude Droit (Epaule - Coude - Poignet)
    const rightElbowAngle = calculateAngle(keypoints[12], keypoints[14], keypoints[16]);
    
    // Angle Genou Droit (Hanche - Genou - Cheville)
    const rightKneeAngle = calculateAngle(keypoints[24], keypoints[26], keypoints[28]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`}>
                {/* Lignes du squelette */}
                {SKELETON_PAIRS.map(([start, end], index) => {
                    const startKp = keypoints[start];
                    const endKp = keypoints[end];
                    if (startKp && endKp && startKp.score && startKp.score > scoreThreshold && endKp.score && endKp.score > scoreThreshold) {
                        return (
                            <Line
                                key={`line-${index}`}
                                x1={startKp.x}
                                y1={startKp.y}
                                x2={endKp.x}
                                y2={endKp.y}
                                stroke="#00FF00"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        );
                    }
                    return null;
                })}

                {/* Points */}
                {keypoints.map((kp, index) => {
                    if (kp.score && kp.score > scoreThreshold) {
                         // Articulations majeures
                        const isPrimaryJoint = [11, 12, 13, 14, 23, 24, 25, 26].includes(index);
                        return (
                            <Circle
                                key={`kp-${index}`}
                                cx={kp.x}
                                cy={kp.y}
                                r={isPrimaryJoint ? "6" : "3"}
                                fill={isPrimaryJoint ? "#FF3B30" : "#fff"}
                                stroke="#00FF00"
                                strokeWidth="1"
                            />
                        );
                    }
                    return null;
                })}

                {/* Affichage des angles */}
                {showAngles && rightElbowAngle && keypoints[14] && (
                    <SvgText
                        x={keypoints[14].x + 10}
                        y={keypoints[14].y}
                        fill="#fff"
                        stroke="#000"
                        strokeWidth="1"
                        fontSize="14"
                        fontWeight="bold"
                    >
                        {rightElbowAngle}°
                    </SvgText>
                )}

                 {showAngles && rightKneeAngle && keypoints[26] && (
                    <SvgText
                        x={keypoints[26].x + 10}
                        y={keypoints[26].y}
                        fill="#fff"
                        stroke="#000"
                        strokeWidth="1"
                        fontSize="14"
                        fontWeight="bold"
                    >
                        {rightKneeAngle}°
                    </SvgText>
                )}
            </Svg>
        </View>
    );
};
