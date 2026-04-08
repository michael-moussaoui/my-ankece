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
        self.last_y = [0.5, 0.5] # Left (0), Right (1)
        self.direction = [0, 0] # -1 down, 1 up
        self.moves = []
        self.last_hand = None

    def process_frame(self, frame):
        h, w, _ = frame.shape
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 1. Pose Analysis (Posture context)
        pose_results = self.pose.process(image_rgb)
        waist_y = 0.6 # Fallback
        if pose_results.pose_landmarks:
            l = pose_results.pose_landmarks.landmark
            waist_y = (l[self.mp_pose.PoseLandmark.LEFT_HIP].y + l[self.mp_pose.PoseLandmark.RIGHT_HIP].y) / 2

        # 2. Ball Tracking (Heuristic: Orange color)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_orange = np.array([5, 100, 100])
        upper_orange = np.array([25, 255, 255])
        mask = cv2.inRange(hsv, lower_orange, upper_orange)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        ball_pos = None
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 100 < area < 5000:
                (x, y), radius = cv2.minEnclosingCircle(cnt)
                if area / (np.pi * radius**2) > 0.6:
                    ball_pos = (int(x), int(y))
                    break

        # 3. Hand Analysis
        hand_results = self.hands.process(image_rgb)
        current_data = {"hands": [], "ball": ball_pos, "waist_y": round(waist_y, 3)}

        if hand_results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(hand_results.multi_hand_landmarks):
                lbl = hand_results.multi_handedness[idx].classification[0].label
                wrist = hand_landmarks.landmark[self.mp_hands.HandLandmark.WRIST]
                h_idx = 0 if lbl == 'Left' else 1
                curr_y = wrist.y

                # Proximity to ball
                dist = 999
                if ball_pos:
                    dist = np.sqrt((wrist.x*w - ball_pos[0])**2 + (wrist.y*h - ball_pos[1])**2)

                # Dribble Logic
                if curr_y > self.last_y[h_idx] + 0.01:
                    self.direction[h_idx] = -1
                elif curr_y < self.last_y[h_idx] - 0.01:
                    # Count only if it was moving down AND is low enough (HomeCourt logic)
                    if self.direction[h_idx] == -1 and curr_y > waist_y - 0.1:
                        self.dribble_count += 1
                        print(f"[DEBUG-DRIBBLE] Count: {self.dribble_count} | Hand: {lbl} | Y: {round(curr_y,2)}")
                        self.direction[h_idx] = 1
                        
                        if self.last_hand and self.last_hand != lbl:
                            if ball_pos and abs(ball_pos[0]/w - 0.5) < 0.2:
                                self.moves.append("Crossover")
                        self.last_hand = lbl
                
                self.last_y[h_idx] = curr_y
                current_data["hands"].append({"label": lbl, "y": round(curr_y, 3), "dist_to_ball": round(dist, 1)})

        return {"dribble_count": self.dribble_count, "moves": list(set(self.moves)), "current_data": current_data}

    def process_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        self.dribble_count = 0
        self.moves = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            self.process_frame(frame)
        cap.release()
        return {"success": True, "dribble_count": self.dribble_count, "moves": list(set(self.moves))}

dribble_detector = DribbleDetector()
