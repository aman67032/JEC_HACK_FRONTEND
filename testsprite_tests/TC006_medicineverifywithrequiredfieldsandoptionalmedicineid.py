import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_medicineverifywithrequiredfieldsandoptionalmedicineid():
    headers = {"Content-Type": "application/json"}

    # To test with optional medicine_id, we first need a valid medicine_id.
    # Create a medicine resource using /api/medicine/register (public, no auth).
    register_url = f"{BASE_URL}/api/medicine/register"
    verify_url = f"{BASE_URL}/api/medicine/verify"

    test_user_id = "test-user-verify-001"
    test_medicine_name = "TestMedicine"
    test_image_url = "https://firebasestorage.googleapis.com/v0/b/testbucket/o/testimage.jpg?alt=media"

    medicine_id = None
    # Register medicine resource for valid medicine_id testing
    register_payload = {
        "imageUrl": test_image_url,
        "medicine_name": test_medicine_name,
        "user_id": test_user_id
    }

    try:
        # Register medicine (to get medicine_id for optional testing)
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 200, f"Medicine registration failed with status {reg_resp.status_code}"
        reg_json = reg_resp.json()
        assert isinstance(reg_json, dict), "Expected JSON object in medicine registration response"
        # Extract medicine id from response if present, else skip optional test
        medicine_id = reg_json.get("medicine_id") or reg_json.get("id") or reg_json.get("medicineId")

        # ----- Test 1: Missing required fields (imageUrl) -----
        payload_missing_imageurl = {
            "user_id": test_user_id
        }
        resp = requests.post(verify_url, json=payload_missing_imageurl, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing imageUrl, got {resp.status_code}"

        # ----- Test 2: Missing required fields (user_id) -----
        payload_missing_userid = {
            "imageUrl": test_image_url
        }
        resp = requests.post(verify_url, json=payload_missing_userid, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing user_id, got {resp.status_code}"

        # ----- Test 3: Valid request without medicine_id -----
        payload_valid_no_medicine_id = {
            "imageUrl": test_image_url,
            "user_id": test_user_id
        }
        resp = requests.post(verify_url, json=payload_valid_no_medicine_id, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Valid request without medicine_id failed with status {resp.status_code}"
        json_resp = resp.json()
        assert "match" in json_resp, "Response missing 'match' field for verification result"
        assert isinstance(json_resp["match"], bool), "'match' field should be boolean"

        # ----- Test 4: Valid request with medicine_id (optional) if medicine_id available -----
        if medicine_id:
            payload_valid_with_medicine_id = {
                "imageUrl": test_image_url,
                "user_id": test_user_id,
                "medicine_id": medicine_id
            }
            resp = requests.post(verify_url, json=payload_valid_with_medicine_id, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Valid request with medicine_id failed with status {resp.status_code}"
            json_resp = resp.json()
            assert "match" in json_resp, "Response missing 'match' field for verification with medicine_id"
            assert isinstance(json_resp["match"], bool), "'match' field should be boolean"
    finally:
        # Cleanup: No explicit delete endpoint mentioned for medicine resource, so skip delete.
        pass

test_medicineverifywithrequiredfieldsandoptionalmedicineid()