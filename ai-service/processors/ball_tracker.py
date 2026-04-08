import cv2
import numpy as np
from ultralytics import YOLO
import time

class BallTracker:
    def __init__(self, model_path="yolov8n.pt"):
        # Initialisation du modèle YOLOv8 (par défaut nano pour la vitesse)
        # Pour une précision HomeCourt, l'utilisateur devra fournir son export Roboflow
        try:
            self.model = YOLO(model_path)
        except Exception as e:
            print(f"⚠️ Erreur lors du chargement de YOLOv8: {e}. Utilisation du modèle générique.")
            self.model = YOLO("yolov8n.pt")
            
        self.ball_positions = []  # List of tuples (x, y, timestamp)
        self.hoop_coords = None   # tuple (x, y, w, h)
        
    def detect_ball(self, frame):
        """
        Détecte le ballon dans la frame courante.
        Retourne (cx, cy, confidence) ou None.
        """
        results = self.model(frame, verbose=False)[0]
        
        # On cherche la classe 'sports ball' (class index 32 dans COCO)
        for box in results.boxes:
            class_id = int(box.cls[0])
            conf = float(box.conf[0])
            
            if class_id == 32 and conf > 0.3:
                xyxy = box.xyxy[0].cpu().numpy()
                cx = int((xyxy[0] + xyxy[2]) / 2)
                cy = int((xyxy[1] + xyxy[3]) / 2)
                
                # Enregistrement pour la trajectoire
                self.ball_positions.append((cx, cy, time.time()))
                
                # On limite l'historique aux 50 dernières positions
                if len(self.ball_positions) > 50:
                    self.ball_positions.pop(0)
                    
                return (cx, cy, conf)
        
        return None

    def predict_trajectory(self, future_frames=30):
        """
        Calcule la trajectoire via régression polynomiale (degré 2)
        sur les 15 dernières positions.
        """
        if len(self.ball_positions) < 10:
            return None
            
        # On récupère les 15 derniers points
        points = np.array(self.ball_positions[-15:])
        x = points[:, 0]
        y = points[:, 1]
        
        # Fit: y = ax^2 + bx + c
        try:
            poly = np.polyfit(x, y, 2)
            coeffs = np.poly1d(poly)
            
            # Prédire les points futurs
            last_x = x[-1]
            # Déterminer la direction horizontale basée sur les derniers points
            direction = 1 if x[-1] > x[0] else -1 # Tir vers la droite ou gauche
            
            future_points = []
            for i in range(1, future_frames + 1):
                next_x = last_x + (i * 10 * direction)
                next_y = coeffs(next_x)
                future_points.append((int(next_x), int(next_y)))
                
            return future_points
        except Exception:
            return None

    def detect_made_shot(self, hoop_bbox):
        """
        Analyse si le futur impact est dans le panier.
        hoop_bbox = (x, y, w, h)
        """
        future_path = self.predict_trajectory()
        if not future_path or not hoop_bbox:
            return {"made": False, "confidence": 0}
            
        hx, hy, hw, hh = hoop_bbox
        
        # On vérifie si un des points de la courbe rentre dans le rectangle du panier
        for px, py in future_path:
            if hx < px < (hx + hw) and hy < py < (hy + hh):
                # Analyse de la descente (y doit augmenter entre le pic et l'entrée)
                # Un swish passe au centre, un board touche l'arrière
                return {
                    "made": True,
                    "type": "swish" if abs(px - (hx + hw/2)) < hw/4 else "board",
                    "confidence": 0.85
                }
                
        return {"made": False, "confidence": 0}

    def clear(self):
        self.ball_positions = []
        self.hoop_coords = None

ball_tracker = BallTracker()
