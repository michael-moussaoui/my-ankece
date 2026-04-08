import cv2
import numpy as np
from processors.dribble_analyzer_pro import dribble_analyzer
import os
import time

def test_dribble_pro():
    """Simulates a crossover sequence to test move detection and frequency."""
    width, height = 640, 480
    video_path = "test_dribble_pro.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 30.0, (width, height))
    
    print("Starting Dribble Pro Test...")
    
    for f in range(100):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Draw fake posture
        cv2.line(frame, (320, 200), (320, 400), (255, 255, 255), 5) 
        
        if f < 40: # Right hand dribbles
            y = 250 + (f % 20 - 10)**2
            bx, by = 400, y
        elif f < 60: # Crossover transition
            t = (f - 40) / 20
            bx = int(400 * (1-t) + 240 * t)
            by = 400 
        else: # Left hand dribble
            y = 250 + ((f-60) % 20 - 10)**2
            bx, by = 240, y
            
        cv2.circle(frame, (bx, by), 15, (0, 140, 255), -1)
        out.write(frame)
        
    out.release()
    
    # Run analysis
    result = dribble_analyzer.process_video(video_path)
    
    print("Analysis Complete.")
    print(f"Dribbles: {result['dribble_count']}")
    print(f"Frequency: {result['dribble_metrics']['frequency']} dribbles/sec")
    print(f"Moves Detected: {result['dribble_metrics']['moves_detected']}")
    
    if os.path.exists(video_path):
        os.remove(video_path)

if __name__ == "__main__":
    test_dribble_pro()
