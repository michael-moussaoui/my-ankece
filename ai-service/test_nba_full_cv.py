import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_full_cv():
    print("--- Testing NBA Full Video CV Assembly ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman",
        "email": "ashley.hallman@example.com",
        "phone": "+33 6 12 34 56 78",
        "instagram": "@ashley_baller",
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
        },
        "profilePhotoLocalPath": os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "images", "IMG_0584.JPG"))
    }
    
    # Media paths
    video_clip_path = os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "videos", "video_tir_lana.MOV"))
    
    highlights = [
        {
            "path": video_clip_path,
            "title": "HIGHLIGHTS OFFENSIFS",
            "narration": "Une capacité de finition remarquable aux abords du cercle."
        },
        {
            "path": video_clip_path,
            "title": "HIGHLIGHTS DÉFENSIFS",
            "narration": "Une lecture de jeu défensive qui étouffe l'adversaire."
        }
    ]
    
    presentation_v = video_clip_path # Using the same for demo
    
    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "full_video_cv_test.mp4")
    
    print("Assembling Full CV... This will take a few minutes as it renders all sequences.")
    
    if hasattr(renderer, 'assemble_full_cv'):
        renderer.assemble_full_cv(player_data, highlights, presentation_v, output_path)
        print(f"Successfully generated FULL Video CV to: {output_path}")
    else:
        print("Error: assemble_full_cv not implemented.")

if __name__ == "__main__":
    test_full_cv()
