# Medicine Photo Verification System

A Python Flask application that helps verify if patients are taking the correct medicines by comparing photos using OCR (Optical Character Recognition) technology.

## Features

✅ **Medicine Registration**: Upload photos of medicine back labels with medicine names  
✅ **Photo Verification**: Take photos of medicines and verify they match registered medicines  
✅ **OCR Text Extraction**: Automatically extract text from medicine photos  
✅ **Smart Matching**: Compare patient photos with registered medicines using AI/OCR  
✅ **Notifications**: Automatically notify doctors and family when:
   - Medicine matches ✅
   - Medicine doesn't match ⚠️ (ALERT)

## System Requirements

- Python 3.8 or higher
- Tesseract OCR installed on your system

### Installing Tesseract OCR

**Windows:**
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install and add to PATH

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

## Installation

1. **Clone or navigate to the project directory:**
```bash
cd medicine_verification
```

2. **Create a virtual environment (recommended):**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## Configuration

### 1. Notification Setup

Edit `config/notification_config.json` to configure email/SMS notifications:

```json
{
  "email": {
    "enabled": true,
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "sender_email": "your-email@gmail.com",
    "sender_password": "your-app-password",
    "use_tls": true
  },
  "sms": {
    "enabled": false,
    "provider": "twilio",
    "twilio_account_sid": "",
    "twilio_auth_token": "",
    "twilio_phone_number": ""
  }
}
```

### 2. User Contacts

Create `config/user_contacts.json` to map users to their doctors and family:

```json
{
  "user123": {
    "doctor": {
      "email": "doctor@example.com",
      "phone": "+1234567890",
      "name": "Dr. Smith"
    },
    "family": [
      {
        "email": "family@example.com",
        "phone": "+1234567891",
        "name": "Family Member"
      }
    ]
  }
}
```

## Running the Application

Start the Flask server:

```bash
python app.py
```

The API will be available at: `http://localhost:5000`

## API Endpoints

### 1. Register Medicine (with back photo)

**POST** `/api/medicine/register`

Register a new medicine with a photo of the back label.

**Form Data:**
- `file`: Image file (required)
- `medicine_name`: Name of medicine (required)
- `user_id`: User ID (required)
- `dosage`: Dosage information (optional)

**Example using curl:**
```bash
curl -X POST http://localhost:5000/api/medicine/register \
  -F "file=@medicine_back.jpg" \
  -F "medicine_name=Paracetamol 500mg" \
  -F "user_id=user123" \
  -F "dosage=500mg"
```

**Response:**
```json
{
  "success": true,
  "medicine_id": "abc123...",
  "message": "Medicine \"Paracetamol 500mg\" registered successfully",
  "ocr_extracted_text": "...",
  "medicine_data": {...}
}
```

### 2. Verify Medicine Photo

**POST** `/api/medicine/verify`

Verify a patient's medicine photo against registered medicines.

**Form Data:**
- `file`: Image file (required)
- `user_id`: User ID (required)
- `medicine_id`: Specific medicine ID to verify (optional)

**Example using curl:**
```bash
curl -X POST http://localhost:5000/api/medicine/verify \
  -F "file=@patient_photo.jpg" \
  -F "user_id=user123" \
  -F "medicine_id=abc123"
```

**Response (Match):**
```json
{
  "verified": true,
  "verification_id": "xyz789...",
  "message": "Medicine verification: ✅ MATCH",
  "best_match": {
    "medicine_id": "abc123",
    "medicine_name": "Paracetamol 500mg",
    "match": true,
    "confidence": 0.95
  },
  "notifications_sent": {
    "sent_to_doctor": true,
    "sent_to_family": true,
    "total_sent": 2
  }
}
```

**Response (Mismatch):**
```json
{
  "verified": false,
  "verification_id": "xyz789...",
  "message": "Medicine verification: ❌ MISMATCH",
  "best_match": {
    "medicine_id": "abc123",
    "medicine_name": "Paracetamol 500mg",
    "match": false,
    "confidence": 0.35
  },
  "notifications_sent": {
    "sent_to_doctor": true,
    "sent_to_family": true,
    "total_sent": 2
  }
}
```

### 3. List User Medicines

**GET** `/api/medicine/list?user_id=user123`

Get all registered medicines for a user.

**Response:**
```json
{
  "success": true,
  "medicines": [...],
  "count": 5
}
```

### 4. List Verifications

**GET** `/api/medicine/verifications?user_id=user123`

Get all verification records for a user.

**Response:**
```json
{
  "success": true,
  "verifications": [...],
  "count": 10
}
```

### 5. Delete Medicine

**DELETE** `/api/medicine/<medicine_id>`

Delete a registered medicine.

## How It Works

1. **Registration Phase:**
   - User uploads photo of medicine back label
   - System extracts text using OCR
   - Medicine is registered with name and OCR text

2. **Verification Phase:**
   - Patient takes photo of medicine
   - System extracts text using OCR
   - Compares patient photo OCR with registered medicine
   - Calculates confidence score and match status

3. **Notification Phase:**
   - If match: ✅ Send confirmation to doctor and family
   - If mismatch: ⚠️ Send ALERT to doctor and family immediately

## OCR Engines

The system supports two OCR engines:

1. **Tesseract OCR** (default) - Fast, lightweight
2. **EasyOCR** - More accurate, requires more resources

To switch engines, modify `OCRReader` initialization in `ocr_reader.py`.

## Testing

You can test the API using:

1. **Python requests:**
```python
import requests

# Register medicine
files = {'file': open('medicine_back.jpg', 'rb')}
data = {
    'medicine_name': 'Paracetamol',
    'user_id': 'user123'
}
response = requests.post('http://localhost:5000/api/medicine/register', 
                        files=files, data=data)
print(response.json())
```

2. **Postman/Insomnia** - Import the endpoints and test with image files

3. **Frontend Integration** - The API supports CORS and can be called from web/mobile apps

## Project Structure

```
medicine_verification/
├── app.py                      # Main Flask application
├── ocr_reader.py              # OCR text extraction
├── medicine_manager.py        # Medicine storage & retrieval
├── notification_service.py    # Email/SMS notifications
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── config/                    # Configuration files
│   ├── notification_config.json
│   └── user_contacts.json
├── data/                      # Data storage (JSON files)
│   ├── medicines.json
│   └── verifications.json
├── uploads/                   # Uploaded images
│   ├── medicine_back/
│   └── patient_photos/
└── logs/                      # Notification logs
    └── notifications.log
```

## Production Deployment

For production:

1. Use a production WSGI server (gunicorn, uWSGI)
2. Set up proper database (PostgreSQL, MongoDB) instead of JSON files
3. Configure proper file storage (S3, Cloud Storage)
4. Set up SSL/HTTPS
5. Configure environment variables for sensitive data
6. Use process manager (systemd, supervisor)
7. Enable proper logging and monitoring

**Example with gunicorn:**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Troubleshooting

### OCR not working:
- Ensure Tesseract is installed and in PATH
- Check image quality (clear, well-lit photos work best)
- Try preprocessing images (the system does this automatically)

### Notifications not sending:
- Check `config/notification_config.json`
- Verify email/SMS credentials
- Check logs in `logs/notifications.log`

### File upload errors:
- Check file size limits (default: 16MB)
- Ensure upload directories have write permissions

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions, please check the configuration files and logs first. Ensure all dependencies are properly installed.
