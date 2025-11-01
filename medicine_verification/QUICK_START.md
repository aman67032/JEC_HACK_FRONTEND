# Quick Start Guide

## Step 1: Install Tesseract OCR

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Install and restart terminal

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

## Step 2: Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Step 3: Start the Server

```bash
python app.py
```

You should see:
```
🚀 Starting Medicine Verification System...
📋 API Endpoints:
   POST /api/medicine/register - Register medicine with back photo
   POST /api/medicine/verify - Verify patient medicine photo
   ...
🔗 API running on http://localhost:5000
```

## Step 4: Test the API

### Using Python (test script):

```bash
python test_api.py
```

### Using curl:

**1. Register a medicine:**
```bash
curl -X POST http://localhost:5000/api/medicine/register \
  -F "file=@your_medicine_back_photo.jpg" \
  -F "medicine_name=Paracetamol 500mg" \
  -F "user_id=user123" \
  -F "dosage=500mg"
```

**2. Verify a medicine photo:**
```bash
curl -X POST http://localhost:5000/api/medicine/verify \
  -F "file=@patient_photo.jpg" \
  -F "user_id=user123"
```

**3. List medicines:**
```bash
curl http://localhost:5000/api/medicine/list?user_id=user123
```

## Step 5: Configure Notifications (Optional)

1. Edit `config/notification_config.json`:
   - Enable email notifications
   - Add SMTP credentials
   - Configure SMS (if using Twilio)

2. Edit `config/user_contacts.json`:
   - Add doctor email/phone for each user
   - Add family member contacts

## Example Workflow

1. **Doctor/User adds medicine:**
   - Takes photo of medicine back label
   - Calls `/api/medicine/register` with photo + medicine name
   - System stores medicine with OCR text

2. **Patient takes medicine:**
   - Takes photo of medicine before taking it
   - Calls `/api/medicine/verify` with photo
   - System:
     - Extracts text from photo
     - Compares with registered medicines
     - Sends notifications:
       - ✅ **Match** → Notifies doctor & family (success)
       - ❌ **Mismatch** → Alerts doctor & family immediately

## Troubleshooting

**OCR not working?**
- Ensure Tesseract is installed and in PATH
- Test: `tesseract --version`
- Try clear, well-lit photos

**Import errors?**
- Make sure virtual environment is activated
- Run: `pip install -r requirements.txt` again

**Server won't start?**
- Check if port 5000 is available
- Try changing port in `app.py`: `app.run(port=5001)`

## Next Steps

- Read full `README.md` for detailed documentation
- Integrate with your frontend/mobile app
- Set up production deployment
- Configure Firebase/database for production use
