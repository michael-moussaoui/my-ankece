import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                print(f"⚠️ Gemini configuration failed: {str(e)}")
                self.model = None
        else:
            print("⚠️ WARNING: GEMINI_API_KEY not found. Using Smart Template fallback.")
            self.model = None

    def generate_cv_script(self, player_data: dict) -> dict:
        """
        Generates a professional video CV script and narration based on player data.
        """
        if not self.model:
            return self._get_fallback_script(player_data)
        prompt = f"""
        Act as a professional sports video editor and scout. 
        Create a detailed script for a 60-90 second basketball video CV for the following player:
        
        Player Data:
        {json.dumps(player_data, indent=2)}
        
        The script must be in JSON format and include:
        1. "sections": A list of sections (intro, highlights_offensive, stats_summary, highlights_defensive, outro).
        2. Each section must have:
           - "title": Title of thoughts to display.
           - "narration": Professional commentary/narration text.
           - "visual_hints": Suggestions for transitions (fade, zoom, flash) and slow-motion moments.
           - "stats_to_overlay": Specific stats from the player data to show on screen.
        3. "background_music_style": Suggested style (e.g., Aggressive Hip Hop, Cinematic Orchestral).
        4. "color_grading": Suggested vibe (e.g., High contrast, Golden Hour, NBA style).

        Output ONLY the JSON.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Remove markdown code blocks if present
            content = response.text.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            return json.loads(content)
        except Exception as e:
            print(f"❌ Error generating script with Gemini: {str(e)}")
            # Fallback basic script
            return self._get_fallback_script(player_data)

    def _get_fallback_script(self, player_data: dict) -> dict:
        name = f"{player_data.get('firstName')} {player_data.get('lastName')}"
        return {
            "sections": [
                {
                    "title": "INTRODUCTION",
                    "narration": f"Voici le profil de {name}, un joueur talentueux prêt pour le niveau supérieur.",
                    "visual_hints": "Fade in, zoom on photo",
                    "stats_to_overlay": ["firstName", "lastName", "position"]
                },
                {
                    "title": "PLAYER PROFILE",
                    "narration": f"Voici les caractéristiques physiques et les statistiques clés de {name}.",
                    "visual_hints": "Static with animated text overlays",
                    "stats_to_overlay": ["height", "wingspan", "verticalLeap", "dominantHand", "pointsPerGame", "reboundsPerGame", "assistsPerGame"]
                },
                {
                    "title": "OFFENSIVE SKILLS",
                    "narration": "Une menace constante en attaque avec une vision de jeu exceptionnelle.",
                    "visual_hints": "Slow motion on contact, flash transition",
                    "stats_to_overlay": ["pointsPerGame", "fieldGoalPercentage"]
                },
                {
                    "title": "DEFENSIVE ANCHOR",
                    "narration": "Un défenseur acharné qui protège le cercle et provoque des pertes de balles.",
                    "visual_hints": "Slow motion on blocks, zoom on steals",
                    "stats_to_overlay": ["stealsPerGame", "blocksPerGame"]
                },
                {
                    "title": "CLUB HISTORY",
                    "narration": f"Un parcours solide au sein de plusieurs clubs compétitifs.",
                    "visual_hints": "Animated list",
                    "stats_to_overlay": ["clubHistory"]
                },
                {
                    "title": "OUTRO",
                    "narration": f"Contactez {name} dès maintenant pour renforcer votre effectif.",
                    "visual_hints": "Fade out to black",
                    "stats_to_overlay": ["email", "phone"]
                }
            ],
            "background_music_style": "Hip Hop / Energetic",
            "color_grading": "Sleek NBA Style"
        }

gemini_service = GeminiService()
