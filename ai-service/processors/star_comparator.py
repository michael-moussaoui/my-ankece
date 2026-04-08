import numpy as np
from processors.gemini_service import gemini_service

class StarComparator:
    def __init__(self):
        # Base de données des "Gabarits" NBA (Modèles de référence)
        self.star_profiles = {
            "steph_curry": {
                "name": "Steph Curry",
                "metrics": {
                    "release_angle": 52.0,
                    "knee_bend_angle": 110.0,
                    "elbow_angle_at_release": 165.0,
                    "follow_through": 95.0,
                    "shot_arc": "high"
                },
                "tips": "Vise une trajectoire haute avec un release rapide au sommet de ton saut."
            },
            "klay_thompson": {
                "name": "Klay Thompson",
                "metrics": {
                    "release_angle": 48.0,
                    "knee_bend_angle": 120.0,
                    "elbow_angle_at_release": 170.0,
                    "follow_through": 98.0,
                    "shot_arc": "optimal"
                },
                "tips": "Focus sur l'alignement parfait du coude et des hanches avant le shoot."
            },
            "kyrie_irving": {
                "name": "Kyrie Irving",
                "metrics": {
                    "dribble_freq": 4.5,
                    "dribble_consistency": 0.95,
                    "avg_height": 0.4,
                    "move_affinity": ["crossover", "behind_back", "between_legs"]
                },
                "tips": "Garde tes dribbles bas et explosifs, utilise des changements de direction imprévisibles."
            }
        }

    def compare_shot(self, user_metrics, star_id="steph_curry"):
        """Compare user shot biomechanics with an NBA star."""
        if star_id not in self.star_profiles:
            star_id = "steph_curry"
        
        star = self.star_profiles[star_id]
        star_metrics = star["metrics"]
        
        # Scoring Logic
        scores = {}
        
        # 1. Release Angle Score (Delta 5° = -20pts)
        release_diff = abs(user_metrics.get("release_angle", 0) - star_metrics["release_angle"])
        scores["release_similarity"] = max(0, 100 - (release_diff * 4))
        
        # 2. Knee Bend Score
        knee_diff = abs(user_metrics.get("knee_bend_angle", 180) - star_metrics["knee_bend_angle"])
        scores["knee_similarity"] = max(0, 100 - (knee_diff * 2))
        
        # 3. Follow-through Score
        ft_diff = abs(user_metrics.get("follow_through_score", 0) - star_metrics["follow_through"])
        scores["follow_through_similarity"] = max(0, 100 - (ft_diff * 1))

        # Overall Similarity
        overall = (scores["release_similarity"] * 0.5) + (scores["knee_similarity"] * 0.3) + (scores["follow_through_similarity"] * 0.2)
        
        # Expert Coaching via Gemini
        comparison_summary = {
            "user_metrics": user_metrics,
            "star_metrics": star_metrics,
            "overall_similarity": overall,
            "star_name": star["name"]
        }
        expert_advice = gemini_service.generate_coaching_advice(comparison_summary, mode="shooting")

        return {
            "star_name": star["name"],
            "overall_similarity": round(overall, 1),
            "breakdown": scores,
            "pro_tip": expert_advice or star["tips"]
        }

    def compare_dribble(self, user_metrics, star_id="kyrie_irving"):
        """Compare user dribble performance with an NBA star."""
        if star_id not in self.star_profiles:
            star_id = "kyrie_irving"
            
        star = self.star_profiles[star_id]
        star_metrics = star["metrics"]
        
        freq_similarity = min(100, (user_metrics.get("frequency", 0) / star_metrics["dribble_freq"]) * 100)
        consistency_similarity = user_metrics.get("consistency", 0) * 100
        
        overall = (freq_similarity * 0.6) + (consistency_similarity * 0.4)

        # Expert Coaching via Gemini
        comparison_summary = {
            "user_metrics": user_metrics,
            "star_metrics": star_metrics,
            "overall_similarity": overall,
            "star_name": star["name"]
        }
        expert_advice = gemini_service.generate_coaching_advice(comparison_summary, mode="dribbling")
        
        return {
            "star_name": star["name"],
            "overall_similarity": round(overall, 1),
            "metrics_comparison": {
                "user_freq": user_metrics.get("frequency"),
                "star_freq": star_metrics["dribble_freq"],
                "user_consistency": user_metrics.get("consistency")
            },
            "pro_tip": expert_advice or star["tips"]
        }

star_comparator = StarComparator()
