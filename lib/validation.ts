/**
 * Validation utilities for API endpoints
 */

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateStringField(value: any, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string, got ${typeof value}` };
  }
  if (value.trim().length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  return { valid: true };
}

export function validateUrlField(value: any, fieldName: string): { valid: boolean; error?: string } {
  const stringValidation = validateStringField(value, fieldName);
  if (!stringValidation.valid) {
    return stringValidation;
  }
  if (!isValidUrl(value as string)) {
    return { valid: false, error: `${fieldName} must be a valid URL` };
  }
  return { valid: true };
}

export function validateOptionalStringField(value: any, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true }; // Optional fields can be undefined/null
  }
  return validateStringField(value, fieldName);
}

