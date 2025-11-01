"""
Medicine Manager Module
Handles medicine registration, storage, and verification records
Uses JSON file-based storage (can be replaced with database)
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid


class MedicineManager:
    """Manages medicine registration and verification records"""
    
    def __init__(self, data_dir: str = 'data'):
        """
        Initialize Medicine Manager
        Args:
            data_dir: Directory to store data files
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        self.medicines_file = os.path.join(data_dir, 'medicines.json')
        self.verifications_file = os.path.join(data_dir, 'verifications.json')
        
        # Initialize data files if they don't exist
        self._ensure_data_files()
    
    def _ensure_data_files(self):
        """Create data files if they don't exist"""
        if not os.path.exists(self.medicines_file):
            with open(self.medicines_file, 'w') as f:
                json.dump({}, f)
        
        if not os.path.exists(self.verifications_file):
            with open(self.verifications_file, 'w') as f:
                json.dump({}, f)
    
    def _load_medicines(self) -> Dict:
        """Load medicines from JSON file"""
        try:
            with open(self.medicines_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_medicines(self, medicines: Dict):
        """Save medicines to JSON file"""
        with open(self.medicines_file, 'w') as f:
            json.dump(medicines, f, indent=2)
    
    def _load_verifications(self) -> Dict:
        """Load verifications from JSON file"""
        try:
            with open(self.verifications_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_verifications(self, verifications: Dict):
        """Save verifications to JSON file"""
        with open(self.verifications_file, 'w') as f:
            json.dump(verifications, f, indent=2)
    
    def register_medicine(self, medicine_data: Dict) -> str:
        """
        Register a new medicine
        Args:
            medicine_data: Dictionary containing medicine information
        Returns:
            Medicine ID
        """
        medicines = self._load_medicines()
        
        # Generate unique ID
        medicine_id = str(uuid.uuid4())
        
        # Add medicine data
        medicine_record = {
            'medicine_id': medicine_id,
            **medicine_data
        }
        
        medicines[medicine_id] = medicine_record
        
        # Organize by user_id for faster lookup
        user_id = medicine_data.get('user_id')
        if user_id and 'users' not in medicines:
            medicines['users'] = {}
        if user_id:
            if 'users' not in medicines:
                medicines['users'] = {}
            if user_id not in medicines['users']:
                medicines['users'][user_id] = []
            medicines['users'][user_id].append(medicine_id)
        
        self._save_medicines(medicines)
        
        return medicine_id
    
    def get_medicine(self, medicine_id: str) -> Optional[Dict]:
        """
        Get medicine by ID
        Args:
            medicine_id: Medicine ID
        Returns:
            Medicine record or None
        """
        medicines = self._load_medicines()
        return medicines.get(medicine_id)
    
    def get_user_medicines(self, user_id: str) -> List[Dict]:
        """
        Get all medicines for a user
        Args:
            user_id: User ID
        Returns:
            List of medicine records
        """
        medicines = self._load_medicines()
        user_medicines = []
        
        # Check user index first
        if 'users' in medicines and user_id in medicines['users']:
            for med_id in medicines['users'][user_id]:
                if med_id in medicines:
                    user_medicines.append(medicines[med_id])
        else:
            # Fallback: search all medicines
            for med_id, med_data in medicines.items():
                if med_id == 'users':
                    continue
                if med_data.get('user_id') == user_id:
                    user_medicines.append(med_data)
        
        return user_medicines
    
    def delete_medicine(self, medicine_id: str) -> bool:
        """
        Delete a medicine
        Args:
            medicine_id: Medicine ID
        Returns:
            True if deleted, False if not found
        """
        medicines = self._load_medicines()
        
        if medicine_id not in medicines:
            return False
        
        # Remove from user index
        med_data = medicines[medicine_id]
        user_id = med_data.get('user_id')
        if user_id and 'users' in medicines and user_id in medicines['users']:
            if medicine_id in medicines['users'][user_id]:
                medicines['users'][user_id].remove(medicine_id)
        
        # Delete medicine
        del medicines[medicine_id]
        self._save_medicines(medicines)
        
        return True
    
    def save_verification(self, verification_data: Dict) -> str:
        """
        Save a verification record
        Args:
            verification_data: Verification data dictionary
        Returns:
            Verification ID
        """
        verifications = self._load_verifications()
        
        # Generate unique ID
        verification_id = str(uuid.uuid4())
        
        # Add verification data
        verification_record = {
            'verification_id': verification_id,
            **verification_data
        }
        
        verifications[verification_id] = verification_record
        
        # Organize by user_id for faster lookup
        user_id = verification_data.get('user_id')
        if user_id and 'users' not in verifications:
            verifications['users'] = {}
        if user_id:
            if 'users' not in verifications:
                verifications['users'] = {}
            if user_id not in verifications['users']:
                verifications['users'][user_id] = []
            verifications['users'][user_id].append(verification_id)
        
        self._save_verifications(verifications)
        
        return verification_id
    
    def get_user_verifications(self, user_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        Get all verifications for a user
        Args:
            user_id: User ID
            limit: Optional limit on number of results
        Returns:
            List of verification records (newest first)
        """
        verifications = self._load_verifications()
        user_verifications = []
        
        # Check user index first
        if 'users' in verifications and user_id in verifications['users']:
            for verif_id in verifications['users'][user_id]:
                if verif_id in verifications:
                    user_verifications.append(verifications[verif_id])
        else:
            # Fallback: search all verifications
            for verif_id, verif_data in verifications.items():
                if verif_id == 'users':
                    continue
                if verif_data.get('user_id') == user_id:
                    user_verifications.append(verif_data)
        
        # Sort by date (newest first)
        user_verifications.sort(key=lambda x: x.get('verified_at', ''), reverse=True)
        
        if limit:
            user_verifications = user_verifications[:limit]
        
        return user_verifications
    
    def get_verification(self, verification_id: str) -> Optional[Dict]:
        """
        Get verification by ID
        Args:
            verification_id: Verification ID
        Returns:
            Verification record or None
        """
        verifications = self._load_verifications()
        return verifications.get(verification_id)
