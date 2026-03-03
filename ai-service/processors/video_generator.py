import os
import json
import logging
import textwrap
import requests
import time as time_lib
from tempfile import NamedTemporaryFile
from moviepy.editor import VideoFileClip, ImageClip, CompositeVideoClip, ColorClip, concatenate_videoclips, vfx, AudioFileClip
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from pillow_heif import register_heif_opener

register_heif_opener()

logger = logging.getLogger(__name__)

class VideoGenerator:
    def __init__(self, output_dir="output/cv_videos"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.width = 1280
        self.height = 720
        self.fps = 24
        
        # Premium Palette
        self.COLORS = {
            'bg_dark': (15, 15, 18),      # Very dark charcoal
            'bg_card': (28, 28, 32),     # Slightly lighter card color
            'accent': (255, 140, 0),     # Professional Orange (Dark Orange)
            'text_main': (255, 255, 255), # White
            'text_secondary': (180, 180, 190) # Muted grey
        }
        
        # Safety Margins (Scaled for 720p)
        self.margin_x = 100
        self.margin_y = 60
        self.safe_width = self.width - (2 * self.margin_x)

        # Try to find a system font
        self.font_path = self._find_font()

    def _find_font(self):
        """Finds a valid font file on the system."""
        potential_fonts = [
            "C:/Windows/Fonts/arialbd.ttf",  
            "C:/Windows/Fonts/arial.ttf",    
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 
            "/System/Library/Fonts/Helvetica.ttc",
        ]
        for f in potential_fonts:
            if os.path.exists(f):
                return f
        return None  

    def _text_to_clip(self, text, fontsize=70, color=(255, 255, 255), duration=3, width_limit=None, align='center'):
        """
        Creates a MoviePy ImageClip from text using Pillow with smart wrapping.
        """
        limit = width_limit or self.safe_width
        
        # Estimate characters per line (rough approximation based on Arial-like fonts)
        char_width_estimate = fontsize * 0.55
        chars_per_line = max(1, int(limit / char_width_estimate))
        
        wrapped_lines = textwrap.wrap(text, width=chars_per_line)
        wrapped_text = "\n".join(wrapped_lines)

        try:
            font = ImageFont.truetype(self.font_path, fontsize) if self.font_path else ImageFont.load_default()
        except:
            font = ImageFont.load_default()

        # Calculate image size needed for wrapped text
        dummy_img = Image.new('RGBA', (1, 1))
        dummy_draw = ImageDraw.Draw(dummy_img)
        
        try:
            bbox = dummy_draw.multiline_textbbox((0, 0), wrapped_text, font=font, align=align)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
        except AttributeError:
            text_w, text_h = dummy_draw.multiline_textsize(wrapped_text, font=font)

        padding = 20
        img_w = int(text_w + padding * 2)
        img_h = int(text_h + padding * 2)

        img = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.multiline_text((padding, padding), wrapped_text, font=font, fill=color, align=align)
        
        img_array = np.array(img)
        return ImageClip(img_array).set_duration(duration)

    def _download_file(self, url):
        """Downloads a file from a URL to a temporary local path."""
        if not url: return None
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            ext = os.path.splitext(url.split('?')[0])[1] or '.tmp'
            tmp = NamedTemporaryFile(delete=False, suffix=ext)
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            tmp.close()
            return tmp.name
        except Exception as e:
            logger.error(f"❌ Failed to download {url}: {e}")
            return None

    def generate_cv(self, player_data: dict, script: dict) -> str:
        """Main pipeline to assemble the video CV."""
        temp_files = []
        try:
            player_name = f"{player_data.get('firstName', '')} {player_data.get('lastName', '')}"
            logger.info(f"🎬 Refining video CV for {player_name}...")

            # Download media
            photo_path = self._download_file(player_data.get('profilePhotoUrl'))
            off_vid_path = self._download_file(player_data.get('offensiveVideoUrl'))
            def_vid_path = self._download_file(player_data.get('defensiveVideoUrl'))
            
            if photo_path: temp_files.append(photo_path)
            if off_vid_path: temp_files.append(off_vid_path)
            if def_vid_path: temp_files.append(def_vid_path)

            clips = []
            
            # 1. Intro Section (with Photo)
            intro_clip = self._create_intro(player_data, photo_path)
            clips.append(intro_clip)

            # 2. Dynamic Sections
            for section in script.get('sections', [])[1:-1]:
                title_upper = section.get('title', '').upper()
                if "OFFENSIVE" in title_upper or "HIGHLIGHTS" in title_upper:
                    clip = self._process_highlights(section, off_vid_path)
                elif "DEFENSIVE" in title_upper:
                    clip = self._process_highlights(section, def_vid_path)
                elif "PROFILE" in title_upper or "STATS" in title_upper:
                    clip = self._create_stats_overlay(player_data)
                elif "HISTORY" in title_upper or "PARCOURS" in title_upper:
                    clip = self._create_history_overlay(player_data)
                else:
                    clip = self._create_stats_overlay(player_data)
                
                if clip:
                    clips.append(clip)

            # 3. Outro Section
            outro_clip = self._create_outro(player_data)
            clips.append(outro_clip)

            # Build final composition
            final_composition = concatenate_videoclips(clips, method="compose")

            # Output path
            filename = f"CV_{player_data.get('lastName', 'Player')}_{int(time_lib.time())}.mp4"
            output_path = os.path.join(self.output_dir, filename)
            
            final_composition.write_videofile(
                output_path, 
                fps=self.fps, 
                codec="libx264", 
                audio_codec="aac",
                temp_audiofile='temp-audio.m4a', 
                remove_temp=True,
                verbose=False,
                logger=None,
                threads=4,
                preset='ultrafast'
            )
            
            return output_path

        except Exception as e:
            logger.error(f"❌ Professional video refinement failed: {str(e)}")
            raise
        finally:
            # Cleanup temp files
            for f in temp_files:
                if os.path.exists(f):
                    try: os.remove(f)
                    except: pass

    def _create_intro(self, player_data, photo_path=None):
        """Elegant pro intro with player photo."""
        duration = 5
        bg = ColorClip(size=(self.width, self.height), color=self.COLORS['bg_dark'], duration=duration)
        elements = [bg]

        if photo_path:
            try:
                photo = ImageClip(photo_path).set_duration(duration)
                # Resize and position photo (e.g., right side or background fade)
                photo = photo.resize(height=self.height * 0.9)
                photo = photo.set_position(('right', 'center')).crossfadein(1)
                elements.append(photo)
            except Exception as e:
                logger.error(f"Error adding photo to intro: {e}")

        first_name = self._text_to_clip(
            player_data.get('firstName', '').upper(),
            fontsize=50, color=self.COLORS['text_secondary'], duration=duration
        ).set_position((100, 280)).set_start(0.5).crossfadein(0.5)
        
        last_name = self._text_to_clip(
            player_data.get('lastName', '').upper(),
            fontsize=100, color=self.COLORS['accent'], duration=duration
        ).set_position((100, 330)).set_start(0.7).crossfadein(0.5)
        
        pos_text = self._text_to_clip(
            player_data.get('position', '').upper(),
            fontsize=35, color=self.COLORS['text_main'], duration=duration
        ).set_position((100, 480)).set_start(1.2).crossfadein(0.5)

        elements.extend([first_name, last_name, pos_text])
        return CompositeVideoClip(elements)

    def _process_highlights(self, section, video_path=None):
        """Highlights slide with actual player video."""
        duration = 6
        if video_path:
            try:
                # Load video, resize to fit or fill
                clip = VideoFileClip(video_path).subclip(0, duration)
                clip = clip.resize(width=self.width)
                if clip.h > self.height:
                    clip = clip.crop(y1=(clip.h-self.height)//2, y2=(clip.h+self.height)//2)
                
                # Add a dark overlay for text readability
                overlay = ColorClip(size=(self.width, self.height), color=(0,0,0), duration=duration).set_opacity(0.4)
                
                title = self._text_to_clip(section.get('title', '').upper(), fontsize=45, color=self.COLORS['accent'], duration=duration).set_position(('center', 60))
                narration = self._text_to_clip(section.get('narration', ''), fontsize=28, color=(255,255,255), duration=duration, width_limit=self.width*0.8).set_position(('center', 'bottom'))
                
                return CompositeVideoClip([clip, overlay, title, narration])
            except Exception as e:
                logger.error(f"Error processing highlight video: {e}")

        # Fallback to color background if video fails
        bg = ColorClip(size=(self.width, self.height), color=self.COLORS['bg_dark'], duration=duration)
        title = self._text_to_clip(section.get('title', '').upper(), fontsize=90, color=self.COLORS['accent'], duration=duration).set_position(('center', 150))
        narration = self._text_to_clip(section.get('narration', ''), fontsize=45, color=self.COLORS['text_main'], duration=duration, width_limit=self.width*0.7).set_position(('center', 500))
        return CompositeVideoClip([bg, title, narration])

    def _create_stats_overlay(self, player_data):
        """Clean stats grid slide with more player info."""
        duration = 5
        bg = ColorClip(size=(self.width, self.height), color=self.COLORS['bg_dark'], duration=duration)
        
        title = self._text_to_clip("PLAYER PROFILE & STATS", fontsize=40, color=self.COLORS['text_secondary'], duration=duration).set_position(('center', 60))
        
        # Club & Age Info
        club = player_data.get('currentClub', {})
        club_name = club.get('clubName', 'Free Agent') if isinstance(club, dict) else 'Free Agent'
        bio_info = f"{player_data.get('age')} YEARS OLD   |   {club_name.upper()}"
        bio_text = self._text_to_clip(bio_info, fontsize=30, color=self.COLORS['text_main'], duration=duration).set_position(('center', 160))
 
        stats = player_data.get('stats', {}) or {}
        pts = stats.get('pointsPerGame', 0)
        reb = stats.get('reboundsPerGame', 0)
        ast = stats.get('assistsPerGame', 0)
        
        stats_line = f"PTS: {pts}   |   REB: {reb}   |   AST: {ast}"
        main_stats = self._text_to_clip(stats_line, fontsize=70, color=self.COLORS['accent'], duration=duration).set_position('center')
        
        physical = f"HEIGHT: {player_data.get('height', 'N/A')}cm  |  WINGSPAN: {player_data.get('wingspan', 'N/A')}cm"
        v_leap = player_data.get('verticalLeap')
        if v_leap:
            physical += f"  |  VERTICAL: {v_leap}cm"
        phys_text = self._text_to_clip(physical, fontsize=28, color=self.COLORS['text_secondary'], duration=duration).set_position(('center', 500))
        
        # Add Strengths
        strengths = player_data.get('strengths', [])
        if strengths:
            str_line = "STRENGTHS: " + ", ".join(strengths).upper()
            str_clip = self._text_to_clip(str_line, fontsize=25, color=self.COLORS['text_main'], duration=duration).set_position(('center', 600))
            return CompositeVideoClip([bg, title, bio_text, main_stats, phys_text, str_clip])
        
        return CompositeVideoClip([bg, title, bio_text, main_stats, phys_text])
 
    def _create_history_overlay(self, player_data):
        """Displays player's club history."""
        duration = 5
        bg = ColorClip(size=(self.width, self.height), color=self.COLORS['bg_dark'], duration=duration)
        title = self._text_to_clip("CLUB HISTORY", fontsize=40, color=self.COLORS['text_secondary'], duration=duration).set_position(('center', 60))
        
        history = player_data.get('clubHistory', [])
        lines = []
        # Show last 4 entries
        for h in history[:4]:
            if isinstance(h, dict):
                club_name = h.get('clubName', 'N/A')
                season = h.get('season', 'N/A')
                lines.append(f"{season} : {club_name.upper()}")
        
        history_text = "\n\n".join(lines) if lines else "FREE AGENT / NO HISTORY"
        content = self._text_to_clip(history_text, fontsize=35, color=self.COLORS['text_main'], duration=duration).set_position('center')
        
        return CompositeVideoClip([bg, title, content])

    def _create_outro(self, player_data):
        """Premium contact outro."""
        duration = 4
        bg = ColorClip(size=(self.width, self.height), color=(0, 0, 0), duration=duration)
        
        title = self._text_to_clip("AVAILABLE NOW", fontsize=28, color=self.COLORS['text_secondary'], duration=duration).set_position(('center', 230))
        
        email = self._text_to_clip(player_data.get('email', 'N/A'), fontsize=45, color=self.COLORS['text_main'], duration=duration).set_position(('center', 300))
        phone = self._text_to_clip(player_data.get('phone', ''), fontsize=40, color=self.COLORS['accent'], duration=duration).set_position(('center', 370))
        
        return CompositeVideoClip([bg, title, email, phone])


video_generator = VideoGenerator()

