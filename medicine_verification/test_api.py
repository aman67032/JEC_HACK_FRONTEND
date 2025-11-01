"""
Simple test script for Medicine Verification API
Run this after starting the Flask server to test the endpoints
"""

import requests
import os
import json

BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test health check endpoint"""
    print("\n1. Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_register_medicine():
    """Test medicine registration (requires an image file)"""
    print("\n2. Testing Medicine Registration...")
    
    # Check if test image exists
    test_image = "test_medicine_back.jpg"
    if not os.path.exists(test_image):
        print(f"   ⚠️  Test image '{test_image}' not found. Skipping...")
        print("   Create a test image or modify the path in this script.")
        return None
    
    files = {'file': open(test_image, 'rb')}
    data = {
        'medicine_name': 'Paracetamol 500mg',
        'user_id': 'test_user_123',
        'dosage': '500mg'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/medicine/register", files=files, data=data)
        print(f"   Status: {response.status_code}")
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            medicine_id = result.get('medicine_id')
            print(f"   ✅ Medicine registered with ID: {medicine_id}")
            return medicine_id
        else:
            print(f"   ❌ Registration failed")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None
    finally:
        files['file'].close()

def test_list_medicines():
    """Test listing medicines"""
    print("\n3. Testing List Medicines...")
    params = {'user_id': 'test_user_123'}
    response = requests.get(f"{BASE_URL}/api/medicine/list", params=params)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {json.dumps(result, indent=2)}")
    return response.status_code == 200

def test_verify_medicine(medicine_id=None):
    """Test medicine verification (requires an image file)"""
    print("\n4. Testing Medicine Verification...")
    
    test_image = "test_patient_photo.jpg"
    if not os.path.exists(test_image):
        print(f"   ⚠️  Test image '{test_image}' not found. Skipping...")
        print("   Create a test image or modify the path in this script.")
        return None
    
    files = {'file': open(test_image, 'rb')}
    data = {'user_id': 'test_user_123'}
    if medicine_id:
        data['medicine_id'] = medicine_id
    
    try:
        response = requests.post(f"{BASE_URL}/api/medicine/verify", files=files, data=data)
        print(f"   Status: {response.status_code}")
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            verified = result.get('verified', False)
            status = "✅ MATCH" if verified else "❌ MISMATCH"
            print(f"   {status}")
            return result.get('verification_id')
        else:
            print(f"   ❌ Verification failed")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None
    finally:
        files['file'].close()

def test_list_verifications():
    """Test listing verifications"""
    print("\n5. Testing List Verifications...")
    params = {'user_id': 'test_user_123'}
    response = requests.get(f"{BASE_URL}/api/medicine/verifications", params=params)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {json.dumps(result, indent=2)}")
    return response.status_code == 200

def main():
    """Run all tests"""
    print("=" * 60)
    print("Medicine Verification API Test Suite")
    print("=" * 60)
    print(f"\nTesting API at: {BASE_URL}")
    print("\n⚠️  Note: Image file tests will be skipped if test images are not found.")
    
    # Run tests
    health_ok = test_health_check()
    
    if not health_ok:
        print("\n❌ Health check failed. Is the server running?")
        print("   Start the server with: python app.py")
        return
    
    medicine_id = test_register_medicine()
    test_list_medicines()
    
    if medicine_id:
        test_verify_medicine(medicine_id)
    else:
        test_verify_medicine()
    
    test_list_verifications()
    
    print("\n" + "=" * 60)
    print("✅ Test suite completed!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Could not connect to the API.")
        print("   Make sure the Flask server is running:")
        print("   python app.py")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
