import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_sequence_4():
    print("--- Testing NBA Sequence 4 - Outro ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman",
        "email": "ashley.hallman@example.com",
        "phone": "+33 6 12 34 56 78",
        "instagram": "@ashley_baller"
    }
    
    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "outro_seq_test.mp4")
    
    print("Rendering Sequence 4... This may take a moment.")
    if hasattr(renderer, 'sequence_4_outro'):
        clip = renderer.sequence_4_outro(player_data)
        clip.write_videofile(output_path, fps=24, codec="libx264", audio=False)
        print(f"Successfully rendered Sequence 4 to: {output_path}")
    else:
        print("Error: sequence_4_outro not implemented yet.")

if __name__ == "__main__":
    test_sequence_4()
