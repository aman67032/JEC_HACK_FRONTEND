import requests

BASE_URL = "http://localhost:3000"
ENDPOINT = "/api/admin/setDoctor"
URL = BASE_URL + ENDPOINT
TIMEOUT = 30

# Please replace this with a valid admin secret for a real test environment
VALID_ADMIN_SECRET = "valid_admin_secret_example"
INVALID_ADMIN_SECRET = "invalid_admin_secret_example"


def test_admin_set_doctor_role_with_valid_and_invalid_admin_secret():
    # For test, we need a userId; we'll simulate with a dummy userId
    test_user_id = "test-user-12345"

    headers_valid = {"x-admin-secret": VALID_ADMIN_SECRET}
    headers_invalid = {"x-admin-secret": INVALID_ADMIN_SECRET}
    headers_missing = {}

    # 1. Test missing userId => Expect 400 Bad Request
    payload_missing_userid = {}
    response = requests.post(URL, headers=headers_valid, json=payload_missing_userid, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing userId, got {response.status_code}"

    # 2. Test unauthorized access with invalid admin secret => Expect 401 Unauthorized
    payload_set_doctor = {"userId": test_user_id, "makeDoctor": True}
    response = requests.post(URL, headers=headers_invalid, json=payload_set_doctor, timeout=TIMEOUT)
    assert response.status_code == 401, f"Expected 401 for invalid admin secret, got {response.status_code}"

    # 3. Test unauthorized access with missing admin secret => Expect 401 Unauthorized
    response = requests.post(URL, headers=headers_missing, json=payload_set_doctor, timeout=TIMEOUT)
    assert response.status_code == 401, f"Expected 401 for missing admin secret, got {response.status_code}"

    # 4. Test successful role assignment with valid admin secret => Expect 200 Success
    response = requests.post(URL, headers=headers_valid, json=payload_set_doctor, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 for successful role assignment, got {response.status_code}"

    # 5. Test successful role removal (makeDoctor = False) with valid admin secret => Expect 200 Success
    payload_remove_doctor = {"userId": test_user_id, "makeDoctor": False}
    response = requests.post(URL, headers=headers_valid, json=payload_remove_doctor, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 for successful role removal, got {response.status_code}"


test_admin_set_doctor_role_with_valid_and_invalid_admin_secret()
