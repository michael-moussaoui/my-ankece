import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_sequence_2():
    print("--- Testing NBA Sequence 2 - Stats & Profile ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman",
        "age": 18,
        "position": "Meneuse (PG)",
        "height": 175,
        "wingspan": 182,
        "verticalLeap": 65,
        "dominantHand": "Droitier",
        "strengths": ["Shooter d'élite", "Vison de jeu", "Défense sur l'homme"],
        "currentClub": {
            "clubName": "NBA Academy",
            "category": "Elite",
            "league": "International",
            "number": "6",
            "season": "2024-2025"
        },
        "stats": {
            "pointsPerGame": 18.5,
            "reboundsPerGame": 4.2,
            "assistsPerGame": 7.8,
            "stealsPerGame": 2.1,
            "blocksPerGame": 0.4,
            "fieldGoalPercentage": 45.5,
            "threePointPercentage": 38.2,
            "freeThrowPercentage": 88.0,
            "gamesPlayed": 24,
            "minutesPerGame": 32.5
        }
    }
    
    # Sequence 2 doesn't necessarily need a photo, but we might want a background or a cutout
    photo_path = os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "images", "IMG_0584.JPG"))
    
    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "stats_seq_test.mp4")
    
    print("Rendering Sequence 2 (10s)... This may take a moment.")
    if hasattr(renderer, 'sequence_2_stats'):
        clip = renderer.sequence_2_stats(player_data)
        clip.write_videofile(output_path, fps=24, codec="libx264", audio=False)
        print(f"Successfully rendered Sequence 2 to: {output_path}")
    else:
        print("Error: sequence_2_stats not implemented yet.")

if __name__ == "__main__":
    test_sequence_2()
