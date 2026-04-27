import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_api():
    print(f"Testing API at {BASE_URL}...")
    
    # 1. Login
    try:
        login_resp = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        print(f"Login status: {login_resp.status_code}")
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.text}")
            return
            
        token = login_resp.json().get('data', {}).get('token')
        if not token:
            print("Token not found in response")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get Inquiries
        print("Fetching inquiries...")
        inq_resp = requests.get(f"{BASE_URL}/inquiries", headers=headers)
        print(f"Inquiries status: {inq_resp.status_code}")
        if inq_resp.status_code != 200:
            print(f"Inquiries failed: {inq_resp.text}")
            
        # 3. Get Dashboard Stats
        print("Fetching dashboard stats...")
        stats_resp = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers)
        print(f"Stats status: {stats_resp.status_code}")
        if stats_resp.status_code != 200:
            print(f"Stats failed: {stats_resp.text}")
            
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    test_api()
