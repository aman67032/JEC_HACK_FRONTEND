import requests

BASE_URL = "http://localhost:3000"


def test_medicineregisterwithrequiredfieldsandimageurl():
    url = f"{BASE_URL}/api/medicine/register"
    timeout = 30

    # Valid payload
    valid_payload = {
        "imageUrl": "https://firebase.storage.fake/medicines/image123.jpg",
        "medicine_name": "Aspirin",
        "user_id": "test-user-123",
        "dosage": "100mg"
    }

    # 1. Test successful registration with all required fields and optional dosage
    try:
        response = requests.post(url, json=valid_payload, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        resp_json = response.json()
        # Assuming response contains "message" with success description or registered medicine data
        assert "success" in resp_json.get("message", "").lower() or resp_json, "Success message or data expected"
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    # 2. Test missing required fields individually and together
    required_fields = ["imageUrl", "medicine_name", "user_id"]

    for field in required_fields:
        payload_missing_field = valid_payload.copy()
        del payload_missing_field[field]
        try:
            resp = requests.post(url, json=payload_missing_field, timeout=timeout)
            assert resp.status_code == 400, (
                f"Missing field '{field}' should cause 400 Bad Request, got {resp.status_code}"
            )
        except requests.RequestException as e:
            assert False, f"HTTP request failed when missing '{field}': {e}"

    # Also test empty payload (all required fields missing)
    try:
        resp = requests.post(url, json={}, timeout=timeout)
        assert resp.status_code == 400, f"Empty payload should cause 400 Bad Request, got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed for empty payload: {e}"


test_medicineregisterwithrequiredfieldsandimageurl()