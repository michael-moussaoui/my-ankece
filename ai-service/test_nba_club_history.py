import os
import sys
from processors.nba_renderer import NBAVideoRenderer

# Add current dir to path to import processor
sys.path.append(os.getcwd())

def test_club_history():
    print("--- Testing NBA Club History Sequence ---")
    
    player_data = {
        "firstName": "Ashley",
        "lastName": "Hallman",
        "currentClub": {
            "clubName": "NBA Academy West",
            "logoUrl": "https://upload.wikimedia.org/wikipedia/en/thumb/0/03/National_Basketball_Association_logo.svg/315px-National_Basketball_Association_logo.svg.png" # NBA Logo for test
        },
        "clubHistory": [
            {"clubName": "Sparks Academy", "season": "2023-2024"},
            {"clubName": "Elite Ballers", "season": "2022-2023"},
            {"clubName": "Junior Tigers", "season": "2021-2022"},
            {"clubName": "Rising Stars", "season": "2020-2021"}
        ]
    }
    
    renderer = NBAVideoRenderer()
    
    output_dir = os.path.join(os.getcwd(), "output", "test_renders")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "club_history_test.mp4")
    
    print("Rendering Club History Sequence... This may take a moment.")
    if hasattr(renderer, 'sequence_club_history'):
        clip = renderer.sequence_club_history(player_data)
        clip.write_videofile(output_path, fps=24, codec="libx264", audio=False)
        print(f"Successfully rendered Club History Sequence to: {output_path}")
    else:
        print("Error: sequence_club_history not implemented yet.")

if __name__ == "__main__":
    test_club_history()
