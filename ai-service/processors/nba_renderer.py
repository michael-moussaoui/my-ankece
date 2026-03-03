import os
import time
import io
import textwrap
import numpy as np
from moviepy.editor import *
from moviepy.video.fx.all import *
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
from pillow_heif import register_heif_opener
try:
    import rembg
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

register_heif_opener()

class NBAVideoRenderer:
    """
    Module 1: High-end NBA-style video CV renderer.
    Uses PIL for text rendering to avoid ImageMagick dependencies.
    """
    def __init__(self, width=1080, height=1920, primary=None, accent=None):
        self.width = width
        self.height = height
        self.fps = 24
        self.COLORS = {
            'bg_dark': (15, 15, 20),
            'accent_gold': self._hex_to_rgb(accent) if accent else (255, 215, 0),
            'primary': self._hex_to_rgb(primary) if primary else (220, 30, 50), # Default to red if none
            'accent_blue': (0, 85, 164),
            'text_main': (255, 255, 255),
            'holographic_shine': (255, 255, 255, 120) 
        }
        # Backward compatibility / aliases
        if primary: self.COLORS['accent_red'] = self.COLORS['primary']
        else: self.COLORS['accent_red'] = (220, 30, 50)
        # Try to find a nice font
        self.font_path = "C:/Windows/Fonts/arialbd.ttf" if os.path.exists("C:/Windows/Fonts/arialbd.ttf") else None
        self.font_path_main = "C:/Windows/Fonts/impact.ttf" if os.path.exists("C:/Windows/Fonts/impact.ttf") else self.font_path
        self.font_path_script = "C:/Windows/Fonts/segoesc.ttf" if os.path.exists("C:/Windows/Fonts/segoesc.ttf") else self.font_path

    def _hex_to_rgb(self, hex_color):
        """Converts hex string (#RRGGBB) to RGB tuple."""
        if not hex_color: return (255, 255, 255)
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _text_to_surface(self, text, fontsize=60, color=(255, 255, 255), font_type='bold'):
        """Renders text to a PIL image and converts to MoviePy clip."""
        font_p = self.font_path_main if font_type == 'impact' else self.font_path
        if not font_p:
            # Fallback to default PIL font if none found
            font = ImageFont.load_default()
        else:
            font = ImageFont.truetype(font_p, fontsize)
        
        # Calculate size
        temp_img = Image.new('RGBA', (self.width, 200), (0, 0, 0, 0))
        draw = ImageDraw.Draw(temp_img)
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        
        img = Image.new('RGBA', (w + 20, h + 20), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), text, font=font, fill=color)
        
        return ImageClip(np.array(img))

    def _multiline_text_to_surface(self, text, fontsize=40, color=(255, 255, 255), width_limit=800, font_type='bold', align='center'):
        """Renders multiline text to a PIL image and converts to MoviePy ImageClip."""
        font_p = self.font_path_main if font_type == 'impact' else self.font_path
        font = ImageFont.truetype(font_p, fontsize) if font_p else ImageFont.load_default()
        
        # Wrap text
        char_width = fontsize * 0.5
        chars_per_line = max(1, int(width_limit / char_width))
        wrapped_lines = textwrap.wrap(text, width=chars_per_line)
        wrapped_text = "\n".join(wrapped_lines)
        
        # Calculate size
        temp_img = Image.new('RGBA', (self.width, 1000), (0, 0, 0, 0))
        draw = ImageDraw.Draw(temp_img)
        bbox = draw.multiline_textbbox((0, 0), wrapped_text, font=font, align=align)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        
        img = Image.new('RGBA', (int(w + 40), int(h + 40)), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.multiline_text((20, 20), wrapped_text, font=font, fill=color, align=align)
        
        return ImageClip(np.array(img))

    def sequence_3_highlights(self, player_data, video_path, title="HIGHLIGHTS", narration=""):
        """
        SÉQUENCE 3 — Vidéo Highlights (Durée de la vidéo)
        Intègre une vidéo avec des superpositions texte et branding.
        """
        # Load video
        base_clip = VideoFileClip(video_path)
        
        # Standardize duration to something sensible if it's too long, or keep it
        # Let's say we cap it at 8 seconds for the demo
        duration = min(base_clip.duration, 8)
        base_clip = base_clip.subclip(0, duration)
        
        # Resize and Center Crop
        # Goal: vertical 1080x1920
        aspect = base_clip.w / base_clip.h
        if aspect > (self.width / self.height): # Wider than target
            base_clip = base_clip.resize(height=self.height)
            x_center = base_clip.w / 2
            base_clip = base_clip.crop(x_center=x_center, width=self.width)
        else: # Taller than target
            base_clip = base_clip.resize(width=self.width)
            y_center = base_clip.h / 2
            base_clip = base_clip.crop(y_center=y_center, height=self.height)

        # 1. OVERLAYS
        # Top Header Overlay
        header_h = 250
        header_bg = ColorClip(size=(self.width, header_h), color=(0, 0, 0)).set_opacity(0.6).set_duration(duration)
        header_bg = header_bg.set_position(('center', 'top'))
        
        # Footer Narration Overlay
        footer_h = 400
        footer_bg = ColorClip(size=(self.width, footer_h), color=(0, 0, 0)).set_opacity(0.6).set_duration(duration)
        footer_bg = footer_bg.set_position(('center', 'bottom'))

        # 2. TEXTS
        title_clip = self._text_to_surface(title.upper(), fontsize=70, color=self.COLORS['accent_gold'], font_type='impact')
        title_clip = title_clip.set_duration(duration).set_position(('center', 80))
        
        narration_clip = self._multiline_text_to_surface(narration, fontsize=45, width_limit=self.width - 200)
        narration_clip = narration_clip.set_duration(duration).set_position(('center', self.height - 350))

        # 3. BRANDING
        font_small = ImageFont.truetype(self.font_path, 35) if self.font_path else ImageFont.load_default()
        vert_surf = Image.new("RGBA", (800, 60), (0, 0, 0, 0))
        v_draw = ImageDraw.Draw(vert_surf)
        v_draw.text((0, 0), "FFBB - CHAMPIONNAT DE FRANCE", font=font_small, fill=(255, 255, 255, 120))
        vert_surf = vert_surf.rotate(90, expand=True)
        branding_clip = ImageClip(np.array(vert_surf)).set_duration(duration).set_position((20, 'center'))

        # Combine
        return CompositeVideoClip([base_clip, header_bg, footer_bg, title_clip, narration_clip, branding_clip])

    def sequence_presentation(self, player_data, video_path):
        """
        SÉQUENCE 4 — Présentation du Joueur (Discours)
        Vidéo face caméra du joueur avec son nom en overlay.
        """
        # Load video
        base_clip = VideoFileClip(video_path)
        duration = base_clip.duration
        
        # Resize and Center Crop for vertical format
        aspect = base_clip.w / base_clip.h
        if aspect > (self.width / self.height):
            base_clip = base_clip.resize(height=self.height)
            base_clip = base_clip.crop(x_center=base_clip.w / 2, width=self.width)
        else:
            base_clip = base_clip.resize(width=self.width)
            base_clip = base_clip.crop(y_center=base_clip.h / 2, height=self.height)

        # 1. NAME OVERLAY (Bottom)
        player_name = f"{player_data.get('firstName', '')} {player_data.get('lastName', '')}".upper()
        name_bg = ColorClip(size=(self.width, 150), color=(0, 0, 0)).set_opacity(0.7).set_duration(duration)
        name_bg = name_bg.set_position(('center', self.height - 300))
        
        name_clip = self._text_to_surface(player_name, fontsize=60, color=(255, 255, 255), font_type='impact')
        name_clip = name_clip.set_duration(duration).set_position(('center', self.height - 275))
        
        # 2. TITLE OVERLAY (Top)
        title_text = "MESSAGE DU JOUEUR"
        title_clip = self._text_to_surface(title_text, fontsize=40, color=self.COLORS['accent_gold'], font_type='bold')
        title_clip = title_clip.set_duration(duration).set_position(('center', 100))

        # 3. BRANDING
        font_small = ImageFont.truetype(self.font_path, 35) if self.font_path else ImageFont.load_default()
        vert_surf = Image.new("RGBA", (800, 60), (0, 0, 0, 0))
        v_draw = ImageDraw.Draw(vert_surf)
        v_draw.text((0, 0), "FFBB - CHAMPIONNAT DE FRANCE", font=font_small, fill=(255, 255, 255, 120))
        vert_surf = vert_surf.rotate(90, expand=True)
        branding_clip = ImageClip(np.array(vert_surf)).set_duration(duration).set_position((20, 'center'))

        return CompositeVideoClip([base_clip, name_bg, name_clip, title_clip, branding_clip])

    def sequence_4_outro(self, player_data):
        """
        SÉQUENCE 4 — Outro & Contact (5 sec)
        Conclusion premium avec CTA et coordonnées.
        """
        duration = 5
        
        # Prepare fonts
        font_cta = ImageFont.truetype(self.font_path_main, 90) if self.font_path_main else ImageFont.load_default()
        font_contact = ImageFont.truetype(self.font_path_main, 50) if self.font_path_main else ImageFont.load_default()
        font_small = ImageFont.truetype(self.font_path, 35) if self.font_path else ImageFont.load_default()
        font_script = ImageFont.truetype(self.font_path_script, 60) if self.font_path_script else ImageFont.load_default()

        def make_frame(t):
            # 1. Background (Coherent Dark Theme)
            frame = Image.new("RGBA", (self.width, self.height), (20, 20, 25, 255))
            draw = ImageDraw.Draw(frame)
            
            # Subtle Geometric Accents
            draw.polygon([(0, 0), (self.width, 0), (self.width, 400)], fill=(40, 30, 60, 150))
            draw.polygon([(0, self.height), (self.width, self.height), (0, self.height - 400)], fill=(30, 40, 60, 100))

            # 2. CTA Text (Animate In)
            cta_text = "READY FOR THE NEXT LEVEL"
            alpha = int(min(255, max(0, t * 400)))
            t_bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
            draw.text(((self.width - (t_bbox[2] - t_bbox[0])) // 2, 400), cta_text, font=font_cta, fill=(255, 255, 255, alpha))

            # 3. CONTACT INFO
            contact_y = 700
            spacing = 100
            
            contacts = [
                ("EMAIL", player_data.get('email', 'N/A')),
                ("PHONE", player_data.get('phone', 'N/A')),
                ("INSTA", player_data.get('instagram', 'N/A'))
            ]
            
            for i, (label, val) in enumerate(contacts):
                # Cascade Animation
                c_alpha = int(min(255, max(0, (t - 0.5 - i*0.4) * 500)))
                # Label (Gold)
                draw.text((self.width // 2 - 400, contact_y + i * spacing), f"{label}:", font=font_contact, fill=(255, 140, 0, c_alpha))
                # Value (White)
                draw.text((self.width // 2 - 150, contact_y + i * spacing), val, font=font_contact, fill=(255, 255, 255, c_alpha))

            # 4. FINAL BRANDING / LOGOS
            b_alpha = int(min(200, max(0, (t - 2.5) * 300)))
            draw.text((self.width // 2 - 200, 1300), "ANKECE AI", font=font_cta, fill=(255, 255, 255, b_alpha))
            draw.text((self.width // 2 - 150, 1420), "OFFICIAL VIDEO CV", font=font_small, fill=(200, 200, 220, b_alpha))
            
            # 5. FFBB VERTICAL LABEL
            draw.text((100, self.height - 100), "FFBB - CHAMPIONNAT DE FRANCE 2025", font=font_small, fill=(255, 255, 255, 120))

            # Apply final fade out
            if t > duration - 1:
                fade = int(255 * (duration - t))
                overlay = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 255 - fade))
                frame.alpha_composite(overlay)

            return np.array(frame.convert("RGB")).astype('uint8')

        return VideoClip(make_frame, duration=duration)

    def _create_ken_burns(self, image_path, duration=10):
        """Creates an animated zoom and slight rotation effect."""
        # Load image via PIL to handle HEIC or other formats safely
        pil_img = Image.open(image_path).convert("RGB")
        
        # Resize to fit height while maintaining aspect ratio
        aspect = pil_img.width / pil_img.height
        new_h = self.height
        new_w = int(new_h * aspect)
        pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        base_clip = ImageClip(np.array(pil_img)).set_duration(duration)
        
        # Define zoom/rotation function
        def make_frame(t):
            scale = 1.0 + 0.15 * (t / duration) # 15% zoom
            rotation = 1.5 * (t / duration) # 1.5 deg rotation
            
            # Using basic Pillow for rendering frame by frame
            img_frame = Image.fromarray(base_clip.get_frame(0)) # Always start from base frame
            w, h = img_frame.size
            img_frame = img_frame.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)
            img_frame = img_frame.rotate(rotation)
            
            # Center crop to original size
            nw, nh = img_frame.size
            left = (nw - self.width) // 2
            top = (nh - self.height) // 2
            img_frame = img_frame.crop((left, top, left + self.width, top + self.height))
            
            return np.array(img_frame.convert("RGB")).astype('uint8')

        return VideoClip(make_frame, duration=duration)

    def _create_holographic_shine(self, duration=10):
        """Creates a moving white sweep effect."""
        shine_width = 300
        shine = ColorClip(size=(shine_width, self.height * 2), color=(255, 255, 255), duration=duration)
        shine = shine.rotate(25).set_opacity(0.3)
        
        # Animate from left to right
        shine = shine.set_position(lambda t: (self.width * 2 * (t / duration) - self.width, 'center'))
        return shine

    def _create_typewriter_step(self, lines, total_duration=10):
        """Renders typewriter text frame by frame for smoothness."""
        per_char_time = 0.04
        start_y = 1350
        line_spacing = 80
        
        def make_frame(t):
            # Create a blank transparent surface
            surface = Image.new('RGBA', (self.width, self.height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(surface)
            
            elapsed_chars = int(t / per_char_time)
            chars_poured = 0
            
            for i, line in enumerate(lines):
                if chars_poured >= elapsed_chars: break
                
                # How much of this line to show?
                chars_in_line = len(line)
                show_upto = min(chars_in_line, elapsed_chars - chars_poured)
                text_to_draw = line[:show_upto]
                
                font = ImageFont.truetype(self.font_path_main, 70 if i == 0 else 50)
                bbox = draw.textbbox((0, 0), text_to_draw, font=font)
                w = bbox[2] - bbox[0]
                
                draw.text(((self.width - w) // 2, start_y + i * line_spacing), 
                          text_to_draw, font=font, fill=(255, 255, 255))
                
                chars_poured += chars_in_line
                if show_upto < chars_in_line: break # Still typing this line
            
            return np.array(surface)

        return VideoClip(make_frame, duration=total_duration).set_mask(
            VideoClip(lambda t: make_frame(t)[:,:,3] / 255.0, duration=total_duration, ismask=True)
        )

    def sequence_1_intro(self, player_data, photo_path):
        """
        SÉQUENCE 1 — Intro (10 sec)
        Style "Ashley Hallman" Poster avec détourage et flou.
        """
        duration = 10
        
        # 1. DETOURAGE (Background Removal)
        try:
            if REMBG_AVAILABLE:
                with open(photo_path, 'rb') as i:
                    input_image = i.read()
                    output_image = remove(input_image)
                pil_photo = Image.open(io.BytesIO(output_image)).convert("RGBA")
            else:
                raise ImportError("rembg not available")
        except Exception as e:
            print(f"Rembg failed or not ready: {e}. Falling back to standard image.")
            pil_photo = Image.open(photo_path).convert("RGBA")
        
        # Prepare fonts
        font_huge = ImageFont.truetype(self.font_path_main, 280) if self.font_path_main else ImageFont.load_default()
        font_name_vertical = ImageFont.truetype(self.font_path_main, 200) if self.font_path_main else ImageFont.load_default()
        font_first_name = ImageFont.truetype(self.font_path_main, 100) if self.font_path_main else ImageFont.load_default()
        font_details = ImageFont.truetype(self.font_path, 60) if self.font_path else ImageFont.load_default()
        font_small = ImageFont.truetype(self.font_path, 40) if self.font_path else ImageFont.load_default()

        # Data extraction
        first_name = player_data.get('firstName', '').upper()
        last_name = player_data.get('lastName', '').upper()
        
        current_club = player_data.get('currentClub', {})
        if not isinstance(current_club, dict): current_club = {}
        
        number = current_club.get('number') or player_data.get('number', '00')
        season_raw = current_club.get('season') or player_data.get('season', '2025')
        season_year = season_raw.split('-')[-1] if '-' in str(season_raw) else season_raw
        class_of = f"C/O {season_year}"
        position = player_data.get('position', '').upper()

        def make_frame(t):
            # 1. Base Textured Dark Gray Background
            frame = Image.new("RGBA", (self.width, self.height), (35, 35, 40, 255))
            draw = ImageDraw.Draw(frame)
            
            # Subtle purple texture/accents
            draw.polygon([(0, 0), (600, 0), (0, 600)], fill=(60, 20, 100, 100)) # Top Left
            draw.polygon([(self.width, 1400), (self.width-500, self.height), (self.width, self.height)], fill=(50, 20, 110, 80)) # Bottom Right

            # 2. Layer 1: BACK PLAYER (Blurred + Desaturated)
            bg_scale = 1.3 + 0.05 * (t / duration)
            bg_h = int(self.height * 0.9 * bg_scale)
            aspect = pil_photo.width / pil_photo.height
            bg_w = int(bg_h * aspect)
            back_photo = pil_photo.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
            
            # Blur and Lower Opacity
            back_photo = back_photo.filter(ImageFilter.GaussianBlur(radius=10))
            alpha = back_photo.getchannel('A')
            alpha = alpha.point(lambda p: p * 0.3) # 30% opacity
            back_photo.putalpha(alpha)
            
            frame.paste(back_photo, ((self.width - bg_w) // 2, 50), back_photo)

            # 3. VERTICAL LAST NAME (Right Side)
            # Create a vertical name surface
            v_chars = list(last_name)
            v_text = "\n".join(v_chars)
            # We'll use a rotated Impact text for the "HALLMAN" look
            v_surf = Image.new("RGBA", (1800, 400), (0, 0, 0, 0))
            v_draw = ImageDraw.Draw(v_surf)
            # Spacing between letters for vertical look
            spaced_name = "  ".join(v_chars)
            v_draw.text((0, 0), spaced_name, font=font_name_vertical, fill=(255, 255, 255, 200)) # Semi-transparent white
            v_surf = v_surf.rotate(90, expand=True)
            # Paste on the right edge
            frame.alpha_composite(v_surf, (self.width - 320, (self.height - v_surf.height) // 2))

            # 4. Layer 2: FRONT PLAYER (Sharp + Zoom)
            fg_scale = 0.85 + 0.1 * (t / duration)
            target_h = int(self.height * 0.75 * fg_scale)
            target_w = int(target_h * aspect)
            front_photo = pil_photo.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            fx = (self.width - front_photo.width) // 2
            fy = self.height - front_photo.height - 150 # Positioned near bottom
            frame.paste(front_photo, (fx, fy), front_photo)

            # 5. TYPOGRAPHY
            # Large Number Top-Left
            draw.text((80, 80), f"#{number}", font=font_huge, fill=(255, 255, 255, 255))
            
            # Profile Bottom-Left
            info_y = 1550
            draw.text((80, info_y), first_name, font=font_first_name, fill=(255, 255, 255, 255))
            draw.text((80, info_y + 110), class_of, font=font_details, fill=(255, 255, 255, 255))
            draw.text((80, info_y + 180), position, font=font_details, fill=(255, 255, 255, 255))

            # Branding Bottom-Right
            draw.text((self.width - 320, 1800), "2025", font=font_small, fill=(255, 255, 255, 150))
            draw.text((self.width - 320, 1850), "1st Edition", font=font_small, fill=(255, 255, 255, 150))
            
            # Vertical FFBB Branding (Faded on the left)
            ffbb_surf = Image.new("RGBA", (800, 60), (0, 0, 0, 0))
            ffbb_draw = ImageDraw.Draw(ffbb_surf)
            ffbb_draw.text((0, 0), "FFBB - CHAMPIONNAT DE FRANCE", font=font_small, fill=(255, 255, 255, 80))
            ffbb_surf = ffbb_surf.rotate(90, expand=True)
            frame.alpha_composite(ffbb_surf, (20, (self.height - ffbb_surf.height) // 2))

            return np.array(frame.convert("RGB")).astype('uint8')

        return VideoClip(make_frame, duration=duration)

    def sequence_2_stats(self, player_data):
        """
        SÉQUENCE 2 — Profil & Statistiques (10 sec)
        Dashboard moderne avec stats et caractéristiques physiques.
        """
        duration = 10
        
        # Prepare fonts
        font_title = ImageFont.truetype(self.font_path_main, 80) if self.font_path_main else ImageFont.load_default()
        font_label = ImageFont.truetype(self.font_path_main, 50) if self.font_path_main else ImageFont.load_default()
        font_value = ImageFont.truetype(self.font_path_main, 100) if self.font_path_main else ImageFont.load_default()
        font_detail = ImageFont.truetype(self.font_path, 45) if self.font_path else ImageFont.load_default()
        font_small = ImageFont.truetype(self.font_path, 35) if self.font_path else ImageFont.load_default()
        font_strength = ImageFont.truetype(self.font_path_script, 50) if self.font_path_script else ImageFont.load_default()

        # Data extraction
        stats = player_data.get('stats', {}) or {}
        strengths = player_data.get('strengths', [])
        
        def make_frame(t):
            # 1. Base Textured Background (Same as Seq 1)
            frame = Image.new("RGBA", (self.width, self.height), (30, 30, 35, 255))
            draw = ImageDraw.Draw(frame)
            
            # Geometric accents
            draw.polygon([(0, 0), (self.width, 0), (0, 300)], fill=(40, 40, 50, 200)) # Top header area
            draw.polygon([(0, self.height), (self.width, self.height), (self.width, self.height - 200)], fill=(60, 20, 100, 100)) # Bottom footer area

            # 2. HEADER
            title_text = "PLAYER PROFILE & STATISTICS"
            t_bbox = draw.textbbox((0, 0), title_text, font=font_title)
            draw.text(((self.width - (t_bbox[2] - t_bbox[0])) // 2, 80), title_text, font=font_title, fill=(255, 255, 255, 255))
            
            # Subtle line under title
            draw.rectangle([100, 180, self.width - 100, 184], fill=(255, 255, 255, 100))

            # 3. PHYSICAL PROFILE (Left Column)
            px = 120
            py_start = 300
            spacing = 180
            
            phys_data = [
                ("HEIGHT", f"{player_data.get('height', 'N/A')} CM"),
                ("WINGSPAN", f"{player_data.get('wingspan', 'N/A')} CM"),
                ("VERTICAL", f"{player_data.get('verticalLeap', 'N/A')} CM"),
                ("HAND", f"{player_data.get('dominantHand', 'N/A')}")
            ]
            
            for i, (label, value) in enumerate(phys_data):
                # Animate in
                alpha = int(min(255, max(0, (t - 0.5 - i*0.3) * 500)))
                draw.text((px, py_start + i * spacing), label, font=font_label, fill=(200, 200, 220, alpha))
                draw.text((px, py_start + i * spacing + 60), value, font=font_value, fill=(255, 255, 255, alpha))

            # 4. STATISTICS GRID (Right Column)
            sx = self.width // 2 + 50
            sy_start = 300
            grid_spacing_x = 220
            grid_spacing_y = 220
            
            stat_items = [
                ("PTS", stats.get('pointsPerGame', 0)),
                ("REB", stats.get('reboundsPerGame', 0)),
                ("AST", stats.get('assistsPerGame', 0)),
                ("STL", stats.get('stealsPerGame', 0)),
                ("BLK", stats.get('blocksPerGame', 0)),
                ("FG%", f"{stats.get('fieldGoalPercentage', 0)}%"),
                ("3P%", f"{stats.get('threePointPercentage', 0)}%"),
                ("FT%", f"{stats.get('freeThrowPercentage', 0)}%")
            ]
            
            for i, (label, value) in enumerate(stat_items):
                row = i // 2
                col = i % 2
                
                # Animate in with delay
                alpha = int(min(255, max(0, (t - 1.5 - i*0.2) * 500)))
                
                ix = sx + col * grid_spacing_x
                iy = sy_start + row * grid_spacing_y
                
                # Box background for stat
                draw.rounded_rectangle([ix - 20, iy - 10, ix + grid_spacing_x - 40, iy + 160], radius=10, fill=(45, 45, 55, alpha // 2))
                
                draw.text((ix, iy), label, font=font_detail, fill=(255, 140, 0, alpha)) # Accent Orange
                draw.text((ix, iy + 60), str(value), font=font_label, fill=(255, 255, 255, alpha))

            # 5. STRENGTHS (Bottom Section)
            if strengths:
                strike_y = 1350
                alpha = int(min(255, max(0, (t - 4.0) * 500)))
                draw.text((120, strike_y), "PRIMARY STRENGTHS", font=font_label, fill=(200, 200, 220, alpha))
                
                for i, s in enumerate(strengths[:3]):
                    sa = int(min(255, max(0, (t - 4.5 - i*0.5) * 500)))
                    draw.text((150 + i * 400, strike_y + 80), f"* {s}", font=font_strength, fill=(255, 255, 255, sa))

            # 6. FOOTER BRANDING
            f_alpha = int(min(150, max(0, (t - 1.0) * 100)))
            draw.text((100, self.height - 100), "FFBB - CHAMPIONNAT DE FRANCE", font=font_small, fill=(255, 255, 255, f_alpha))
            draw.text((self.width - 300, self.height - 100), "PREMIUM EDITION", font=font_small, fill=(255, 255, 255, f_alpha))

            return np.array(frame.convert("RGB")).astype('uint8')

        return VideoClip(make_frame, duration=duration)

    def sequence_club_history(self, player_data):
        """
        SÉQUENCE 3 — Historique des Clubs (6 sec)
        Affiche le logo du club actuel et la liste des clubs précédents.
        """
        duration = 6
        
        # Prepare fonts
        font_title = ImageFont.truetype(self.font_path_main, 70) if self.font_path_main else ImageFont.load_default()
        font_club = ImageFont.truetype(self.font_path_main, 50) if self.font_path_main else ImageFont.load_default()
        font_season = ImageFont.truetype(self.font_path, 40) if self.font_path else ImageFont.load_default()
        font_small = ImageFont.truetype(self.font_path, 35) if self.font_path else ImageFont.load_default()

        # Logo handling (Current Club)
        current_club = player_data.get('currentClub', {})
        club_name = current_club.get('clubName', 'N/A')
        club_logo_url = current_club.get('logoUrl') # Hypothetical URL
        
        pil_logo = None
        if club_logo_url:
            try:
                import requests
                from io import BytesIO
                response = requests.get(club_logo_url, timeout=5)
                pil_logo = Image.open(BytesIO(response.content)).convert("RGBA")
            except Exception as e:
                print(f"Failed to download club logo: {e}")

        def make_frame(t):
            # 1. Background
            frame = Image.new("RGBA", (self.width, self.height), (25, 25, 30, 255))
            draw = ImageDraw.Draw(frame)
            
            # Geometric accents
            draw.polygon([(0, 0), (self.width, 0), (self.width, 300)], fill=(50, 50, 70, 150))
            
            # 2. HEADER
            title_text = "CLUB HISTORY"
            t_bbox = draw.textbbox((0, 0), title_text, font=font_title)
            draw.text(((self.width - (t_bbox[2] - t_bbox[0])) // 2, 100), title_text, font=font_title, fill=(255, 255, 255, 255))

            # 3. CURRENT CLUB LOGO & NAME
            # Large logo area
            logo_y = 350
            if pil_logo:
                # Resize keeping aspect ratio
                l_width = 400
                w_ratio = l_width / pil_logo.width
                l_height = int(pil_logo.height * w_ratio)
                res_logo = pil_logo.resize((l_width, l_height))
                
                # Animate in (zoom/fade)
                l_alpha = int(min(255, max(0, t * 500)))
                temp_logo = Image.new("RGBA", res_logo.size, (0,0,0,0))
                temp_logo.paste(res_logo, (0,0))
                
                frame.paste(res_logo, ((self.width - l_width) // 2, logo_y), res_logo)
            
            # Current Club Name
            alpha = int(min(255, max(0, (t - 0.5) * 400)))
            c_text = club_name.upper()
            c_bbox = draw.textbbox((0, 0), c_text, font=font_club)
            draw.text(((self.width - (c_bbox[2] - c_bbox[0])) // 2, logo_y + 450), c_text, font=font_club, fill=self.COLORS['primary'] + (alpha,))
            draw.text(((self.width - 250) // 2, logo_y + 510), "CURRENT CLUB", font=font_small, fill=(200, 200, 220, alpha))

            # 4. PREVIOUS CLUBS LIST
            history = player_data.get('clubHistory', [])
            list_y = 1100
            spacing = 150
            
            for i, entry in enumerate(history[:4]): # Show last 4 previous clubs
                h_alpha = int(min(255, max(0, (t - 1.5 - i*0.4) * 400)))
                h_club = entry.get('clubName', 'N/A').upper()
                h_season = entry.get('season', 'N/A')
                
                # Draw list bullet/icon
                draw.ellipse([150, list_y + i * spacing + 10, 170, list_y + i * spacing + 30], fill=(255, 255, 255, h_alpha))
                # Club Name
                draw.text((200, list_y + i * spacing), h_club, font=font_club, fill=(255, 255, 255, h_alpha))
                # Season
                draw.text((200, list_y + i * spacing + 60), h_season, font=font_season, fill=(180, 180, 200, h_alpha))

            # 5. BRANDING
            f_alpha = int(min(150, max(0, (t - 1.0) * 100)))
            draw.text((100, self.height - 100), "FFBB - CHAMPIONNAT DE FRANCE", font=font_small, fill=(255, 255, 255, f_alpha))

            return np.array(frame.convert("RGB")).astype('uint8')

        return VideoClip(make_frame, duration=duration)

    def assemble_full_cv(self, player_data, highlights_videos, presentation_video=None, output_path="final_video_cv.mp4", cancel_check=None):
        """
        Assemble toutes les séquences en un seul Video CV professionnel.
        - highlights_videos: liste de dictionnaires [{'path': '...', 'title': '...', 'narration': '...'}]
        - cancel_check: fonction optionnelle retournant True si la génération doit s'arrêter
        """
        if cancel_check and cancel_check(): return None

        transition_type = player_data.get('transitionType', 'fade')
        transition_duration = 0.5 # Default transition duration
        
        clips = []
        
        # Helper to add clip with optional cancellation check
        def add_clip(clip):
            if cancel_check and cancel_check(): return False
            if clip: clips.append(clip)
            return True

        # 1. Intro
        photo_path = player_data.get('profilePhotoLocalPath')
        if photo_path and os.path.exists(photo_path):
            if not add_clip(self.sequence_1_intro(player_data, photo_path)): return None
        
        # 2. Stats
        if not add_clip(self.sequence_2_stats(player_data)): return None

        # 2.5 Club History
        if not add_clip(self.sequence_club_history(player_data)): return None
        
        # 3. Highlights
        for h in highlights_videos:
            if os.path.exists(h['path']):
                if not add_clip(self.sequence_3_highlights(player_data, h['path'], h.get('title', 'HIGHLIGHTS'), h.get('narration', ''))): return None
        
        # 4. Presentation
        if presentation_video and os.path.exists(presentation_video):
            if not add_clip(self.sequence_presentation(player_data, presentation_video)): return None
            
        # 5. Outro
        if not add_clip(self.sequence_4_outro(player_data)): return None
        
        if cancel_check and cancel_check(): return None

        # Apply transitions
        processed_clips = []
        for i, clip in enumerate(clips):
            if i > 0:
                if transition_type == 'fade':
                    clip = clip.crossfadein(transition_duration)
                elif transition_type == 'zoom':
                    # Simplified zoom transition: fade + initial scale if possible (complex in moviepy for multiple clips)
                    clip = clip.crossfadein(transition_duration)
            processed_clips.append(clip)

        # Concatenate everything
        # Use method="compose" to handle different sizes/transitions correctly
        final_video = concatenate_videoclips(processed_clips, method="compose", padding=-transition_duration if transition_type != 'none' else 0)
        
        # Final cancellation check before export
        if cancel_check and cancel_check(): return None

        # Export
        final_video.write_videofile(output_path, fps=24, codec="libx264", audio=True, threads=4, preset='ultrafast', logger=None)
        return output_path

if __name__ == "__main__":
    # Internal Render Test
    renderer = NBAVideoRenderer()
    print("NBA Renderer Initialized.")
