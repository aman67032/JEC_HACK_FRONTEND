import requests

BASE_URL = "http://localhost:3000"
CONNECT_ENDPOINT = "/api/doctor/connect"
TIMEOUT = 30

# Sample tokens (replace with actual test tokens or mocks)
DOCTOR_BEARER_TOKEN = "Bearer valid_doctor_role_token"
NON_DOCTOR_BEARER_TOKEN = "Bearer valid_non_doctor_role_token"
INVALID_BEARER_TOKEN = "Bearer invalid_token"

def test_doctor_connect_to_patient_with_valid_and_invalid_sharecode():
    headers_doctor = {
        "Authorization": DOCTOR_BEARER_TOKEN,
        "Content-Type": "application/json"
    }
    headers_non_doctor = {
        "Authorization": NON_DOCTOR_BEARER_TOKEN,
        "Content-Type": "application/json"
    }
    headers_invalid = {
        "Authorization": INVALID_BEARER_TOKEN,
        "Content-Type": "application/json"
    }
    headers_missing_auth = {
        "Content-Type": "application/json"
    }

    # Valid shareCode for success testing - this must be a code that exists in the system
    valid_share_code = "validShareCode123"

    # 1. Successful connection with valid shareCode and doctor role token
    try:
        resp = requests.post(
            f"{BASE_URL}{CONNECT_ENDPOINT}",
            json={"shareCode": valid_share_code},
            headers=headers_doctor,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"Expected 200 but got {resp.status_code}"
        json_resp = resp.json()
        assert isinstance(json_resp, dict), "Response is not a JSON object"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # 2. Missing shareCode - expect 400 Bad Request
    try:
        resp = requests.post(
            f"{BASE_URL}{CONNECT_ENDPOINT}",
            json={},  # no shareCode
            headers=headers_doctor,
            timeout=TIMEOUT
        )
        assert resp.status_code == 400, f"Expected 400 but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # 3. Unauthorized access - missing token - expect 401
    try:
        resp = requests.post(
            f"{BASE_URL}{CONNECT_ENDPOINT}",
            json={"shareCode": valid_share_code},
            headers=headers_missing_auth,
            timeout=TIMEOUT
        )
        assert resp.status_code == 401, f"Expected 401 but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # 4. Forbidden access - token present but without doctor role - expect 403
    try:
        resp = requests.post(
            f"{BASE_URL}{CONNECT_ENDPOINT}",
            json={"shareCode": valid_share_code},
            headers=headers_non_doctor,
            timeout=TIMEOUT
        )
        assert resp.status_code == 403, f"Expected 403 but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # 5. Invalid shareCode - expect 404 Not Found
    invalid_share_code = "invalidCode9999"
    try:
        resp = requests.post(
            f"{BASE_URL}{CONNECT_ENDPOINT}",
            json={"shareCode": invalid_share_code},
            headers=headers_doctor,
            timeout=TIMEOUT
        )
        assert resp.status_code == 404, f"Expected 404 but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_doctor_connect_to_patient_with_valid_and_invalid_sharecode()