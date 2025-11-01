# Integration Guide: Python Flask API with Next.js Dashboard

This guide explains how the Python Flask Medicine Verification API integrates with your Next.js dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Dashboard (Frontend)                                │
│  - UploadSection.tsx                                         │
│  - MedicineList.tsx                                          │
│  - VerificationModal.tsx                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 1. Upload image to Firebase Storage
                  │    → Get Firebase Storage URL
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Routes                                          │
│  - /api/medicine/register                                    │
│  - /api/medicine/verify                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 2. Forward request with Firebase URL
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Python Flask API (http://localhost:5000)                    │
│  - /api/medicine/register                                    │
│  - /api/medicine/verify                                       │
│  - Downloads image from Firebase URL                         │
│  - Runs OCR (Tesseract/EasyOCR)                              │
│  - Compares medicines                                        │
│  - Returns verification results                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 3. Results stored in Firestore
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Firebase Firestore                                          │
│  - registeredMedicines collection                            │
│  - medicineVerifications collection                          │
│  - notifications collection (for alerts)                     │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Start Python Flask API

```bash
cd medicine_verification
python app.py
```

The API will run on `http://localhost:5000`

### 2. Configure Environment Variable

Add to your `.env.local` or Vercel environment variables:

```env
PYTHON_MEDICINE_API_URL=http://localhost:5000
```

For production, use your deployed Python API URL:
```env
PYTHON_MEDICINE_API_URL=https://your-python-api.herokuapp.com
```

### 3. Use the API from Frontend

#### Register Medicine (from UploadSection or MedicineList)

```typescript
async function registerMedicine(imageUrl: string, medicineName: string) {
  const user = firebaseAuth().currentUser;
  if (!user) return;

  const response = await fetch("/api/medicine/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: imageUrl, // Firebase Storage URL
      medicine_name: medicineName,
      user_id: user.uid,
      dosage: "500mg"
    })
  });

  const data = await response.json();
  console.log("Medicine registered:", data);
}
```

#### Verify Medicine (from VerificationModal or ReminderSection)

```typescript
async function verifyMedicine(imageUrl: string) {
  const user = firebaseAuth().currentUser;
  if (!user) return;

  const response = await fetch("/api/medicine/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: imageUrl, // Firebase Storage URL
      user_id: user.uid,
      medicine_id: "optional-medicine-id"
    })
  });

  const data = await response.json();
  
  if (data.verified) {
    console.log("✅ Medicine verified successfully!");
  } else {
    console.log("❌ Medicine mismatch detected!");
    // Alerts automatically sent to doctor and family
  }
}
```

## Flow Example

### Complete Medicine Registration Flow

1. **User uploads medicine back photo:**
   ```typescript
   // In UploadSection or MedicineList component
   const file = // ... from file input
   
   // Upload to Firebase Storage
   const storageRef = ref(firebaseStorage(), `medicines/${userId}/${Date.now()}.jpg`);
   await uploadBytes(storageRef, file);
   const imageUrl = await getDownloadURL(storageRef);
   
   // Call Next.js API
   await fetch("/api/medicine/register", {
     method: "POST",
     body: JSON.stringify({
       imageUrl: imageUrl,
       medicine_name: "Paracetamol 500mg",
       user_id: userId,
       dosage: "500mg"
     })
   });
   ```

2. **Next.js API forwards to Python Flask:**
   - Next.js API receives request
   - Forwards to Python Flask API at `PYTHON_MEDICINE_API_URL`
   - Python API downloads image from Firebase URL
   - Runs OCR extraction
   - Returns results

3. **Python Flask API processes:**
   - Downloads image from Firebase Storage URL
   - Extracts text using Tesseract/EasyOCR
   - Stores medicine data
   - Returns medicine ID and OCR text

4. **Next.js API stores in Firestore:**
   - Stores medicine in `users/{userId}/registeredMedicines/{medicineId}`
   - Makes data available to dashboard

### Complete Verification Flow

1. **Patient takes medicine photo:**
   ```typescript
   // In VerificationModal or ReminderSection
   const file = // ... from camera/file input
   
   // Upload to Firebase Storage
   const storageRef = ref(firebaseStorage(), `verifications/${userId}/${Date.now()}.jpg`);
   await uploadBytes(storageRef, file);
   const imageUrl = await getDownloadURL(storageRef);
   
   // Call Next.js API
   const response = await fetch("/api/medicine/verify", {
     method: "POST",
     body: JSON.stringify({
       imageUrl: imageUrl,
       user_id: userId,
       medicine_id: reminder.medicineId // optional
     })
   });
   
   const result = await response.json();
   ```

2. **Python Flask API verifies:**
   - Downloads patient photo from Firebase URL
   - Extracts text using OCR
   - Compares with registered medicines
   - Calculates match confidence
   - Returns verification result

3. **Notifications sent automatically:**
   - If match: Success notification to doctor & family
   - If mismatch: Alert notification to doctor & family
   - Stored in Firestore `notifications` collection
   - Can trigger FCM push notifications

## Integration with Existing Components

### Update UploadSection.tsx

You can add medicine registration functionality:

```typescript
async function registerMedicineFromUpload(imageUrl: string, medicineName: string) {
  const response = await fetch("/api/medicine/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: imageUrl,
      medicine_name: medicineName,
      user_id: firebaseAuth().currentUser?.uid,
      dosage: ""
    })
  });
  return await response.json();
}
```

### Update VerificationModal.tsx

Replace the existing OCR verification with Python API:

```typescript
// Instead of client-side Tesseract
async function verifyWithPythonAPI(photoUrl: string) {
  const response = await fetch("/api/medicine/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: photoUrl,
      user_id: firebaseAuth().currentUser?.uid,
      medicine_id: reminder.medicineId
    })
  });
  
  const data = await response.json();
  
  if (data.verified) {
    // Success - medicine matches
    alert("✅ Medicine verified!");
  } else {
    // Mismatch - alerts already sent
    alert("⚠️ Medicine mismatch detected! Doctor and family have been notified.");
  }
  
  return data;
}
```

## Environment Variables

### Next.js (.env.local)
```env
PYTHON_MEDICINE_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Python Flask (.env or environment)
```env
# Optional: For email notifications
DEFAULT_DOCTOR_EMAIL=doctor@example.com
DEFAULT_FAMILY_EMAIL=family@example.com

# Optional: For SMS notifications
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

## Production Deployment

### Deploy Python Flask API

Options:
- **Heroku**: `heroku create your-api-name`
- **Railway**: Connect GitHub repo
- **AWS Lambda**: Use Serverless Framework
- **DigitalOcean**: App Platform
- **Google Cloud Run**: Containerized deployment

Update `PYTHON_MEDICINE_API_URL` to your production URL.

### Update Next.js API Routes

The Next.js API routes automatically use the environment variable, so just update `.env`:

```env
PYTHON_MEDICINE_API_URL=https://your-python-api.herokuapp.com
```

## Testing

### Test Python API directly:

```bash
curl -X POST http://localhost:5000/api/medicine/register \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://firebasestorage.googleapis.com/...",
    "medicine_name": "Paracetamol",
    "user_id": "test123",
    "dosage": "500mg"
  }'
```

### Test through Next.js API:

```bash
curl -X POST http://localhost:3000/api/medicine/register \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://firebasestorage.googleapis.com/...",
    "medicine_name": "Paracetamol",
    "user_id": "test123",
    "dosage": "500mg"
  }'
```

## Troubleshooting

### Python API not responding
- Check if Flask server is running: `python app.py`
- Verify port 5000 is accessible
- Check firewall settings

### Firebase URL access issues
- Ensure Firebase Storage rules allow public read access (for temporary download)
- Or configure Firebase Storage with proper authentication
- Python API needs internet access to download images

### OCR not working
- Install Tesseract OCR: `brew install tesseract` (Mac) or download installer (Windows)
- Verify Tesseract is in PATH: `tesseract --version`
- Check image quality - clear, well-lit photos work best

### Notifications not sending
- Check Firestore notifications collection
- Verify doctor/caregiver IDs in user document
- Check notification service configuration

## Benefits of This Integration

✅ **Separation of Concerns**: OCR processing handled by Python  
✅ **Firebase Integration**: Uses existing Firebase Storage and Firestore  
✅ **Flexible**: Works with both file uploads and Firebase URLs  
✅ **Scalable**: Python API can be deployed separately  
✅ **Maintainable**: Clear API boundaries between Next.js and Python
