"""
OCR Reader Module
Handles text extraction from medicine photos using OCR
Supports both Tesseract OCR and EasyOCR
Can work with local files or Firebase Storage URLs
"""

import os
import re
from typing import Dict, List, Optional
import difflib
import tempfile
import requests

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️  Tesseract not available. Install: pip install pytesseract pillow")

try:
    import easyocr
    EASYOCR_AVAILABLE = True
    # Initialize EasyOCR reader (this may take a moment on first run)
    try:
        easyocr_reader = easyocr.Reader(['en'], gpu=False)
    except:
        easyocr_reader = None
        EASYOCR_AVAILABLE = False
        print("⚠️  EasyOCR not properly initialized")
except ImportError:
    EASYOCR_AVAILABLE = False
    easyocr_reader = None
    print("⚠️  EasyOCR not available. Install: pip install easyocr")


class OCRReader:
    """OCR Reader for extracting text from medicine photos"""
    
    def __init__(self, ocr_engine='tesseract'):
        """
        Initialize OCR Reader
        Args:
            ocr_engine: 'tesseract' or 'easyocr' (default: tesseract)
        """
        self.ocr_engine = ocr_engine.lower()
        
        # Check if selected engine is available
        if self.ocr_engine == 'tesseract' and not TESSERACT_AVAILABLE:
            print("⚠️  Tesseract not available, falling back to EasyOCR")
            self.ocr_engine = 'easyocr'
        
        if self.ocr_engine == 'easyocr' and not EASYOCR_AVAILABLE:
            if TESSERACT_AVAILABLE:
                print("⚠️  EasyOCR not available, falling back to Tesseract")
                self.ocr_engine = 'tesseract'
            else:
                raise ImportError("Neither Tesseract nor EasyOCR is available. Please install one.")
    
    def extract_text(self, image_path_or_url: str, preprocess: bool = True) -> str:
        """
        Extract text from image using OCR
        Args:
            image_path_or_url: Path to image file OR Firebase Storage/HTTP URL
            preprocess: Whether to preprocess image before OCR
        Returns:
            Extracted text string
        """
        # Check if it's a URL (Firebase Storage or HTTP)
        if image_path_or_url.startswith('http://') or image_path_or_url.startswith('https://'):
            return self.extract_text_from_url(image_path_or_url, preprocess)
        
        # Local file path
        if not os.path.exists(image_path_or_url):
            raise FileNotFoundError(f"Image file not found: {image_path_or_url}")
        
        try:
            if self.ocr_engine == 'tesseract':
                return self._extract_with_tesseract(image_path_or_url, preprocess)
            elif self.ocr_engine == 'easyocr':
                return self._extract_with_easyocr(image_path_or_url)
            else:
                raise ValueError(f"Unknown OCR engine: {self.ocr_engine}")
        except Exception as e:
            print(f"❌ OCR extraction error: {e}")
            return ""
    
    def extract_text_from_url(self, image_url: str, preprocess: bool = True) -> str:
        """
        Extract text from image URL (Firebase Storage or HTTP)
        Downloads image temporarily, processes it, then deletes it
        Args:
            image_url: URL to image (Firebase Storage URL or any HTTP/HTTPS URL)
            preprocess: Whether to preprocess image before OCR
        Returns:
            Extracted text string
        """
        temp_file = None
        try:
            # Download image from URL
            response = requests.get(image_url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            temp_file.write(response.content)
            temp_file.close()
            
            # Extract text using OCR
            text = self.extract_text(temp_file.name, preprocess)
            
            return text
        except Exception as e:
            print(f"❌ Error downloading/processing image from URL: {e}")
            return ""
        finally:
            # Clean up temporary file
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
    
    def _extract_with_tesseract(self, image_path: str, preprocess: bool) -> str:
        """Extract text using Tesseract OCR"""
        try:
            image = Image.open(image_path)
            
            # Preprocess image for better OCR results
            if preprocess:
                # Convert to RGB if needed
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Enhance contrast and resize if too small
                from PIL import ImageEnhance, ImageFilter
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(2.0)
                
                # Apply slight sharpening
                image = image.filter(ImageFilter.SHARPEN)
            
            # Run OCR
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,- '
            text = pytesseract.image_to_string(image, config=custom_config)
            
            return self._clean_text(text)
        except Exception as e:
            print(f"Tesseract OCR error: {e}")
            return ""
    
    def _extract_with_easyocr(self, image_path: str) -> str:
        """Extract text using EasyOCR"""
        try:
            if easyocr_reader is None:
                raise RuntimeError("EasyOCR reader not initialized")
            
            results = easyocr_reader.readtext(image_path)
            text_parts = [result[1] for result in results if result[2] > 0.5]  # Confidence threshold
            text = ' '.join(text_parts)
            
            return self._clean_text(text)
        except Exception as e:
            print(f"EasyOCR error: {e}")
            return ""
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove special characters but keep letters, numbers, spaces, hyphens
        text = re.sub(r'[^\w\s-]', '', text)
        
        return text.strip()
    
    def extract_medicine_name(self, text: str) -> Optional[str]:
        """
        Try to extract medicine name from OCR text
        This is a simple heuristic - can be improved with NLP
        """
        # Look for uppercase words or capitalized words (common in medicine names)
        words = text.split()
        medicine_candidates = []
        
        for word in words:
            # Medicine names often start with capital letters and are 3+ characters
            if len(word) >= 3 and word[0].isupper():
                medicine_candidates.append(word)
        
        # Return the longest candidate or first if available
        if medicine_candidates:
            return max(medicine_candidates, key=len)
        
        return None
    
    def compare_text(self, patient_text: str, registered_name: str, registered_ocr: str = "") -> Dict:
        """
        Compare patient photo OCR text with registered medicine
        Args:
            patient_text: OCR text from patient photo
            registered_name: Registered medicine name
            registered_ocr: OCR text from registered back photo (optional)
        Returns:
            Dictionary with match status, confidence, and details
        """
        patient_text_lower = patient_text.lower()
        registered_name_lower = registered_name.lower()
        
        # Method 1: Direct name match in patient text
        direct_match = registered_name_lower in patient_text_lower
        
        # Method 2: Fuzzy string matching (similarity ratio)
        similarity = difflib.SequenceMatcher(None, patient_text_lower, registered_name_lower).ratio()
        
        # Method 3: Check if registered OCR text matches patient text
        ocr_match = False
        if registered_ocr:
            registered_ocr_lower = registered_ocr.lower()
            ocr_similarity = difflib.SequenceMatcher(None, patient_text_lower, registered_ocr_lower).ratio()
            ocr_match = ocr_similarity > 0.6
        
        # Method 4: Word-level matching
        registered_words = set(registered_name_lower.split())
        patient_words = set(patient_text_lower.split())
        common_words = registered_words.intersection(patient_words)
        word_match_ratio = len(common_words) / len(registered_words) if registered_words else 0
        
        # Calculate overall confidence
        confidence = 0.0
        if direct_match:
            confidence = 0.95
        elif word_match_ratio >= 0.8:
            confidence = 0.85
        elif similarity >= 0.7:
            confidence = similarity
        elif ocr_match:
            confidence = 0.75
        elif word_match_ratio >= 0.5:
            confidence = word_match_ratio * 0.7
        else:
            confidence = similarity * 0.5
        
        # Determine match status (threshold: 0.6)
        match = confidence >= 0.6
        
        return {
            'match': match,
            'confidence': round(confidence, 3),
            'direct_match': direct_match,
            'similarity': round(similarity, 3),
            'word_match_ratio': round(word_match_ratio, 3),
            'ocr_match': ocr_match,
            'common_words': list(common_words),
            'registered_name': registered_name,
            'patient_text': patient_text[:100]  # First 100 chars for reference
        }
