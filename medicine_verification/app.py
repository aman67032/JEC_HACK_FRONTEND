"""
Medicine Photo Verification System
A Python Flask application that:
1. Allows users to register medicines with photos of the back label
2. Verifies patient medicine photos against registered medicines
3. Sends notifications to doctors and family based on verification results
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import json
from pathlib import Path

from ocr_reader import OCRReader
from medicine_manager import MedicineManager
from notification_service import NotificationService

# Optional Firebase integration
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️  Firebase Admin SDK not available. Install: pip install firebase-admin")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

# Create upload directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(f'{UPLOAD_FOLDER}/medicine_back', exist_ok=True)
os.makedirs(f'{UPLOAD_FOLDER}/patient_photos', exist_ok=True)

# Create other necessary directories
os.makedirs('data', exist_ok=True)
os.makedirs('config', exist_ok=True)
os.makedirs('logs', exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Initialize services
ocr_reader = OCRReader()
medicine_manager = MedicineManager()
notification_service = NotificationService()


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Medicine Verification System'})


@app.route('/api/medicine/register', methods=['POST'])
def register_medicine():
    """
    Register a new medicine with photo of the back label
    Accepts either:
    1. Form data with file upload
    2. JSON with Firebase Storage URL (imageUrl)
    
    Expected form data OR JSON:
    - file: Image file (optional if imageUrl provided)
    - imageUrl: Firebase Storage URL (optional if file provided)
    - medicine_name: Name of the medicine (required)
    - user_id: ID of the user adding the medicine (required)
    - dosage: Optional dosage information
    """
    try:
        # Check if JSON request (Firebase URL) or form data (file upload)
        is_json = request.content_type and 'application/json' in request.content_type
        
        if is_json:
            data = request.get_json()
            image_url = data.get('imageUrl', '').strip()
            medicine_name = data.get('medicine_name', '').strip()
            user_id = data.get('user_id', '').strip()
            dosage = data.get('dosage', '').strip()
            
            if not image_url:
                return jsonify({'error': 'imageUrl is required when using JSON'}), 400
        else:
            # Form data upload
            if 'file' not in request.files:
                # Check if imageUrl provided in form data
                image_url = request.form.get('imageUrl', '').strip()
                if not image_url:
                    return jsonify({'error': 'Either file or imageUrl is required'}), 400
            else:
                image_url = None
                file = request.files['file']
                
                if file.filename == '':
                    return jsonify({'error': 'No file selected'}), 400
                
                if not allowed_file(file.filename):
                    return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'}), 400
            
            medicine_name = request.form.get('medicine_name', '').strip()
            user_id = request.form.get('user_id', '').strip()
            dosage = request.form.get('dosage', '').strip()
        
        if not medicine_name:
            return jsonify({'error': 'Medicine name is required'}), 400
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Extract text using OCR
        if image_url:
            # Use Firebase Storage URL
            ocr_text = ocr_reader.extract_text_from_url(image_url)
            photo_path_or_url = image_url
        else:
            # Use uploaded file
            filename = secure_filename(f"{user_id}_{medicine_name}_{datetime.now().timestamp()}.{file.filename.rsplit('.', 1)[1].lower()}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'medicine_back', filename)
            file.save(filepath)
            ocr_text = ocr_reader.extract_text(filepath)
            photo_path_or_url = filepath
        
        # Register medicine
        medicine_data = {
            'medicine_name': medicine_name,
            'user_id': user_id,
            'back_photo_path': photo_path_or_url,  # Can be URL or path
            'back_photo_url': image_url if image_url else None,  # Store URL separately if provided
            'back_photo_ocr': ocr_text,
            'dosage': dosage,
            'registered_at': datetime.now().isoformat(),
            'verified': True  # Back photo contains the medicine name
        }
        
        medicine_id = medicine_manager.register_medicine(medicine_data)
        
        return jsonify({
            'success': True,
            'medicine_id': medicine_id,
            'message': f'Medicine "{medicine_name}" registered successfully',
            'ocr_extracted_text': ocr_text,
            'medicine_data': medicine_data
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in register_medicine: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicine/verify', methods=['POST'])
def verify_medicine():
    """
    Verify a patient's medicine photo against registered medicines
    Accepts either:
    1. Form data with file upload
    2. JSON with Firebase Storage URL (imageUrl)
    
    Expected form data OR JSON:
    - file: Image file (optional if imageUrl provided)
    - imageUrl: Firebase Storage URL (optional if file provided)
    - user_id: ID of the patient (required)
    - medicine_id: Optional - specific medicine ID to verify against
    """
    try:
        # Check if JSON request (Firebase URL) or form data (file upload)
        is_json = request.content_type and 'application/json' in request.content_type
        
        if is_json:
            data = request.get_json()
            image_url = data.get('imageUrl', '').strip()
            user_id = data.get('user_id', '').strip()
            medicine_id = data.get('medicine_id', '').strip()
            
            if not image_url:
                return jsonify({'error': 'imageUrl is required when using JSON'}), 400
        else:
            # Form data upload
            if 'file' not in request.files:
                # Check if imageUrl provided in form data
                image_url = request.form.get('imageUrl', '').strip()
                if not image_url:
                    return jsonify({'error': 'Either file or imageUrl is required'}), 400
            else:
                image_url = None
                file = request.files['file']
                
                if file.filename == '':
                    return jsonify({'error': 'No file selected'}), 400
                
                if not allowed_file(file.filename):
                    return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'}), 400
            
            user_id = request.form.get('user_id', '').strip()
            medicine_id = request.form.get('medicine_id', '').strip()
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Extract text using OCR
        if image_url:
            # Use Firebase Storage URL
            patient_ocr_text = ocr_reader.extract_text_from_url(image_url)
            photo_path_or_url = image_url
        else:
            # Use uploaded file
            filename = secure_filename(f"{user_id}_patient_{datetime.now().timestamp()}.{file.filename.rsplit('.', 1)[1].lower()}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'patient_photos', filename)
            file.save(filepath)
            patient_ocr_text = ocr_reader.extract_text(filepath)
            photo_path_or_url = filepath
        
        # Get registered medicines for the user
        if medicine_id:
            # Verify against specific medicine
            registered_medicines = [medicine_manager.get_medicine(medicine_id)]
            registered_medicines = [m for m in registered_medicines if m]
        else:
            # Verify against all user's medicines
            registered_medicines = medicine_manager.get_user_medicines(user_id)
        
        if not registered_medicines:
            return jsonify({
                'verified': False,
                'message': 'No registered medicines found for this user',
                'patient_ocr_text': patient_ocr_text
            }), 200
        
        # Compare patient photo OCR with registered medicines
        verification_results = []
        for medicine in registered_medicines:
            match_result = ocr_reader.compare_text(
                patient_ocr_text, 
                medicine['medicine_name'],
                medicine.get('back_photo_ocr', '')
            )
            
            verification_results.append({
                'medicine_id': medicine['medicine_id'],
                'medicine_name': medicine['medicine_name'],
                'match': match_result['match'],
                'confidence': match_result['confidence'],
                'match_details': match_result
            })
        
        # Find best match
        best_match = max(verification_results, key=lambda x: x['confidence'])
        is_verified = best_match['match']
        
        # Prepare verification record
        verification_data = {
            'user_id': user_id,
            'patient_photo_path': photo_path_or_url,  # Can be URL or path
            'patient_photo_url': image_url if image_url else None,  # Store URL separately if provided
            'patient_ocr_text': patient_ocr_text,
            'verification_results': verification_results,
            'best_match': best_match,
            'verified': is_verified,
            'verified_at': datetime.now().isoformat()
        }
        
        # Save verification record
        verification_id = medicine_manager.save_verification(verification_data)
        
        # Send notifications based on verification result
        notification_status = notification_service.send_verification_notification(
            user_id=user_id,
            verification_data=verification_data,
            is_verified=is_verified
        )
        
        return jsonify({
            'verified': is_verified,
            'verification_id': verification_id,
            'message': f'Medicine verification: {"✅ MATCH" if is_verified else "❌ MISMATCH"}',
            'best_match': best_match,
            'all_results': verification_results,
            'patient_ocr_text': patient_ocr_text,
            'notifications_sent': notification_status
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicine/list', methods=['GET'])
def list_medicines():
    """Get all registered medicines for a user"""
    try:
        user_id = request.args.get('user_id', '').strip()
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        medicines = medicine_manager.get_user_medicines(user_id)
        return jsonify({
            'success': True,
            'medicines': medicines,
            'count': len(medicines)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicine/verifications', methods=['GET'])
def list_verifications():
    """Get all verification records for a user"""
    try:
        user_id = request.args.get('user_id', '').strip()
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        verifications = medicine_manager.get_user_verifications(user_id)
        return jsonify({
            'success': True,
            'verifications': verifications,
            'count': len(verifications)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicine/<medicine_id>', methods=['DELETE'])
def delete_medicine(medicine_id):
    """Delete a registered medicine"""
    try:
        success = medicine_manager.delete_medicine(medicine_id)
        if success:
            return jsonify({'success': True, 'message': 'Medicine deleted successfully'}), 200
        else:
            return jsonify({'error': 'Medicine not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting Medicine Verification System...")
    print("📋 API Endpoints:")
    print("   POST /api/medicine/register - Register medicine with back photo")
    print("   POST /api/medicine/verify - Verify patient medicine photo")
    print("   GET  /api/medicine/list?user_id=XXX - List user medicines")
    print("   GET  /api/medicine/verifications?user_id=XXX - List verifications")
    print("   DELETE /api/medicine/<id> - Delete medicine")
    print("\n🔗 API running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
