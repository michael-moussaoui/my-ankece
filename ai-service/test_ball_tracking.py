import cv2
import numpy as np
from processors.ball_tracker import BallTracker
import os

def test_ball_tracking_simulated():
    """
    Test de la logique de tracking avec une vidéo simulée 
    pour vérifier la régression polynomiale.
    """
    print("🚀 Démarrage du test de trajectoire...")
    tracker = BallTracker()
    
    # Création d'une vidéo synthétique d'un tir parabolique
    width, height = 1280, 720
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter('test_trajectory.mp4', fourcc, 30.0, (width, height))
    
    # Panier simulé
    hoop_bbox = (1000, 250, 80, 20) # hx, hy, hw, hh
    
    # Courbe : y = 0.002(x-600)^2 + 100
    for x in range(200, 1100, 10):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Dessiner Panier
        cv2.rectangle(frame, (hoop_bbox[0], hoop_bbox[1]), 
                     (hoop_bbox[0]+hoop_bbox[2], hoop_bbox[1]+hoop_bbox[3]), (255, 255, 0), 2)
        
        # Tir manuel (simulant détection YOLO)
        y = int(0.002 * (x - 600)**2 + 100)
        
        # Injecter la position dans le tracker
        tracker.ball_positions.append((cx if 'cx' in locals() else x, y, 0)) # Using x for simulation
        # Fix: the previous injection used cx which wasn't defined. Let's use x.
        tracker.ball_positions[-1] = (x, y, 0)
        
        # Prédiction
        future = tracker.predict_trajectory()
        if future:
            for i in range(len(future)-1):
                p1 = future[i]
                p2 = future[i+1]
                # Vérification des limites pour éviter des erreurs d'affichage
                if 0 <= p1[0] < width and 0 <= p1[1] < height and 0 <= p2[0] < width and 0 <= p2[1] < height:
                    cv2.line(frame, p1, p2, (0, 255, 0), 2)
        
        # Détection "Made"
        shot_info = tracker.detect_made_shot(hoop_bbox)
        if shot_info["made"]:
            cv2.putText(frame, f"MADE: {shot_info['type']}", (50, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            
        cv2.circle(frame, (x, y), 15, (0, 140, 255), -1)
        out.write(frame)
        
    out.release()
    print("✅ Vidéo de test générée : test_trajectory.mp4")

if __name__ == "__main__":
    test_ball_tracking_simulated()
