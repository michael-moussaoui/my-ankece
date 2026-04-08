import os
import sys

# CRITICAL: Add current dir to path BEFORE importing local modules
sys.path.append(os.getcwd())

print("--- Script Started ---")

import time
from processors.nba_renderer import NBAVideoRenderer

def test_tier_rendering(tier_name):
    print(f"\n--- Testing NBA Video CV Assembly for Tier: {tier_name.upper()} ---")
    
    player_data = {
        "firstName": "Lana",
        "lastName": "Jordan",
        "email": "lana.jordan@example.com",
        "phone": "+33 6 00 00 00 00",
        "instagram": "@lana_hoops",
        "age": 17,
        "position": "Point Guard",
        "height": 170,
        "wingspan": 175,
        "verticalLeap": 60,
        "dominantHand": "Right",
        "strengths": ["Fast Break", "3pt Specialist", "Playmaking"],
        "tier": tier_name,
        "primaryColor": "#D3122A" if tier_name == "pro" else "#00E5FF" if tier_name == "elite" else "#FF8C00",
        "accentColor": "#FFFFFF",
        "currentClub": {
            "clubName": "Ankece Academy",
            "category": "U18 Elite",
            "league": "French Championship",
            "number": "23",
            "season": "2024-2025"
        },
        "clubHistory": [
            {"clubName": "Paris Basket", "season": "2023"},
            {"clubName": "Lyon Basket", "season": "2022"}
        ],
        "achievements": [
            {"title": "League MVP", "year": "2024", "competition": "Championship U18"},
            {"title": "3pt Contest Winner", "year": "2023", "competition": "All-Star Game"}
        ],
        "ai_insights": [
            "Elite peripheral vision detected",
            "Shot release speed: 0.4s (pro tier)",
            "High defensive rotation efficiency"
        ],
        "stats": {
            "pointsPerGame": 22.4,
            "reboundsPerGame": 5.1,
            "assistsPerGame": 8.2,
            "stealsPerGame": 3.4,
            "blocksPerGame": 0.5,
            "fieldGoalPercentage": 48.2,
            "threePointPercentage": 41.5,
            "freeThrowPercentage": 91.0
        },
        "profilePhotoLocalPath": os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "images", "IMG_0584.JPG"))
    }
    
    # Media paths
    video_clip_path = os.path.abspath(os.path.join(os.getcwd(), "..", "assets", "videos", "video_tir_lana.MOV"))
    
    # Use only one highlight for faster testing
    highlights = [
        {
            "path": video_clip_path,
            "title": "ELITE PERFORMANCE",
            "narration": f"Dynamic impact on the court by {player_data['lastName']}."
        }
    ]
    
    presentation_v = video_clip_path 
    
    renderer = NBAVideoRenderer(
        primary=player_data["primaryColor"],
        accent=player_data["accentColor"]
    )
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"cv_test_{tier_name}.mp4")
    
    print(f"Rendu en cours pour le tier {tier_name}...")
    start_time = time.time()
    
    final_path = renderer.assemble_full_cv(player_data, highlights, presentation_v, output_path)
    
    if final_path:
        print(f"✅ Succès! Vidéo générée en {int(time.time() - start_time)}s : {final_path}")
    else:
        print(f"❌ Échec du rendu pour le tier {tier_name}.")

if __name__ == "__main__":
    # Test only ELITE first as it's the most complex
    test_tier_rendering("elite")
