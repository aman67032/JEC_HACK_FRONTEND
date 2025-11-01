"""
Notification Service Module
Handles sending notifications to doctors and family members
Supports email, SMS, and can integrate with Firebase/FCM
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime

try:
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    EMAIL_AVAILABLE = True
except ImportError:
    EMAIL_AVAILABLE = False
    print("⚠️  Email libraries not available. Install: pip install email (usually included)")


class NotificationService:
    """Service for sending notifications to doctors and family"""
    
    def __init__(self, config_file: str = 'config/notification_config.json'):
        """
        Initialize Notification Service
        Args:
            config_file: Path to configuration file
        """
        self.config_file = config_file
        self.config = self._load_config()
        
        # Ensure config directory exists
        config_dir = os.path.dirname(config_file)
        if config_dir:  # Only create if there's a directory path
            os.makedirs(config_dir, exist_ok=True)
    
    def _load_config(self) -> Dict:
        """Load notification configuration"""
        default_config = {
            'email': {
                'enabled': False,
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'sender_email': '',
                'sender_password': '',
                'use_tls': True
            },
            'sms': {
                'enabled': False,
                'provider': 'twilio',  # or 'custom'
                'twilio_account_sid': '',
                'twilio_auth_token': '',
                'twilio_phone_number': ''
            },
            'firebase': {
                'enabled': False,
                'firebase_config_path': ''
            },
            'notification_logs': True,
            'log_file': 'logs/notifications.log'
        }
        
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    loaded_config = json.load(f)
                    # Merge with defaults
                    for key, value in default_config.items():
                        if key not in loaded_config:
                            loaded_config[key] = value
                    return loaded_config
            except:
                pass
        
        # Save default config
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        return default_config
    
    def send_verification_notification(
        self,
        user_id: str,
        verification_data: Dict,
        is_verified: bool
    ) -> Dict:
        """
        Send notifications based on verification result
        Args:
            user_id: Patient user ID
            verification_data: Verification data dictionary
            is_verified: Whether medicine matched (True) or not (False)
        Returns:
            Dictionary with notification status
        """
        # Get user's doctor and family contacts
        contacts = self._get_user_contacts(user_id)
        
        notification_status = {
            'sent_to_doctor': False,
            'sent_to_family': False,
            'total_sent': 0,
            'errors': []
        }
        
        if not contacts:
            notification_status['errors'].append('No contacts found for user')
            return notification_status
        
        # Prepare notification message
        medicine_name = verification_data.get('best_match', {}).get('medicine_name', 'Unknown')
        confidence = verification_data.get('best_match', {}).get('confidence', 0)
        
        if is_verified:
            subject = f"✅ Medicine Verified - {medicine_name}"
            message = self._create_match_message(user_id, medicine_name, verification_data, confidence)
            priority = 'normal'
        else:
            subject = f"⚠️ MEDICINE MISMATCH ALERT - {medicine_name}"
            message = self._create_mismatch_message(user_id, medicine_name, verification_data, confidence)
            priority = 'high'
        
        # Send to doctor
        if contacts.get('doctor'):
            doctor_notified = self._send_notification(
                contacts['doctor'],
                subject,
                message,
                priority=priority
            )
            notification_status['sent_to_doctor'] = doctor_notified
            if doctor_notified:
                notification_status['total_sent'] += 1
        
        # Send to family members
        if contacts.get('family'):
            family_count = 0
            for family_member in contacts['family']:
                if self._send_notification(
                    family_member,
                    subject,
                    message,
                    priority=priority
                ):
                    family_count += 1
            
            notification_status['sent_to_family'] = family_count > 0
            notification_status['total_sent'] += family_count
        
        # Log notification
        if self.config.get('notification_logs'):
            self._log_notification(user_id, verification_data, is_verified, notification_status)
        
        return notification_status
    
    def _create_match_message(self, user_id: str, medicine_name: str, verification_data: Dict, confidence: float) -> str:
        """Create message for successful verification"""
        return f"""
✅ MEDICINE VERIFICATION SUCCESSFUL

Patient ID: {user_id}
Medicine Name: {medicine_name}
Verification Confidence: {confidence * 100:.1f}%
Verified At: {verification_data.get('verified_at', datetime.now().isoformat())}

The patient has correctly taken their prescribed medicine.

This is an automated notification from the Medicine Verification System.
"""
    
    def _create_mismatch_message(self, user_id: str, medicine_name: str, verification_data: Dict, confidence: float) -> str:
        """Create message for medicine mismatch"""
        patient_text = verification_data.get('patient_ocr_text', 'N/A')[:200]
        return f"""
