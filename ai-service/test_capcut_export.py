import asyncio
import os
import sys

# Add ai-service to path
sys.path.append(os.path.join(os.getcwd(), 'ai-service'))

from processors.cv_processor import process_video_cv

async def test_capcut_integration():
    player_data = {
        "firstName": "Guannan",
        "lastName": "Sun",
        "age": 28,
        "position": "Shooting Guard",
        "currentClub": {
            "clubName": "CapCut Team",
            "season": "2024-2025"
        },
        "exportToCapCut": True # This triggers the new logic
    }
    
    print("Testing CapCut Integration...")
    try:
        # Note: This will fail if capcut_server.py is not running on 9001
        result = await process_video_cv(player_data)
        if result and result.startswith('http'):
            print(f"SUCCESS: Generated CapCut Draft URL: {result}")
        else:
            print(f"FAILED or Server not running. Result: {result}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_capcut_integration())
