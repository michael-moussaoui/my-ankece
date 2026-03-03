import requests
import logging
import json
import time

logger = logging.getLogger(__name__)

class CapCutExporter:
    def __init__(self, base_url="http://localhost:9001"):
        self.base_url = base_url

    def is_server_running(self):
        try:
            # We can check connectivity by trying to list tools if it were MCP, 
            # but here we check the Flask server from capcut_server.py
            response = requests.get(f"{self.base_url}/", timeout=2)
            return response.status_code == 404 # Flask returns 404 for root usually if not defined
        except:
            return False

    def create_draft(self, width=1080, height=1920):
        try:
            response = requests.post(f"{self.base_url}/create_draft", json={"width": width, "height": height})
            data = response.json()
            if data.get("success"):
                return data["output"]["draft_id"]
            return None
        except Exception as e:
            logger.error(f"Error creating CapCut draft: {e}")
            return None

    def add_video(self, draft_id, video_url, start=0, end=0, target_start=0, track_name="video_main", transition=None, speed=1.0, effect_type=None):
        try:
            payload = {
                "draft_id": draft_id,
                "video_url": video_url,
                "start": start,
                "end": end,
                "target_start": target_start,
                "track_name": track_name,
                "speed": speed
            }
            if transition:
                payload["transition"] = transition
            
            response = requests.post(f"{self.base_url}/add_video", json=payload)
            success = response.json().get("success", False)
            
            if success and effect_type:
                # Add effect if specified
                effect_payload = {
                    "draft_id": draft_id,
                    "effect_type": effect_type,
                    "start": target_start,
                    "end": target_start + 5, # Default duration
                    "track_name": f"effect_{track_name}"
                }
                requests.post(f"{self.base_url}/add_effect", json=effect_payload)
                
            return success
        except Exception as e:
            logger.error(f"Error adding video to CapCut draft: {e}")
            return False

    def add_text(self, draft_id, text, start, end, font_size=32, color="#FFFFFF"):
        try:
            payload = {
                "draft_id": draft_id,
                "text": text,
                "start": start,
                "end": end,
                "font_size": font_size,
                "color": color
            }
            response = requests.post(f"{self.base_url}/add_text", json=payload)
            return response.json().get("success", False)
        except Exception as e:
            logger.error(f"Error adding text to CapCut draft: {e}")
            return False

    def add_effect(self, draft_id, effect_type, start, end, effect_category="scene", track_name=None, params=None):
        try:
            payload = {
                "draft_id": draft_id,
                "effect_type": effect_type,
                "start": start,
                "end": end,
                "effect_category": effect_category
            }
            if track_name:
                payload["track_name"] = track_name
            if params:
                payload["params"] = params
                
            response = requests.post(f"{self.base_url}/add_effect", json=payload)
            return response.json().get("success", False)
        except Exception as e:
            logger.error(f"Error adding effect to CapCut draft: {e}")
            return False

    def save_draft(self, draft_id):
        try:
            response = requests.post(f"{self.base_url}/save_draft", json={"draft_id": draft_id})
            return response.json().get("output", {}).get("draft_url")
        except Exception as e:
            logger.error(f"Error saving CapCut draft: {e}")
            return None

    def export_player_cv(self, player_data):
        """
        Main method to export a full player CV to CapCut.
        """
        if not self.is_server_running():
            logger.error("CapCut API server is not running on localhost:9001")
            return None

        draft_id = self.create_draft()
        if not draft_id:
            return None

        current_time = 0
        
        # 1. Intro Title
        name = f"{player_data.get('firstName', '')} {player_data.get('lastName', '')}"
        self.add_text(draft_id, name, current_time, current_time + 3, font_size=60)
        current_time += 3

        # 2. Add videos (if any)
        videos = [
            ("Presentation", player_data.get('presentationVideoUrl')),
            ("Offense", player_data.get('offensiveVideoUrl')),
            ("Defense", player_data.get('defensiveVideoUrl'))
        ]

        for title, url in videos:
            if url:
                # Add title for the section
                self.add_text(draft_id, title, current_time, current_time + 2)
                # Add the video (assuming we don't know duration, we might need to get it first)
                # But here we just add it
                success = self.add_video(draft_id, url, target_start=current_time)
                if success:
                    # For now we assume a default duration of 10s if we don't have metadata
                    # Real integration would use get_video_duration tool
                    current_time += 10 

        return self.save_draft(draft_id)
