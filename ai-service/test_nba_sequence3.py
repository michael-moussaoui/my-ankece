import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_sequence_3():
    print("--- Testing NBA Sequence 3 - Highlights ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman"
    }
    
    # Path to the sample video in assets
    video_path = os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "videos", "video_tir_lana.MOV"))
    if not os.path.exists(video_path):
        print(f"Error: Video not found at {video_path}")
        return

    title = "HIGHLIGHTS OFFENSIFS"
    narration = "Une capacité exceptionnelle à créer son propre tir et à finir avec précision, même sous pression. Ashley démontre ici sa maîtrise du fondamentaux et son intelligence de jeu face à une défense agressive."
    
    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "highlights_seq_test.mp4")
    
    print("Rendering Sequence 3... This may take a moment.")
    if hasattr(renderer, 'sequence_3_highlights'):
        clip = renderer.sequence_3_highlights(player_data, video_path, title, narration)
        clip.write_videofile(output_path, fps=24, codec="libx264", audio=True)
        print(f"Successfully rendered Sequence 3 to: {output_path}")
    else:
        print("Error: sequence_3_highlights not implemented yet.")

if __name__ == "__main__":
    test_sequence_3()
