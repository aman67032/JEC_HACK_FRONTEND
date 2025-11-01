import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_prescription_ocr_with_required_fields_and_optional_prescription_id():
    url = f"{BASE_URL}/api/prescription/ocr"
    headers = {"Content-Type": "application/json"}

    # Sample valid image URL and userId for testing (replace with valid ones as necessary)
    valid_image_url = "https://firebasestorage.googleapis.com/v0/b/example/o/sample_prescription.jpg?alt=media"
    valid_user_id = str(uuid.uuid4())  # generating a random user ID for test

    # Helper function to POST to endpoint and return response
    def post_request(payload):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
            return response
        except requests.exceptions.RequestException as e:
            assert False, f"Request failed: {e}"

    # 1. Test missing required field: imageUrl
    payload_missing_imageurl = {
        "userId": valid_user_id
    }
    response = post_request(payload_missing_imageurl)
    assert response.status_code == 400, f"Expected 400 for missing imageUrl, got {response.status_code}"

    # 2. Test missing required field: userId
    payload_missing_userid = {
        "imageUrl": valid_image_url
    }
    response = post_request(payload_missing_userid)
    assert response.status_code == 400, f"Expected 400 for missing userId, got {response.status_code}"

    # 3. Test successful extraction without prescriptionId (only required fields)
    payload_required_only = {
        "imageUrl": valid_image_url,
        "userId": valid_user_id
    }
    response = post_request(payload_required_only)
    assert response.status_code == 200, f"Expected 200 for valid input without prescriptionId, got {response.status_code}"
    # Validate response contains expected keys (e.g. medicines extracted)
    json_resp = response.json()
    assert isinstance(json_resp, dict), "Response body is not a dict"
    assert "medicines" in json_resp, "Response should include 'medicines'"
    assert isinstance(json_resp["medicines"], list), "'medicines' should be a list"

    # 4. Test successful extraction with optional prescriptionId
    prescription_id = str(uuid.uuid4())
    payload_with_prescription_id = {
        "imageUrl": valid_image_url,
        "userId": valid_user_id,
        "prescriptionId": prescription_id
    }
    response = post_request(payload_with_prescription_id)
    assert response.status_code == 200, f"Expected 200 for valid input with prescriptionId, got {response.status_code}"
    json_resp = response.json()
    assert isinstance(json_resp, dict), "Response body is not a dict"
    assert "medicines" in json_resp, "Response should include 'medicines'"
    assert isinstance(json_resp["medicines"], list), "'medicines' should be a list"
    # The response may include the prescriptionId or acknowledge it, check optionally
    if "prescriptionId" in json_resp:
        assert json_resp["prescriptionId"] == prescription_id, "Returned prescriptionId mismatch"

    # 5. Test invalid data types for imageUrl and userId (e.g. integers instead of strings)
    payload_invalid_types = {
        "imageUrl": 12345,
        "userId": 67890
    }
    response = post_request(payload_invalid_types)
    assert response.status_code == 400, f"Expected 400 for invalid data types, got {response.status_code}"

    # 6. Test empty strings for required fields
    payload_empty_strings = {
        "imageUrl": "",
        "userId": ""
    }
    response = post_request(payload_empty_strings)
    assert response.status_code == 400, f"Expected 400 for empty required fields, got {response.status_code}"

    # 7. Test large payload with prescriptionId and verify it does not cause errors
    long_prescription_id = "presc-" + "a" * 256
    payload_long_prescription_id = {
        "imageUrl": valid_image_url,
        "userId": valid_user_id,
        "prescriptionId": long_prescription_id
    }
    response = post_request(payload_long_prescription_id)
    # Accept either 200 or a handled 400 if too long (boundary case)
    assert response.status_code in (200, 400), f"Expected 200 or 400 for large prescriptionId, got {response.status_code}"

    # 8. Test handling of server error (simulate by sending obviously malformed data)
    payload_malformed = "this is not a json"
    try:
        resp = requests.post(url, data=payload_malformed, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
        # Could be 400 or 500 depending on server implementation
        assert resp.status_code in (400, 500), f"Expected 400 or 500 for malformed request body, got {resp.status_code}"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"


test_prescription_ocr_with_required_fields_and_optional_prescription_id()