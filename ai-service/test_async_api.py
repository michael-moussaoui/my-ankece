import requests
import time

BASE_URL = "http://localhost:8000"

payload = {
    "firstName": "Test",
    "lastName": "Async",
    "age": 25,
    "position": "Meneur",
    "currentClub": {"clubName": "Test Club", "season": "2024-2025"},
    "tier": "essentiel",
    "jobId": f"test_job_{int(time.time())}"
}

print(f"Testing POST /generate-cv-video...")
try:
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/generate-cv-video", json=payload, timeout=10)
    end_time = time.time()
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")
    print(f"Request took: {end_time - start_time:.4f}s")
    
    if response.status_code == 200:
        job_id = response.json().get("job_id")
        print(f"Polling status for job: {job_id}")
        for _ in range(5):
            time.sleep(2)
            status_resp = requests.get(f"{BASE_URL}/job-status/{job_id}")
            print(f"Status: {status_resp.json()}")
            if status_resp.json().get("status") in ["completed", "failed"]:
                break
except Exception as e:
    print(f"Error: {e}")
