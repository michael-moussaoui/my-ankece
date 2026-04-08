import random

class GamificationEngine:
    def __init__(self):
        # Configuration des paliers XP
        self.xp_config = {
            "base_session": 50,
            "dribble_multiplier": 10,  # XP par dribble par seconde ou palier
            "similarity_bonus": 2.0,   # Multiplicateur pour score > 85%
            "per_make": 20             # XP par shoot réussi
        }
        
        # Définition des Challenges AI "Pro"
        self.challenges = [
            {
                "id": "curry_fire",
                "title": "Curry's Fire 3PT",
                "description": "Atteins une similarité de 85% avec Steph Curry sur 5 tirs primés.",
                "type": "shooting",
                "target_star": "steph_curry",
                "requirements": {"min_similarity": 85, "min_makes": 5},
                "reward_xp": 500
            },
            {
                "id": "kyrie_handles",
                "title": "Kyrie's Secret Handles",
                "description": "Maintiens une fréquence de dribble > 4.5/sec pendant 30 secondes.",
                "type": "dribble",
                "target_star": "kyrie_irving",
                "requirements": {"min_frequency": 4.5, "duration": 30},
                "reward_xp": 350
            },
            {
                "id": "klay_precision",
                "title": "Klay's Perfect Form",
                "description": "Angle de release entre 45° et 55° pendant 10 shoots de suite.",
                "type": "shooting",
                "target_star": "klay_thompson",
                "requirements": {"min_angle": 45, "max_angle": 55, "streak": 10},
                "reward_xp": 450
            },
            {
                "id": "dribble_workout_ia",
                "title": "Dribble Workout IA",
                "description": "Enchaîne 50 dribbles avec au moins 3 crossovers et 2 entre-jambes à haute vitesse.",
                "type": "dribble",
                "target_star": "kyrie_irving",
                "requirements": {
                    "min_dribbles": 50,
                    "min_moves": ["Crossover", "Between Legs"],
                    "min_speed_bpm": 150
                },
                "reward_xp": 600
            }
        ]

    def calculate_xp(self, session_data, mode):
        """Calcule l'XP gagnée en fin de session."""
        xp = self.xp_config["base_session"]
        
        if mode == "shooting":
            makes = session_data.get("makes", 0)
            accuracy = session_data.get("accuracy", 0)
            xp += (makes * self.xp_config["per_make"])
            if accuracy > 80:
                xp *= 1.5
                
        elif mode == "dribble":
            count = session_data.get("dribble_count", 0)
            freq = session_data.get("frequency", 0)
            xp += (count * 2)
            if freq > 4.0:
                xp *= 1.3

        return int(xp)

    def check_challenge_completion(self, challenge_id, session_results):
        """Vérifie si un challenge spécifique a été complété."""
        challenge = next((c for c in self.challenges if c["id"] == challenge_id), None)
        if not challenge:
            return False, 0

        reqs = challenge["requirements"]
        is_completed = False
        
        if challenge["type"] == "shooting":
            sim = session_results.get("similarity", 0)
            makes = session_results.get("makes", 0)
            if sim >= reqs.get("min_similarity", 0) and makes >= reqs.get("min_makes", 0):
                is_completed = True
        
        elif challenge["type"] == "dribble":
            freq = session_results.get("frequency", 0)
            if freq >= reqs.get("min_frequency", 0):
                is_completed = True

        return is_completed, challenge["reward_xp"] if is_completed else 0

    def get_active_challenges(self, user_stats=None):
        """Retourne la liste des challenges disponibles."""
        return self.challenges

gamification_engine = GamificationEngine()
