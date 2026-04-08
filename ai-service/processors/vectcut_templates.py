import requests
import json
import logging

logger = logging.getLogger(__name__)

class VectCutClient:
    def __init__(self, base_url="http://localhost:9001"):
        self.base_url = base_url

    def _post(self, endpoint, data):
        try:
            response = requests.post(f"{self.base_url}/{endpoint}", json=data)
            return response.json()
        except Exception as e:
            logger.error(f"VectCutAPI Error on {endpoint}: {e}")
            return {"success": False, "error": str(e)}

    def capcut_create_draft(self, width=1080, height=1920, fps=60):
        res = self._post("create_draft", {"width": width, "height": height})
        if res.get("success"):
            return res["output"]["draft_id"]
        return None

    def capcut_add_video(self, draft_id, video_url, start=0, end=None, target_start=0, track_name="main", volume=1.0, speed=1.0, width=1080, height=1920):
        data = {
            "draft_id": draft_id,
            "video_url": video_url,
            "start": start,
            "target_start": target_start,
            "track_name": track_name,
            "volume": volume,
            "speed": speed,
            "width": width,
            "height": height
        }
        if end is not None:
            data["end"] = end
        return self._post("add_video", data)

    def capcut_add_keyframe(self, draft_id, track_name, property_types, times, values):
        return self._post("add_video_keyframe", {
            "draft_id": draft_id,
            "track_name": track_name,
            "property_types": property_types,
            "times": times,
            "values": values
        })

    def capcut_add_text(self, draft_id, text, start, end, font_size=30, font_color="#FFFFFF", animation=None, shadow_enabled=False, shadow_color="#000000", track_name="text_main", transform_y=0, transform_x=0):
        data = {
            "draft_id": draft_id,
            "text": text,
            "start": start,
            "end": end,
            "font_size": font_size,
            "font_color": font_color,
            "track_name": track_name,
            "transform_y": transform_y,
            "transform_x": transform_x
        }
        if animation:
            data["intro_animation"] = animation
        if shadow_enabled:
            data["shadow_enabled"] = True
            data["shadow_color"] = shadow_color
        return self._post("add_text", data)

    def capcut_add_audio(self, draft_id, audio_url, start=0, end=None, target_start=0, volume=1.0, track_name="audio_main"):
        data = {
            "draft_id": draft_id,
            "audio_url": audio_url,
            "start": start,
            "target_start": target_start,
            "volume": volume,
            "track_name": track_name
        }
        if end is not None:
            data["end"] = end
        return self._post("add_audio", data)

    def capcut_add_effect(self, draft_id, effect_name, start, end, track_name=None):
        return self._post("add_effect", {
            "draft_id": draft_id,
            "effect_type": effect_name,
            "start": start,
            "end": end,
            "track_name": track_name or f"effect_{effect_name}"
        })

    def capcut_add_transition(self, draft_id, transition_type, duration=0.5, track_name="main"):
        # Transitions are handled via add_video in capcut_server during initial add
        pass

    def capcut_save_draft(self, draft_id):
        res = self._post("save_draft", {"draft_id": draft_id})
        if res.get("success"):
            return res["output"].get("draft_url")
        return None

class ClassicNBATemplate:
    def __init__(self, client: VectCutClient):
        self.api = client

    def generate(self, data):
        draft_id = self.api.capcut_create_draft(fps=60)
        if not draft_id: return None

        profile_photo = data.get('profilePhotoLocalPath') or data.get('profilePhotoUrl')
        if profile_photo:
            self.api.capcut_add_video(draft_id, profile_photo, start=0, target_start=0, end=10, track_name="main")
            self.api.capcut_add_keyframe(draft_id, "main", ["scale_x", "scale_y"], [0, 10], ["1.0", "1.15"])
            self.api.capcut_add_keyframe(draft_id, "main", ["rotation_y"], [0, 5, 10], ["-5", "0", "5"])
            self.api.capcut_add_effect(draft_id, "holographic_glow", 0, 10)
            self.api.capcut_add_effect(draft_id, "light_leak", 0, 10)
            self.api.capcut_add_effect(draft_id, "golden_particles", 0, 10)

        name = f"{data.get('firstName', '')} {data.get('lastName', '')}".upper()
        self.api.capcut_add_text(draft_id, name, 1.0, 10, animation="typewriter", transform_y=0.4)
        details = f"{data.get('height', '')}CM | {data.get('position', '')}".upper()
        self.api.capcut_add_text(draft_id, details, 2.2, 10, animation="typewriter", transform_y=0.5, font_size=25)

        # Stats section
        stats = data.get('stats', {})
        pts = stats.get('pointsPerGame', 0)
        self.api.capcut_add_effect(draft_id, "White_Flash", 10, 10.3)
        self.api.capcut_add_text(draft_id, f"PTS: {pts}", 10, 20, transform_y=-0.2)

        # Highlights logic here... simplified for now
        off_urls = data.get('offensiveVideoUrls', [])
        for i, url in enumerate(off_urls[:2]):
            start_t = 30 + (i * 5)
            self.api.capcut_add_video(draft_id, url, target_start=start_t, track_name=f"off_{i}")
            self.api.capcut_add_keyframe(draft_id, f"off_{i}", ["speed"], [0, 1.5, 3.0, 4.5], ["1.5", "0.3", "0.3", "1.5"])
            self.api.capcut_add_effect(draft_id, "motion_blur", start_t + 1.5, start_t + 4.5)

        return self.api.capcut_save_draft(draft_id)

class NeonCityTemplate:
    def __init__(self, client: VectCutClient):
        self.api = client

    def generate(self, data):
        draft_id = self.api.capcut_create_draft(fps=60)
        if not draft_id: return None

        profile_photo = data.get('profilePhotoLocalPath') or data.get('profilePhotoUrl')
        if profile_photo:
            self.api.capcut_add_video(draft_id, profile_photo, start=0, target_start=0, end=10)
            self.api.capcut_add_effect(draft_id, "chromatic_aberration", 0, 10)
            self.api.capcut_add_effect(draft_id, "neon_glow_cyan", 0, 10)

        name = f"{data.get('firstName', '')} {data.get('lastName', '')}".upper()
        self.api.capcut_add_text(draft_id, name, 1.0, 10, font_color="#00FFFF")

        return self.api.capcut_save_draft(draft_id)

class FireModeTemplate:
    def __init__(self, client: VectCutClient):
        self.api = client

    def generate(self, data):
        draft_id = self.api.capcut_create_draft(fps=60)
        if not draft_id: return None

        profile_photo = data.get('profilePhotoLocalPath') or data.get('profilePhotoUrl')
        if profile_photo:
            self.api.capcut_add_video(draft_id, profile_photo, start=0, target_start=0, end=10)
            self.api.capcut_add_effect(draft_id, "fire_particles", 0, 10)

        name = f"{data.get('firstName', '')} {data.get('lastName', '')}".upper()
        self.api.capcut_add_text(draft_id, name, 1.0, 10, font_color="#FF8C00")

        return self.api.capcut_save_draft(draft_id)
