import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_presentation():
    print("--- Testing NBA Presentation Sequence ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman"
    }
    
    # Using the same test video for now as a placeholder for the discourse
    video_path = os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "videos", "video_tir_lana.MOV"))
    if not os.path.exists(video_path):
        print(f"Error: Video not found at {video_path}")
        return

    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "presentation_seq_test.mp4")
    
    print("Rendering Presentation Sequence... This may take a moment.")
    if hasattr(renderer, 'sequence_presentation'):
        clip = renderer.sequence_presentation(player_data, video_path)
        clip.write_videofile(output_path, fps=24, codec="libx264", audio=True)
        print(f"Successfully rendered Presentation Sequence to: {output_path}")
    else:
        print("Error: sequence_presentation not implemented yet.")

if __name__ == "__main__":
    test_presentation()
