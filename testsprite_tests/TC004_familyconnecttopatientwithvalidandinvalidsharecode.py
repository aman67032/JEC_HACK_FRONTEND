import requests

BASE_URL = "http://localhost:3000"
API_PATH = "/api/family/connect"
TIMEOUT = 30

# These tokens should be replaced with valid tokens generated for testing
VALID_FAMILY_BEARER_TOKEN = "Bearer valid_family_role_token"
VALID_NONFAMILY_BEARER_TOKEN = "Bearer valid_nonfamily_role_token"
INVALID_BEARER_TOKEN = "Bearer invalid_token"


def test_family_connect_to_patient_with_valid_and_invalid_sharecode():
    headers_family = {
        "Authorization": VALID_FAMILY_BEARER_TOKEN,
        "Content-Type": "application/json"
    }

    headers_non_family = {
        "Authorization": VALID_NONFAMILY_BEARER_TOKEN,
        "Content-Type": "application/json"
    }

    headers_invalid_auth = {
        "Authorization": INVALID_BEARER_TOKEN,
        "Content-Type": "application/json"
    }

    # 1. Test successful connection with valid shareCode
    valid_share_code = "VALIDSHARECODE123"
    resp = requests.post(
        f"{BASE_URL}{API_PATH}",
        json={"shareCode": valid_share_code},
        headers=headers_family,
        timeout=TIMEOUT
    )
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
    json_resp = resp.json()
    assert isinstance(json_resp, dict), "Response is not a JSON object"
    # Expect some success indication in response, can just check presence of keys or message
    assert "message" in json_resp or "success" in json_resp, "No success indication in response"

    # 2. Test missing shareCode field
    resp = requests.post(
        f"{BASE_URL}{API_PATH}",
        json={},
        headers=headers_family,
        timeout=TIMEOUT
    )
    assert resp.status_code == 400, f"Expected 400 Bad Request for missing shareCode, got {resp.status_code}"

    # 3. Test unauthorized access: no Authorization header
    resp = requests.post(
        f"{BASE_URL}{API_PATH}",
        json={"shareCode": valid_share_code},
        headers={"Content-Type": "application/json"},
        timeout=TIMEOUT
    )
    assert resp.status_code == 401, f"Expected 401 Unauthorized for missing auth, got {resp.status_code}"

    # 4. Test forbidden access: valid bearer token but without family role
    resp = requests.post(
        f"{BASE_URL}{API_PATH}",
        json={"shareCode": valid_share_code},
        headers=headers_non_family,
        timeout=TIMEOUT
    )
    assert resp.status_code == 403, f"Expected 403 Forbidden for missing family role, got {resp.status_code}"

    # 5. Test invalid shareCode value -> expect 404 Not Found
    invalid_share_code = "INVALIDSHARECODE987"
    resp = requests.post(
        f"{BASE_URL}{API_PATH}",
        json={"shareCode": invalid_share_code},
        headers=headers_family,
        timeout=TIMEOUT
    )
    assert resp.status_code == 404, f"Expected 404 Not Found for invalid shareCode, got {resp.status_code}"


test_family_connect_to_patient_with_valid_and_invalid_sharecode()
