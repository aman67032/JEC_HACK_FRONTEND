export type UserRole = "patient" | "caregiver" | "doctor";

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface PrivacySettings {
  allowSharing: boolean;
  shareWithDoctorIds?: string[];
  qrAccessExpiresAt?: string; // ISO timestamp
}

export interface UserDoc {
  userId: string; // UID
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  gender?: string;
  age?: number;
  conditions?: string[];
  allergies?: string[];
  profilePhoto?: string; // URL
  caregivers?: string[]; // linked caregiver UIDs
  emergencyContact?: EmergencyContact;
  privacy?: PrivacySettings;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface MedicationDoc {
  medId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  addedBy?: string; // userId or doctorId
  addedAt?: string; // ISO
  lastUpdatedBy?: string;
  lastUpdatedAt?: string; // ISO
  reasonForChange?: string;
  source?: "OCR" | "manual" | "doctor upload";
  interactionFlag?: boolean;
  interactionWarnings?: string[];
  status: "active" | "stopped" | "completed";
}

export interface AdherenceLogDoc {
  logId: string;
  medId: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g., 08:00 AM
  taken: boolean;
  photoUrl?: string;
  verifiedBy?: string; // userId
  timestamp: string; // ISO
}

export interface DosageChangeLogDoc {
  changeId: string;
  medId: string;
  previousDosage: string;
  newDosage: string;
  changedBy: string; // userId / doctorId
  reason?: string;
  timestamp: string; // ISO
}

export interface PrescriptionDoc {
  prescriptionId: string;
  fileUrl: string;
  uploadedBy: string; // userId
  uploadedAt: string; // ISO
  extractedText?: string;
  status: "pending" | "processed" | "failed";
  verifiedMedicines?: string[];
}

export interface ReminderDoc {
  reminderId: string;
  medId: string;
  timeSlots: string[]; // ["08:00 AM", "08:00 PM"]
  active: boolean;
  createdAt: string; // ISO
}

export interface EmergencySummaryDoc {
  summaryId: string;
  generatedAt: string; // ISO
  expiresAt: string; // ISO
  patientId: string;
  patientName: string;
  age?: number;
  conditions?: string[];
  allergies?: string[];
  currentMedications: Array<{ name: string; dosage: string; frequency?: string }>;
  emergencyContact?: Pick<EmergencyContact, "name" | "phone">;
  qrLink: string;
  status: "active" | "expired";
}

export interface DrugInteractionCacheDoc {
  combinationId: string; // e.g., "Metformin_Insulin"
  warning: string;
  severity: "minor" | "moderate" | "major" | string;
  source?: string;
  lastChecked: string; // ISO
}


