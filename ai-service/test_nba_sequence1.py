import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_sequence_1():
    print("--- Testing NBA Sequence 1 - Intro ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman",
        "number": "6",
        "season": "2027",
        "position": "Point Guard",
        "height": 175,
        "dominantHand": "Droitier",
        "currentClub": {
            "clubName": "NBA Academy",
            "category": "Elite",
            "level": "International"
        }
    }
    
    # Use the found asset
    # Assets are in the root of the project, not inside ai-service
    photo_path = os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "images", "IMG_0584.JPG"))
    if not os.path.exists(photo_path):
        print(f"Photo not found at {photo_path}")
        return

    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "intro_seq_test.mp4")
    
    print("Rendering Sequence 1 (10s)... This may take a moment.")
    clip = renderer.sequence_1_intro(player_data, photo_path)
    
    # Render with decent quality
    clip.write_videofile(output_path, fps=24, codec="libx264", audio=False)
    
    print(f"Successfully rendered Sequence 1 to: {output_path}")

if __name__ == "__main__":
    test_sequence_1()