⚠️ MEDICINE MISMATCH ALERT

Patient ID: {user_id}
Expected Medicine: {medicine_name}
Verification Confidence: {confidence * 100:.1f}%
Verified At: {verification_data.get('verified_at', datetime.now().isoformat())}

⚠️ WARNING: The medicine photo taken by the patient does not match the registered medicine.

Patient Photo OCR Text: {patient_text}

PLEASE CHECK IMMEDIATELY:
- Verify the patient has the correct medicine
- Ensure the patient understands which medicine to take
- Confirm proper medication compliance

This is an automated ALERT from the Medicine Verification System.
"""
    
    def _get_user_contacts(self, user_id: str) -> Dict:
        """
        Get doctor and family contacts for a user
        This should be replaced with actual database/Firebase query
        Args:
            user_id: User ID
        Returns:
            Dictionary with 'doctor' and 'family' keys
        """
        # Default contacts file (can be replaced with Firebase/database)
        contacts_file = 'config/user_contacts.json'
        
        if os.path.exists(contacts_file):
            try:
                with open(contacts_file, 'r') as f:
                    all_contacts = json.load(f)
                    return all_contacts.get(user_id, {})
            except:
                pass
        
        # Return default structure
        return {
            'doctor': {
                'email': os.getenv('DEFAULT_DOCTOR_EMAIL', ''),
                'phone': os.getenv('DEFAULT_DOCTOR_PHONE', ''),
                'name': 'Doctor'
            },
            'family': [
                {
                    'email': os.getenv('DEFAULT_FAMILY_EMAIL', ''),
                    'phone': os.getenv('DEFAULT_FAMILY_PHONE', ''),
                    'name': 'Family Member'
                }
            ]
        }
    
    def _send_notification(self, contact: Dict, subject: str, message: str, priority: str = 'normal') -> bool:
        """
        Send notification to a contact
        Args:
            contact: Contact dictionary with email/phone
            subject: Notification subject
            message: Notification message
            priority: Priority level ('normal' or 'high')
        Returns:
            True if sent successfully, False otherwise
        """
        sent = False
        
        # Try email first
        if contact.get('email') and self.config['email']['enabled']:
            sent = self._send_email(contact['email'], subject, message)
        
        # Try SMS if email failed or if priority is high
        if not sent or priority == 'high':
            if contact.get('phone') and self.config['sms']['enabled']:
                sms_sent = self._send_sms(contact['phone'], f"{subject}: {message[:100]}")
                if sms_sent:
                    sent = True
        
        return sent
    
    def _send_email(self, recipient: str, subject: str, message: str) -> bool:
        """Send email notification"""
        if not EMAIL_AVAILABLE:
            print(f"📧 Email not configured (would send to {recipient})")
            return False
        
        try:
            email_config = self.config['email']
            if not email_config['enabled']:
                print(f"📧 Email disabled in config")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(message, 'plain'))
            
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            
            if email_config['use_tls']:
                server.starttls()
            
            server.login(email_config['sender_email'], email_config['sender_password'])
            server.send_message(msg)
            server.quit()
            
            print(f"✅ Email sent to {recipient}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email to {recipient}: {e}")
            return False
    
    def _send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS notification"""
        sms_config = self.config['sms']
        if not sms_config['enabled']:
            print(f"📱 SMS disabled in config")
            return False
        
        # Twilio integration (if configured)
        if sms_config['provider'] == 'twilio' and sms_config.get('twilio_account_sid'):
            try:
                from twilio.rest import Client
                
                client = Client(
                    sms_config['twilio_account_sid'],
                    sms_config['twilio_auth_token']
                )
                
                client.messages.create(
                    body=message,
                    from_=sms_config['twilio_phone_number'],
                    to=phone_number
                )
                
                print(f"✅ SMS sent to {phone_number}")
                return True
            except Exception as e:
                print(f"❌ Failed to send SMS to {phone_number}: {e}")
                return False
        
        print(f"📱 SMS not configured (would send to {phone_number})")
        return False
    
    def _log_notification(self, user_id: str, verification_data: Dict, is_verified: bool, status: Dict):
        """Log notification to file"""
        log_file = self.config.get('log_file', 'logs/notifications.log')
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'verified': is_verified,
            'status': status
        }
        
        try:
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            print(f"Failed to log notification: {e}")
