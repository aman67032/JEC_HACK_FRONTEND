import requests
import uuid

base_url = "http://localhost:3000"
timeout = 30


def test_emergency_location_handler_with_required_fields_and_optional_coordinates():
    emergency_endpoint = f"{base_url}/api/emergency/location"
    headers = {"Content-Type": "application/json"}

    # Helper function to create a dummy user (simulate user existence)
    def create_dummy_user():
        # As user creation endpoint is not provided in PRD,
        # simulate user existence with a random UUID as userId
        return str(uuid.uuid4())

    # Test data setup
    userId = create_dummy_user()
    emergencyId = str(uuid.uuid4())

    # 1. Test successful processing with required fields only
    payload_required_only = {
        "userId": userId,
        "emergencyId": emergencyId
    }
    response = requests.post(emergency_endpoint, json=payload_required_only, headers=headers, timeout=timeout)
    try:
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        json_data = response.json()
        # Validate response contains hospital and ambulance contact info
        assert "nearestHospital" in json_data, "nearestHospital missing in response"
        assert "ambulanceContact" in json_data, "ambulanceContact missing in response"
    except Exception:
        raise

    # 2. Test successful processing including optional latitude and longitude
    payload_with_coordinates = {
        "userId": userId,
        "emergencyId": emergencyId,
        "latitude": 12.345678,
        "longitude": 98.7654321
    }
    response = requests.post(emergency_endpoint, json=payload_with_coordinates, headers=headers, timeout=timeout)
    try:
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        json_data = response.json()
        assert "nearestHospital" in json_data, "nearestHospital missing in response"
        assert "ambulanceContact" in json_data, "ambulanceContact missing in response"
    except Exception:
        raise

    # 3. Test error handling: missing userId
    payload_missing_userId = {
        "emergencyId": emergencyId,
        "latitude": 12.34,
        "longitude": 56.78
    }
    response = requests.post(emergency_endpoint, json=payload_missing_userId, headers=headers, timeout=timeout)
    try:
        assert response.status_code == 400, f"Expected 400 for missing userId, got {response.status_code}"
    except Exception:
        raise

    # 4. Test error handling: missing emergencyId
    payload_missing_emergencyId = {
        "userId": userId,
        "latitude": 12.34,
        "longitude": 56.78
    }
    response = requests.post(emergency_endpoint, json=payload_missing_emergencyId, headers=headers, timeout=timeout)
    try:
        assert response.status_code == 400, f"Expected 400 for missing emergencyId, got {response.status_code}"
    except Exception:
        raise

    # 5. Test error handling: user not found
    payload_user_not_found = {
        "userId": str(uuid.uuid4()),  # Random userId not created above
        "emergencyId": emergencyId
    }
    response = requests.post(emergency_endpoint, json=payload_user_not_found, headers=headers, timeout=timeout)
    try:
        assert response.status_code == 404, f"Expected 404 for user not found, got {response.status_code}"
    except Exception:
        raise


test_emergency_location_handler_with_required_fields_and_optional_coordinates()