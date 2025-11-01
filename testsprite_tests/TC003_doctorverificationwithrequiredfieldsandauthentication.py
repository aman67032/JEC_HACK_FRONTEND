import requests

BASE_URL = "http://localhost:3000"
VERIFY_ENDPOINT = "/api/doctor/verify"
TIMEOUT = 30

def test_doctor_verification_with_required_fields_and_authentication():
    url = BASE_URL + VERIFY_ENDPOINT

    # Sample valid payload with required fields
    valid_payload = {
        "hospitalName": "General Hospital",
        "degreeName": "MD",
        "degreeInstitution": "Medical University",
        "licenseNumber": "LN123456"
    }

    # Dummy bearer token for authentication (assuming this token is valid for test)
    valid_bearer_token = "Bearer valid-doctor-token"

    headers_with_auth = {
        "Authorization": valid_bearer_token,
        "Content-Type": "application/json"
    }

    headers_without_auth = {
        "Content-Type": "application/json"
    }

    # 1. Test successful submission WITH authentication (auth optional, so 200 or 401)
    try:
        response = requests.post(url, json=valid_payload, headers=headers_with_auth, timeout=TIMEOUT)
        assert response.status_code in (200, 401), f"Expected 200 or 401, got {response.status_code}"
        if response.status_code == 200:
            json_resp = response.json()
            # The response body expectation is not explicitly detailed, so we assert success message presence if any
            assert isinstance(json_resp, dict)
    except requests.RequestException as e:
        assert False, f"Request with auth failed: {e}"

    # 2. Test successful submission WITHOUT authentication (optional token)
    try:
        response = requests.post(url, json=valid_payload, headers=headers_without_auth, timeout=TIMEOUT)
        # Since auth is optional, expect 200 or 401 depending on backend config
        assert response.status_code in (200, 401), f"Expected 200 or 401, got {response.status_code}"
        if response.status_code == 200:
            json_resp = response.json()
            assert isinstance(json_resp, dict)
        else:
            # 401 unauthorized expected
            pass
    except requests.RequestException as e:
        assert False, f"Request without auth failed: {e}"

    # 3. Test missing required fields with authentication
    for missing_field in ["hospitalName", "degreeName", "degreeInstitution", "licenseNumber"]:
        incomplete_payload = valid_payload.copy()
        incomplete_payload.pop(missing_field)
        try:
            response = requests.post(url, json=incomplete_payload, headers=headers_with_auth, timeout=TIMEOUT)
            assert response.status_code in (400, 401), f"Expected 400 or 401 for missing field {missing_field}, got {response.status_code}"
            # If 400, check response json
            if response.status_code == 400:
                json_resp = response.json()
                assert isinstance(json_resp, dict)
        except requests.RequestException as e:
            assert False, f"Request missing field {missing_field} failed: {e}"

    # 4. Test missing required fields WITHOUT authentication
    for missing_field in ["hospitalName", "degreeName", "degreeInstitution", "licenseNumber"]:
        incomplete_payload = valid_payload.copy()
        incomplete_payload.pop(missing_field)
        try:
            response = requests.post(url, json=incomplete_payload, headers=headers_without_auth, timeout=TIMEOUT)
            # If auth is optional, missing required fields should still cause 400 or possibly 401 unauthorized
            assert response.status_code in (400, 401), f"Expected 400 or 401 for missing field {missing_field} without auth, got {response.status_code}"
            if response.status_code == 400:
                json_resp = response.json()
                assert isinstance(json_resp, dict)
        except requests.RequestException as e:
            assert False, f"Request without auth missing field {missing_field} failed: {e}"

    # 5. Test unauthorized access with invalid token
    invalid_headers = {
        "Authorization": "Bearer invalid-token",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=valid_payload, headers=invalid_headers, timeout=TIMEOUT)
        # Auth is optional; invalid token might cause unauthorized or accept the request
        assert response.status_code in (200, 401), f"Expected 200 or 401 for invalid token, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request with invalid token failed: {e}"

test_doctor_verification_with_required_fields_and_authentication()
