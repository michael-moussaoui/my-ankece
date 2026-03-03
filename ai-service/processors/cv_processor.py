import time
import os
import logging
import requests
from tempfile import NamedTemporaryFile
from processors.nba_renderer import NBAVideoRenderer
from processors.capcut_exporter import CapCutExporter
from processors.orchestrator import VideoCVOrchestrator

logger = logging.getLogger(__name__)

from processors.shot_detector import shot_detector
from processors.dribble_detector import dribble_detector

# Global set to track cancelled jobs
CANCELLED_JOBS = set()

def cancel_job(job_id: str):
    """Marks a job as cancelled."""
    CANCELLED_JOBS.add(job_id)
    logger.info(f"[CANCEL] Job {job_id} has been marked for cancellation.")

def is_job_cancelled(job_id: str):
    """Checks if a job has been cancelled."""
    return job_id in CANCELLED_JOBS

def download_file(url):
    """Downloads a file from a URL to a temporary local path."""
    if not url: return None
    if not url.startswith('http'): return url # Already a local path
    
    try:
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        ext = os.path.splitext(url.split('?')[0])[1] or '.tmp'
        # Special case for HEIC if needed, but moviepy/pillow-heif handles it
        tmp = NamedTemporaryFile(delete=False, suffix=ext)
        for chunk in response.iter_content(chunk_size=8192):
            tmp.write(chunk)
        tmp.close()
        return tmp.name
    except Exception as e:
        logger.error(f"[ERROR] Failed to download {url}: {e}")
        return None

async def process_video_cv(player_data: dict):
    """
    Task to generate the premium NBA-style video CV.
    Returns the generated video path.
    """
    temp_files = []
    try:
        job_id = player_data.get('jobId', 'unknown')
        player_name = f"{player_data.get('firstName')} {player_data.get('lastName')}"
        logger.info(f"🚀 Starting Premium Video CV generation for {player_name} (Job: {job_id})")

        # 0. Orchestrator (CapCut Draft)
        orchestrator_url = None
        tier = player_data.get('tier')
        if tier:
            logger.info(f"[ORCHESTRATOR] Using tier: {tier}")
            orchestrator = VideoCVOrchestrator()
            orchestrator_url = await orchestrator.generate_cv(player_data)
            if orchestrator_url:
                logger.info(f"[SUCCESS] CV Draft generated via Orchestrator: {orchestrator_url}")
            else:
                logger.warning("[WARNING] Orchestrator failed to generate CV draft.")
        
        # Continue with local rendering...
        
        # Initialize renderer with custom colors if provided
        renderer = NBAVideoRenderer(
            primary=player_data.get('primaryColor'),
            accent=player_data.get('accentColor')
        )
        
        # 1. Download necessary assets
        logger.info("⏳ Downloading media assets...")
        
        photo_url = player_data.get('profilePhotoUrl')
        off_vid_urls = player_data.get('offensiveVideoUrls', [])
        def_vid_urls = player_data.get('defensiveVideoUrls', [])
        pres_vid_url = player_data.get('presentationVideoUrl')
        club_logo_url = player_data.get('clubLogoUrl')
        
        local_photo = download_file(photo_url)
        local_pres = download_file(pres_vid_url)
        local_club_logo = download_file(club_logo_url)
        
        if local_photo: temp_files.append(local_photo)
        if local_pres: temp_files.append(local_pres)
        if local_club_logo: temp_files.append(local_club_logo)

        local_off_vids = []
        for url in off_vid_urls:
            loc = download_file(url)
            if loc:
                local_off_vids.append(loc)
                temp_files.append(loc)

        local_def_vids = []
        for url in def_vid_urls:
            loc = download_file(url)
            if loc:
                local_def_vids.append(loc)
                temp_files.append(loc)

        # Update player_data with local paths for the renderer
        player_data['profilePhotoLocalPath'] = local_photo
        if local_club_logo:
             player_data['currentClub']['localLogoPath'] = local_club_logo

        # 1.5 AI Analysis (New Stage)
        logger.info("[AI] Running Analysis (Shot & Dribble)...")
        ai_insights = []
        
        # Analyze Shot Biomechanics on offensive videos
        for loc in local_off_vids:
            try:
                shot_result = shot_detector.process_video(loc)
                if shot_result.get("success"):
                    ai_insights.extend(shot_result.get("coaching_report", []))
                    logger.info(f"🏀 Shot Insight: {shot_result.get('coaching_report')}")
            except Exception as e:
                logger.error(f"Error during shot analysis: {e}")

        # Analyze Dribble Skills
        for loc in local_off_vids:
            try:
                dribble_result = dribble_detector.process_video(loc)
                if dribble_result.get("success") and dribble_result.get("moves"):
                    moves_str = ", ".join(dribble_result["moves"])
                    ai_insights.append(f"Dribble : {moves_str} identifiés.")
                    logger.info(f"🔥 Dribble Insight: {moves_str}")
            except Exception as e:
                logger.error(f"Error during dribble analysis: {e}")

        player_data['ai_insights'] = list(set(ai_insights)) # Remove duplicates
        logger.info(f"[SUCCESS] AI Insights captured: {player_data['ai_insights']}")

        # 2. Prepare highlights list
        highlights = []
        for loc in local_off_vids:
            highlights.append({
                'path': loc,
                'title': 'OFFENSIVE SKILLS',
                'narration': f"Powerful offensive presence by {player_data.get('lastName')}."
            })
        for loc in local_def_vids:
            highlights.append({
                'path': loc,
                'title': 'DEFENSIVE ELITE',
                'narration': "Shutdown defense and high basketball IQ."
            })

        # 3. Assemble Full CV
        logger.info("[RENDER] Rendering premium NBA-style video...")
        output_filename = f"CV_{player_data.get('lastName')}_{int(time.time())}.mp4"
        output_dir = "output/cv_videos"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)
        
        # Call the assembly method with cancellation check
        final_path = renderer.assemble_full_cv(
            player_data=player_data,
            highlights_videos=highlights,
            presentation_video=local_pres,
            output_path=output_path,
            cancel_check=lambda: is_job_cancelled(job_id)
        )
            
        if final_path:
            logger.info(f"✅ Premium Video CV generated: {final_path}")
            return {
                "local_path": final_path,
                "orchestrator_url": orchestrator_url
            }
        else:
            logger.warning(f"⚠️ Job {job_id} was cancelled or failed.")
            return None
        
    except Exception as e:
        logger.error(f"[ERROR] During premium video CV generation: {str(e)}")
        raise e
    finally:
        # Cleanup temp files
        for f in temp_files:
            try:
                if os.path.exists(f):
                    os.remove(f)
            except:
                pass
        
        # Remove from cancelled tracking if present
        job_id = player_data.get('jobId')
        if job_id in CANCELLED_JOBS:
            CANCELLED_JOBS.remove(job_id)
