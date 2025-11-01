import requests
import uuid

BASE_URL = "http://localhost:3000"
REGISTER_TOKEN_ENDPOINT = "/api/notifications/register-token"
TIMEOUT = 30


def test_fcmtokenregistrationwithrequiredfields():
    url = BASE_URL + REGISTER_TOKEN_ENDPOINT

    # Helper to register token
    def register_token(payload):
        try:
            response = requests.post(url, json=payload, timeout=TIMEOUT)
            return response
        except requests.RequestException as e:
            assert False, f"Request failed: {e}"

    # Missing both userId and fcmToken
    response = register_token({})
    assert response.status_code == 400, f"Expected 400 for missing fields but got {response.status_code}"

    # Missing userId only
    response = register_token({"fcmToken": "fakeFCMtoken123"})
    assert response.status_code == 400, f"Expected 400 for missing userId but got {response.status_code}"

    # Missing fcmToken only
    response = register_token({"userId": "someUserId"})
    assert response.status_code == 400, f"Expected 400 for missing fcmToken but got {response.status_code}"

    # Successful token registration flow
    # Since userId must be provided and valid, generate a random userId string (assuming no auth required)
    user_id = str(uuid.uuid4())
    fcm_token = "testFCMTokenValue12345"

    payload = {"userId": user_id, "fcmToken": fcm_token}
    try:
        success_response = register_token(payload)
        assert success_response.status_code == 200, (
            f"Expected 200 for successful token registration but got {success_response.status_code}"
        )
        # Verify response content if any (not detailed in PRD)
        # Assuming a JSON response with success message
        json_data = success_response.json()
        assert "success" in json_data.get("message", "").lower() or "token" in json_data.get("message", "").lower() or len(json_data) > 0
    finally:
        # No DELETE or cleanup endpoint provided in PRD for token registration
        # So nothing to clean up - just pass
        pass


test_fcmtokenregistrationwithrequiredfields()