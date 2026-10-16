/**
 * Campus ID Credential Types & Schema Definitions
 * Shared agreement between Team 1 and Team 2.
 */

export type EnrollmentStatus = 'ACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'REVOKED';

export interface CampusIdClaims {
  name: string;
  roll_number: string;
  branch: string;
  enrollment_status: EnrollmentStatus;
  valid_until: string; // ISO Date YYYY-MM-DD
  photo?: string;      // Base64 image or avatar URI
}

export interface SDJWTCredential {
  id: string;                       // Unique credential ID (urn:uuid:...)
  type: 'CampusID';
  issuer: {
    id: string;                     // e.g. "did:web:college.edu" or "https://certify.college.edu"
    name: string;                   // "National Institute of Technology"
    logo?: string;
  };
  issuanceDate: string;             // ISO timestamp
  expirationDate: string;           // ISO timestamp
  status: 'valid' | 'revoked' | 'expired';
  statusList?: {
    uri: string;
    index: number;
  };
  rawSDJWT: string;                 // The raw SD-JWT compact string with disclosures
  claims: CampusIdClaims;           // Fully decoded/unpacked claims on client
  disclosures: Partial<Record<keyof CampusIdClaims, string>>; // Claim name -> raw disclosure salt string
}
