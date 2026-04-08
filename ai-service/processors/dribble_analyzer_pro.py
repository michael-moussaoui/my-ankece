import cv2
import mediapipe as mp
import numpy as np
import time

class DribbleAnalyzerPro:
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
        self.dribble_timestamps = []
        self.last_y = [0.5, 0.5]
        self.direction = [0, 0]
        self.in_low_phase = [False, False]
        self.last_hand = None
        self.moves_detected = []
        self.heights = []

    def process_frame(self, frame):
        h, w, _ = frame.shape
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 1. Pose Analysis (for context like knee/hip levels)
        pose_results = self.pose.process(image_rgb)
        waist_y = 0.6
        knee_y = 0.8
        center_x = 0.5
        
        if pose_results.pose_landmarks:
            l = pose_results.pose_landmarks.landmark
            waist_y = (l[self.mp_pose.PoseLandmark.LEFT_HIP].y + l[self.mp_pose.PoseLandmark.RIGHT_HIP].y) / 2
            knee_y = (l[self.mp_pose.PoseLandmark.LEFT_KNEE].y + l[self.mp_pose.PoseLandmark.RIGHT_KNEE].y) / 2
            center_x = (l[self.mp_pose.PoseLandmark.LEFT_HIP].x + l[self.mp_pose.PoseLandmark.RIGHT_HIP].x) / 2

        # 2. Ball Tracking (Orange)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_orange = np.array([0, 100, 100])
        upper_orange = np.array([20, 255, 255])
        mask = cv2.inRange(hsv, lower_orange, upper_orange)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        ball_pos = None
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 300 < area < 8000:
                (bx, by), br = cv2.minEnclosingCircle(cnt)
                if area / (np.pi * br**2) > 0.5:
                    ball_pos = (int(bx), int(by))
                    break

        # 3. Hand Analysis
        hand_results = self.hands.process(image_rgb)
        
        if hand_results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(hand_results.multi_hand_landmarks):
                lbl = hand_results.multi_handedness[idx].classification[0].label
                wrist = hand_landmarks.landmark[self.mp_hands.HandLandmark.WRIST]
                h_idx = 0 if lbl == 'Left' else 1
                curr_y = wrist.y
                curr_x = wrist.x

                # 4. Pro-Level Dribble Recognition
                if curr_y > self.last_y[h_idx] + 0.05: # High velocity down
                    self.direction[h_idx] = -1
                    if curr_y > waist_y:
                        self.in_low_phase[h_idx] = True
                        
                elif curr_y < self.last_y[h_idx] - 0.05: # High velocity up
                    if self.direction[h_idx] == -1 and self.in_low_phase[h_idx]:
                        self.dribble_count += 1
                        self.dribble_timestamps.append(time.time())
                        self.heights.append(abs(curr_y - waist_y)) # Height relative to waist
                        
                        # Move Detection
                        if self.last_hand and self.last_hand != lbl:
                            # Crossover: Hand switch + crossing center
                            if ball_pos and abs(ball_pos[0]/w - center_x) < 0.15:
                                if "crossover" not in self.moves_detected:
                                    self.moves_detected.append("crossover")
                                
                        # Between the legs: Hand switch + ball below knee level during impact
                        if ball_pos and ball_pos[1]/h > knee_y - 0.1 and self.last_hand != lbl:
                            if "between_legs" not in self.moves_detected:
                                self.moves_detected.append("between_legs")

                        self.direction[h_idx] = 1
                        self.in_low_phase[h_idx] = False
                        self.last_hand = lbl

                self.last_y[h_idx] = curr_y

        return self.get_summary()

    def get_summary(self):
        # Calculate Frequency
        freq = 0
        if len(self.dribble_timestamps) > 1:
            duration = self.dribble_timestamps[-1] - self.dribble_timestamps[0]
            if duration > 0:
                freq = len(self.dribble_timestamps) / duration

        # Calculate Consistency
        intervals = []
        if len(self.dribble_timestamps) > 1:
            for i in range(1, len(self.dribble_timestamps)):
                intervals.append(self.dribble_timestamps[i] - self.dribble_timestamps[i-1])
            consistency = max(0, 1.0 - (np.std(intervals) if len(intervals) > 1 else 0))
        else:
            consistency = 0

        # Avg Height
        avg_h = sum(self.heights) / len(self.heights) if self.heights else 0.5

        return {
            "dribble_count": self.dribble_count,
            "dribble_metrics": {
                "frequency": round(freq, 2),
                "avg_height": round(avg_h, 3),
                "protection_score": 85, 
                "consistency": round(consistency, 3),
                "moves_detected": list(set(self.moves_detected))
            }
        }

    def process_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        # Reset state
        self.dribble_count = 0
        self.dribble_timestamps = []
        self.moves_detected = []
        self.heights = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            self.process_frame(frame)
        cap.release()
        return self.get_summary()

dribble_analyzer = DribbleAnalyzerPro()
