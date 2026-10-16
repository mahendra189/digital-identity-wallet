/**
 * OpenID4VP Presentation Types & Consent Models
 * Used by Member 4 for selective disclosure presentations.
 */

import { CampusIdClaims } from './campusId';

export interface VerifierPresentationRequest {
  sessionId: string;
  verifier: {
    name: string;        // e.g. "Campus Central Library" or "Sports Complex Gate"
    domain: string;      // e.g. "library.college.edu"
    logo?: string;
    purpose: string;     // e.g. "Verify student enrollment for borrowing privileges"
  };
  requiredClaims: Array<keyof CampusIdClaims>;
  optionalClaims?: Array<keyof CampusIdClaims>;
  callbackUrl: string;   // POST endpoint where presentation is transmitted
  nonce: string;
}

export interface PresentationSubmission {
  sessionId: string;
  disclosedSDJWT: string;              // SD-JWT with only authorized disclosures appended
  disclosedClaims: Partial<CampusIdClaims>;
  timestamp: string;
}
