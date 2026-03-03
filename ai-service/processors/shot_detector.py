import cv2
import mediapipe as mp
import numpy as np

class ShotDetector:
    def __init__(self):
        # Initialize MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=True,
            min_detection_confidence=0.5
        )

    def calculate_angle(self, a, b, c):
        """Calculates the angle between three points (a, b, c) at vertex b."""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        
        if angle > 180.0:
            angle = 360-angle
            
        return angle

    def process_frame(self, frame):
        """
        Process a single frame to detect person pose.
        Returns the coordinates of keypoints and calculated angles.
        """
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)

        if not results.pose_landmarks:
            return {"detected": False, "message": "No person detected"}

        landmarks = results.pose_landmarks.landmark
        
        # Points coordinates (Right side)
        shoulder = [landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER].y]
        elbow = [landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW].y]
        wrist = [landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST].y]
        hip = [landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP].y]
        knee = [landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE].y]
        ankle = [landmarks[self.mp_pose.PoseLandmark.RIGHT_ANKLE].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_ANKLE].y]
        
        # Vertical reference point (above hip)
        vertical_ref = [hip[0], hip[1] - 0.5]

        # Calculate angles
        elbow_angle = self.calculate_angle(shoulder, elbow, wrist)
        knee_angle = self.calculate_angle(hip, knee, ankle)
        # Torso lean (angle between vertical and line shoulder-hip)
        torso_angle = self.calculate_angle(shoulder, hip, vertical_ref)
        # Arm elevation (angle between torso and upper arm)
        arm_elevation = self.calculate_angle(hip, shoulder, elbow)

        return {
            "detected": True,
            "pose_points": {
                "right_shoulder": shoulder,
                "right_elbow": elbow,
                "right_wrist": wrist,
                "right_hip": hip,
                "right_knee": knee,
                "right_ankle": ankle
            },
            "angles": {
                "right_elbow": round(elbow_angle, 2),
                "right_knee": round(knee_angle, 2),
                "torso_lean": round(torso_angle, 2),
                "arm_elevation": round(arm_elevation, 2)
            },
            "message": "Frame successfully analyzed"
        }

    def generate_coaching_report(self, analyses):
        """Generates coaching advice based on measured angles."""
        # Find the frame where the arm is most extended (release point)
        release_frame = max(analyses, key=lambda x: x["right_elbow"])
        
        advice = []
        
        # 1. Check knees at release
        if release_frame["right_knee"] < 165:
            advice.append("Jambes : Tes jambes sont trop pliées au moment du lâcher. Travaille sur l'extension complète pour gagner en puissance.")
        
        # 2. Check torso lean
        avg_lean = sum(a["torso_lean"] for a in analyses) / len(analyses)
        if avg_lean > 15:
            advice.append(f"Buste : Ton buste est trop penché vers l'avant ({round(avg_lean, 1)}°). Redresse-toi pour un tir plus stable.")
            
        # 3. Check arm elevation
        if release_frame["arm_elevation"] < 50:
            advice.append(f"Bras : Tes bras ne sont pas assez levés ({round(release_frame['arm_elevation'], 1)}°). Vise plus haut pour une meilleure trajectoire en cloche.")

        if not advice:
            advice.append("Superbe forme ! Continue comme ça.")
            
        return advice

    def process_video(self, video_path):
        """
        Processes a video file and returns a summary of the poses/angles.
        """
        cap = cv2.VideoCapture(video_path)
        frame_count = 0
        analyses = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            # Process every 3rd frame for more precision since we look for biomechanics
            if frame_count % 3 == 0:
                analysis = self.process_frame(frame)
                if analysis["detected"]:
                    # Include key angles in sequence
                    analyses.append({
                        "frame": frame_count,
                        **analysis["angles"]
                    })
        
        cap.release()
        
        if not analyses:
            return {"success": False, "message": "No poses detected in video"}
            
        coaching_report = self.generate_coaching_report(analyses)
            
        return {
            "success": True,
            "frame_count": frame_count,
            "analyzed_frames": len(analyses),
            "max_elbow_angle": max(a["right_elbow"] for a in analyses),
            "min_elbow_angle": min(a["right_elbow"] for a in analyses),
            "avg_torso_lean": round(sum(a["torso_lean"] for a in analyses) / len(analyses), 2),
            "coaching_report": coaching_report,
            "sequence": analyses
        }

shot_detector = ShotDetector()
