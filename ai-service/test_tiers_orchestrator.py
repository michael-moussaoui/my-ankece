import asyncio
import logging
import sys
import os

# Add parent directory to sys.path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.orchestrator import VideoCVOrchestrator
from cv_schemas import CVTier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_tiers():
    orchestrator = VideoCVOrchestrator()
    
    test_data = {
        "firstName": "Michael",
        "lastName": "Jordan",
        "age": 23,
        "position": "SG",
        "primaryColor": "#D3122A", # Bulls Red
        "offensiveVideoUrl": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        "defensiveVideoUrl": "https://res.cloudinary.com/demo/video/upload/dog.mp4"
    }
    
    # 1. Test ESSENTIEL
    logger.info("--- Testing Tier: ESSENTIEL ---")
    test_data["tier"] = CVTier.ESSENTIEL.value
    result_ess = await orchestrator.generate_cv(test_data)
    logger.info(f"Result ESSENTIEL: {result_ess}")
    
    # 2. Test PRO
    logger.info("\n--- Testing Tier: PRO ---")
    test_data["tier"] = CVTier.PRO.value
    result_pro = await orchestrator.generate_cv(test_data)
    logger.info(f"Result PRO: {result_pro}")

if __name__ == "__main__":
    asyncio.run(test_tiers())
