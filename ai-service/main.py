import os
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import io
import time
from PIL import Image
from cv_schemas import CVPlayerData
from processors.cv_processor import process_video_cv, cancel_job
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


app = FastAPI(title="Ankece AI Service", description="Advanced Motion Recognition for Basketball")

# Global dict to store job statuses
jobs = {}

def run_process_video_cv(job_id: str, payload: dict):
    """Background task to process video CV and update job status."""
    def update_progress(progress, message):
        print(f"[JOB {job_id}] Progress: {progress}% - {message}")
        jobs[job_id].update({"progress": progress, "message": message})

    try:
        print(f"🧵 Starting background thread for Job: {job_id}")
        jobs[job_id] = {"status": "processing", "progress": 10, "message": "Initialisation du rendu..."}
        # Correctly call the (now sync) process_video_cv with progress callback
        result = process_video_cv(payload, progress_callback=update_progress)
        
        if result and isinstance(result, dict):
            video_path = result.get("local_path")
            orchestrator_url = result.get("orchestrator_url")
            
            has_video = video_path and os.path.exists(video_path)
            has_draft = orchestrator_url and orchestrator_url.startswith('http')
            
            if has_video or has_draft:
                jobs[job_id] = {
                    "status": "completed",
                    "progress": 100,
                    "result": {
                        "success": True,
                        "filename": os.path.basename(video_path) if has_video else None,
                        "path": f"/output/cv_videos/{os.path.basename(video_path)}" if has_video else None,
                        "orchestrator_url": orchestrator_url if has_draft else None
                    }
                }
                return

        # Fallback if result is string or invalid
        if isinstance(result, str) and (os.path.exists(result) or result.startswith('http')):
             jobs[job_id] = {
                "status": "completed",
                "progress": 100,
                "result": {
                    "success": True,
                    "filename": os.path.basename(result) if not result.startswith('http') else "CapCut_Draft",
                    "path": result
                }
            }
        else:
            jobs[job_id] = {"status": "failed", "progress": 100, "message": "Video generation failed: No valid output produced"}
            
    except Exception as e:
        print(f"[ERROR] Background task {job_id} failed: {str(e)}")
        jobs[job_id] = {"status": "failed", "progress": 100, "message": str(e)}

# Allow CORS for local development with Expo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount output directory to serve static files (e.g., generated videos)
os.makedirs("output", exist_ok=True)
app.mount("/output", StaticFiles(directory="output"), name="output")

@app.get("/")
async def root():
    return {"message": "Ankece AI Service is running", "status": "online"}

from processors.shot_detector import shot_detector
from processors.dribble_detector import dribble_detector
from processors.session_detector import session_detector

import shutil
from tempfile import NamedTemporaryFile

@app.post("/analyze-dribble")
async def analyze_dribble(file: UploadFile = File(...)):
    """
    Endpoint to analyze basketball dribbles from a video.
    Returns dribble count and detected moves (crossover, etc.).
    """
    print(f"Analyzing dribbles in: {file.filename}")
    extension = os.path.splitext(file.filename)[1].lower()
    
    if extension not in ['.mp4', '.mov', '.avi']:
        return {"success": False, "error": "Invalid video format"}

    with NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        analysis_result = dribble_detector.process_video(tmp_path)
        return {
            "success": True,
            "filename": file.filename,
            "analysis": analysis_result
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
@app.post("/analyze-session")
async def analyze_session(file: UploadFile = File(...)):
    """
    Endpoint to analyze a shooting session (counting makes/misses).
    """
    print(f"Analyzing shooting session in: {file.filename}")
    extension = os.path.splitext(file.filename)[1].lower()
    
    if extension not in ['.mp4', '.mov', '.avi']:
        return {"success": False, "error": "Invalid video format"}

    with NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        analysis_result = session_detector.process_video(tmp_path)
        return {
            "success": True,
            "filename": file.filename,
            "analysis": analysis_result
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/analyze-shot")
async def analyze_shot(file: UploadFile = File(...)):
    """
    Endpoint to analyze a basketball shot from an image or video frame.
    Uses MediaPipe for pose detection.
    """
    print(f"Analyzing file: {file.filename}")
    extension = os.path.splitext(file.filename)[1].lower()
    print(f"🔍 Extension detected: {extension}")
    
    # Handle Video
    if extension in ['.mp4', '.mov', '.avi']:
        print(f"🎬 Video format detected, starting video analysis for {file.filename}...")
        with NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        try:
            analysis_result = shot_detector.process_video(tmp_path)
            return {
                "success": True,
                "type": "video",
                "filename": file.filename,
                "analysis": analysis_result
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    # Handle Image (default)
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        print("❌ Error: Invalid image format")
        return {"success": False, "error": "Invalid image format"}

    analysis_result = shot_detector.process_frame(img)
    
    return {
        "success": True,
        "type": "image",
        "filename": file.filename,
        "analysis": analysis_result
    }

@app.post("/generate-cv-video")
async def generate_cv_video(data: CVPlayerData, background_tasks: BackgroundTasks):
    """
    Endpoint to receive player data and trigger video CV generation in background.
    Returns a job_id immediately.
    """
    job_id = data.jobId or f"job_{int(time.time())}"
    print(f"Received Video CV request for {data.firstName} {data.lastName} (Job: {job_id})")
    
    payload = data.model_dump()
    
    # Initialize job status
    jobs[job_id] = {"status": "queued", "progress": 0, "message": "En attente du serveur..."}
    
    # Start background task
    background_tasks.add_task(run_process_video_cv, job_id, payload)
    
    return {
        "success": True,
        "message": "Generation started in background",
        "job_id": job_id
    }

@app.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """Returns the current status of a generation job."""
    job = jobs.get(job_id)
    if not job:
        return {"success": False, "message": "Job not found"}
    return {"success": True, **job}

@app.post("/cancel-cv-generation/{job_id}")
async def cancel_cv_generation(job_id: str):
    """
    Endpoint to cancel a running video CV generation.
    """
    print(f"🛑 Received cancellation request for job: {job_id}")
    cancel_job(job_id)
    return {"success": True, "message": f"Cancellation signal sent for job {job_id}"}

@app.post("/create-payment-intent")
async def create_payment_intent(data: dict):
    """
    Endpoint to create a Stripe Payment Intent.
    Expects 'amount' and 'currency' in the request body.
    """
    try:
        # Create a PaymentIntent with the specified amount and currency
        intent = stripe.PaymentIntent.create(
            amount=data.get('amount', 500), # Default 5€
            currency=data.get('currency', 'eur'),
            automatic_payment_methods={
                'enabled': True,
            },
        )
        return {
            'clientSecret': intent.client_secret,
            'publishableKey': os.getenv("STRIPE_PUBLISHABLE_KEY")
        }
    except Exception as e:
        return {"error": str(e)}, 400

if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=8000)
