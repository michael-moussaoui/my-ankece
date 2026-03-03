import logging
import asyncio
from typing import Dict, Any
from cv_schemas import CVTier
from processors.capcut_exporter import CapCutExporter

logger = logging.getLogger(__name__)

class VideoCVOrchestrator:
    def __init__(self):
        self.capcut = CapCutExporter()
        # self.unity = UnityExporter() # Coming soon

    async def generate_cv(self, player_data: Dict[str, Any]):
        tier = player_data.get('tier', CVTier.ESSENTIEL.value)
        logger.info(f"[ORCHESTRATOR] Orchestrating CV for tier: {tier}")

        if tier == CVTier.ESSENTIEL:
            return await self._generate_essentiel(player_data)
        elif tier == CVTier.PRO:
            return await self._generate_pro(player_data)
        elif tier == CVTier.ELITE:
            return await self._generate_elite(player_data)
        else:
            logger.warning(f"Unknown tier {tier}, falling back to ESSENTIEL")
            return await self._generate_essentiel(player_data)

    async def _generate_essentiel(self, data):
        """
        Tier ESSENTIEL: CapCut-only, simple transitions, basic text.
        """
        logger.info("[ORCHESTRATOR] Generating ESSENTIEL CV via CapCut")
        draft_id = self.capcut.create_draft()
        if not draft_id: return None

        # 1. Intro Title
        name = f"{data.get('firstName', '')} {data.get('lastName', '')}"
        self.capcut.add_text(draft_id, name, 0, 3, font_size=50)
        
        current_time = 3
        
        # 2. Add Offensive Highlights
        off_urls = data.get('offensiveVideoUrls', [])
        if off_urls:
            self.capcut.add_text(draft_id, "Offense", current_time, current_time + 2)
            for url in off_urls:
                if self.capcut.add_video(draft_id, url, target_start=current_time, transition="fade"):
                    current_time += 8

        # 3. Add Defensive Highlights
        def_urls = data.get('defensiveVideoUrls', [])
        if def_urls:
            self.capcut.add_text(draft_id, "Defense", current_time, current_time + 2)
            for url in def_urls:
                if self.capcut.add_video(draft_id, url, target_start=current_time, transition="fade"):
                    current_time += 8
        
        # 4. Presentation (optional in Essentiel)
        pres_url = data.get('presentationVideoUrl')
        if pres_url:
            if self.capcut.add_video(draft_id, pres_url, target_start=current_time, transition="fade"):
                current_time += 10

        # 5. Summary AI Insights (Last slide)
        insights = data.get('ai_insights', [])
        if insights:
            self.capcut.add_text(draft_id, "ANALYSIS", current_time, current_time + 2, font_size=40)
            y_offset = 0
            for insight in insights[:3]: # Limit to top 3
                self.capcut.add_text(draft_id, f"• {insight}", current_time + 1, current_time + 5, font_size=24)
                current_time += 1.5

        return self.capcut.save_draft(draft_id)

    async def _generate_pro(self, data):
        """
        Tier PRO: CapCut Advanced, Speed ramp, Glitch effects, Overlays, Player Stats.
        """
        logger.info("[ORCHESTRATOR] Generating PRO CV via CapCut")
        draft_id = self.capcut.create_draft()
        if not draft_id: return None

        color = data.get('primaryColor', "#FF8C00")
        accent = data.get('accentColor', "#FFFFFF")
        name = f"{data.get('firstName', '')} {data.get('lastName', '')}".upper()
        
        # 1. Intro with Pro style
        self.capcut.add_text(draft_id, name, 0, 4, font_size=70, color=color)
        sub_intro = f"{data.get('position', '').upper()} | {data.get('height', '')}CM"
        if data.get('currentClub'):
            sub_intro += f" | {data['currentClub'].get('clubName', '').upper()}"
        self.capcut.add_text(draft_id, sub_intro, 1.5, 4, font_size=35)
        
        current_time = 4
        
        # 2. Presentation Video (Direct intro to the player)
        pres_url = data.get('presentationVideoUrl')
        if pres_url:
            self.capcut.add_text(draft_id, "PLAYER PROFILE", current_time, current_time + 2, color=color)
            if self.capcut.add_video(draft_id, pres_url, target_start=current_time, transition="zoom"):
                current_time += 10 # Base duration for presentation

        # 3. Stats Section
        stats = data.get('stats', {})
        if stats:
            stats_text = f"PTS: {stats.get('pointsPerGame', 0)} | REB: {stats.get('reboundsPerGame', 0)} | AST: {stats.get('assistsPerGame', 0)}"
            self.capcut.add_text(draft_id, stats_text, current_time, current_time + 5, color=accent, font_size=40)

        # 4. Offensive Highlights (Loop)
        off_urls = data.get('offensiveVideoUrls', [])
        if off_urls:
            self.capcut.add_text(draft_id, "OFFENSIVE ELITE", current_time, current_time + 2, color=color)
            for url in off_urls:
                if self.capcut.add_video(draft_id, url, target_start=current_time, transition="glitch", speed=1.1):
                    current_time += 7

        # 5. Defensive Highlights (Loop)
        def_urls = data.get('defensiveVideoUrls', [])
        if def_urls:
            self.capcut.add_text(draft_id, "DEFENSIVE WALL", current_time, current_time + 2, color=color)
            for url in def_urls:
                if self.capcut.add_video(draft_id, url, target_start=current_time, transition="zoom", speed=1.0):
                    current_time += 7

        # 6. Conclusion / Contact
        self.capcut.add_text(draft_id, "SCOUT ME", current_time, current_time + 5, color=color, font_size=60)
        
        # 7. Dynamic AI Overlays (Pro style)
        insights = data.get('ai_insights', [])
        if insights:
            # Spread insights over the video
            insight_time = 5
            for insight in insights[:4]:
                self.capcut.add_text(draft_id, insight.upper(), insight_time, insight_time + 3, color=accent, font_size=30)
                insight_time += 10

        contact_info = []
        if data.get('instagram'): contact_info.append(f"IG: {data['instagram']}")
        if data.get('email'): contact_info.append(data['email'])
        if contact_info:
            self.capcut.add_text(draft_id, " | ".join(contact_info), current_time + 1, current_time + 5, font_size=30)

        return self.capcut.save_draft(draft_id)

    async def _generate_elite(self, data):
        """
        Tier ELITE: Unity (3D Intro mockup) + CapCut (Ultra Cinematic with VFX).
        """
        logger.info("[ORCHESTRATOR] Generating ELITE CV (NBA Cinematic Experience)")
        draft_id = self.capcut.create_draft()
        if not draft_id: return None

        color = data.get('primaryColor', "#FF4500") # Brighter orange for elite
        accent = data.get('accentColor', "#FFD700") # Gold accent
        name = f"{data.get('firstName', '')} {data.get('lastName', '')}".upper()
        
        # 1. Cinematic Intro
        self.capcut.add_text(draft_id, name, 0, 5, font_size=80, color=color)
        self.capcut.add_effect(draft_id, "Edge_Glow", 0, 5) # Elite Glow
        self.capcut.add_effect(draft_id, "Gleam", 1, 4) # Sparkle effect
        
        sub_intro = f"THE NEXT NBA STAR | {data.get('position', '').upper()}"
        self.capcut.add_text(draft_id, sub_intro, 2, 5, font_size=40, color=accent)
        
        current_time = 5
        
        # 2. Presentation with Background Blur / Mirror
        pres_url = data.get('presentationVideoUrl')
        if pres_url:
            self.capcut.add_text(draft_id, "MEET THE PLAYER", current_time, current_time + 2, color=accent)
            if self.capcut.add_video(draft_id, pres_url, target_start=current_time, transition="zoom"):
                self.capcut.add_effect(draft_id, "Chromatic", current_time, current_time + 10)
                current_time += 10

        # 3. Stats Dashboard (Elite Style)
        stats = data.get('stats', {})
        if stats:
            self.capcut.add_text(draft_id, "STAT LEADERS", current_time, current_time + 5, color=color, font_size=50)
            stats_y = ["PTS", "REB", "AST", "STL", "BLK"]
            for i, s_key in enumerate(stats_y):
                val = stats.get(f"{s_key.lower()}PerGame", 0)
                self.capcut.add_text(draft_id, f"{s_key}: {val}", current_time + 1 + (i*0.5), current_time + 5, font_size=35)
            current_time += 5

        # 4. Offensive Highlights with Lightning/Fire
        off_urls = data.get('offensiveVideoUrls', [])
        if off_urls:
            self.capcut.add_text(draft_id, "UNSTOPPABLE OFFENSE", current_time, current_time + 2, color=color)
            for url in off_urls:
                if self.capcut.add_video(draft_id, url, target_start=current_time, transition="glitch", speed=1.2):
                    self.capcut.add_effect(draft_id, "Lightning", current_time + 2, current_time + 5) # Shock moment
                    current_time += 7

        # 5. AI Insights Overlays (Elite typewriter-like or floating)
        insights = data.get('ai_insights', [])
        if insights:
            for i, insight in enumerate(insights[:5]):
                start_t = 10 + (i * 8)
                self.capcut.add_text(draft_id, f"AI ANALYSIS: {insight.upper()}", start_t, start_t + 4, color=accent, font_size=32)
                self.capcut.add_effect(draft_id, "Shockwave", start_t, start_t + 1)

        # 6. Outro contact
        self.capcut.add_text(draft_id, "CONTACT AGENT", current_time, current_time + 6, color=color, font_size=70)
        self.capcut.add_effect(draft_id, "White_Flash", current_time, current_time + 0.5)
        
        if data.get('instagram'):
            self.capcut.add_text(draft_id, f"IG: @{data['instagram']}", current_time + 1.5, current_time + 6, font_size=40)

        return self.capcut.save_draft(draft_id)
