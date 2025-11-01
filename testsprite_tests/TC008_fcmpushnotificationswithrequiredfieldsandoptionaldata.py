import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_fcmpushnotifications_with_required_fields_and_optional_data():
    # Helper function to register a user for testing (simulate user creation)
    # Since user creation API is not provided, assume we register FCM token to create user presence
    user_id = str(uuid.uuid4())
    fcm_token = "test_fcm_token_" + user_id

    # Register FCM token to create the user in system (no auth required)
    reg_token_resp = requests.post(
        f"{BASE_URL}/api/notifications/register-token",
        json={"userId": user_id, "fcmToken": fcm_token},
        timeout=TIMEOUT,
    )
    assert reg_token_resp.status_code == 200, f"Failed to register token: {reg_token_resp.text}"

    try:
        endpoint = f"{BASE_URL}/api/notifications/fcm"
        headers = {"Content-Type": "application/json"}

        valid_payload = {
            "userId": user_id,
            "type": "alert",
            "title": "Test Notification",
            "message": "This is a test push notification.",
            "data": {"key1": "value1", "key2": 2},
        }

        # 1. Test successful notification sending with all required and optional data
        resp = requests.post(endpoint, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}, {resp.text}"

        # 2. Test successful notification sending with only required fields (no 'data')
        minimal_payload = {
            "userId": user_id,
            "type": "info",
            "title": "Minimal Notification",
            "message": "Required fields only.",
        }
        resp = requests.post(endpoint, json=minimal_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK for minimal payload but got {resp.status_code}, {resp.text}"

        # 3. Test missing required fields - userId missing
        missing_userid = valid_payload.copy()
        del missing_userid["userId"]
        resp = requests.post(endpoint, json=missing_userid, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for missing userId but got {resp.status_code}"

        # 4. Test missing required fields - type missing
        missing_type = valid_payload.copy()
        del missing_type["type"]
        resp = requests.post(endpoint, json=missing_type, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for missing type but got {resp.status_code}"

        # 5. Test missing required fields - title missing
        missing_title = valid_payload.copy()
        del missing_title["title"]
        resp = requests.post(endpoint, json=missing_title, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for missing title but got {resp.status_code}"

        # 6. Test missing required fields - message missing
        missing_message = valid_payload.copy()
        del missing_message["message"]
        resp = requests.post(endpoint, json=missing_message, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for missing message but got {resp.status_code}"

        # 7. Test user not found (non-existent userId)
        invalid_user_payload = valid_payload.copy()
        invalid_user_payload["userId"] = "non-existent-user-" + str(uuid.uuid4())
        resp = requests.post(endpoint, json=invalid_user_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 404, f"Expected 404 Not Found for invalid userId but got {resp.status_code}"

        # 8. Test invalid data types for required fields (e.g., userId as int)
        invalid_type_payload = valid_payload.copy()
        invalid_type_payload["userId"] = 12345  # should be string
        resp = requests.post(endpoint, json=invalid_type_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for invalid userId type but got {resp.status_code}"

        invalid_type_payload = valid_payload.copy()
        invalid_type_payload["type"] = 123  # should be string
        resp = requests.post(endpoint, json=invalid_type_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for invalid type but got {resp.status_code}"

        invalid_type_payload = valid_payload.copy()
        invalid_type_payload["title"] = None  # should be string
        resp = requests.post(endpoint, json=invalid_type_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for invalid title but got {resp.status_code}"

        invalid_type_payload = valid_payload.copy()
        invalid_type_payload["message"] = []  # should be string
        resp = requests.post(endpoint, json=invalid_type_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 Bad Request for invalid message but got {resp.status_code}"

        # 9. Test server error simulation - cannot forcibly test without server support

    finally:
        # No cleanup API for user, so no delete operation possible
        # If there is a cleanup endpoint in real scenario, call it here - otherwise skip
        pass


test_fcmpushnotifications_with_required_fields_and_optional_data()