import cv2
import mediapipe as mp
import numpy as np

class DribbleDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5
        )
        
        # State tracking
        self.dribble_count = 0
        self.last_y = [0.5, 0.5] # For left and right hands
        self.direction = [0, 0] # -1 for down, 1 for up
        self.moves = [] # List of detected specialized moves
        self.last_hand = None # To track crossovers

    def process_frame(self, frame):
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        hand_results = self.hands.process(image_rgb)
        pose_results = self.pose.process(image_rgb)
        
        current_data = {
            "hands": [],
            "pose": None
        }
        
        if hand_results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(hand_results.multi_hand_landmarks):
                # Identify if it's Left or Right hand
                handedness = hand_results.multi_handedness[idx].classification[0].label
                wrist = hand_landmarks.landmark[self.mp_hands.HandLandmark.WRIST]
                
                # Simple logic for dribble detection
                # We look for a change in direction of the Y coordinate (vertical movement)
                hand_idx = 0 if handedness == 'Left' else 1
                curr_y = wrist.y
                
                if curr_y > self.last_y[hand_idx] + 0.02: # Moving Down
                    if self.direction[hand_idx] != -1: # Was moving up or stationary
                        self.direction[hand_idx] = -1
                elif curr_y < self.last_y[hand_idx] - 0.02: # Moving Up
                    if self.direction[hand_idx] == -1: # Was moving down
                        self.dribble_count += 1
                        self.direction[hand_idx] = 1
                        
                        # Crossover Check
                        if self.last_hand and self.last_hand != handedness:
                            self.moves.append("Crossover")
                        self.last_hand = handedness
                
                self.last_y[hand_idx] = curr_y
                
                current_data["hands"].append({
                    "label": handedness,
                    "y": round(curr_y, 3),
                    "x": round(wrist.x, 3)
                })

        return {
            "dribble_count": self.dribble_count,
            "moves": list(set(self.moves)),
            "current_data": current_data
        }

    def process_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        frame_count = 0
        
        # Reset state for fresh video
        self.dribble_count = 0
        self.moves = []
        self.last_hand = None
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            if frame_count % 2 == 0: # Process every 2nd frame for speed
                self.process_frame(frame)
        
        cap.release()
        
        return {
            "success": True,
            "dribble_count": self.dribble_count,
            "moves": list(set(self.moves)),
            "message": f"Analyse terminée. {self.dribble_count} dribbles détectés."
        }

dribble_detector = DribbleDetector()
