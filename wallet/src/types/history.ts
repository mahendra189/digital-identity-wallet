/**
 * Local Shared-History Types
 * Member 4 constraint: Stored locally in browser vault only (never transmitted externally).
 */

import { CampusIdClaims } from './campusId';

export interface SharedHistoryEntry {
  id: string;
  timestamp: string;               // ISO 8601
  verifierName: string;            // e.g. "Campus Library"
  verifierDomain: string;          // e.g. "library.college.edu"
  purpose: string;
  disclosedClaims: Array<keyof CampusIdClaims>;
  withheldClaims: Array<keyof CampusIdClaims>;
  outcome: 'ACCEPTED' | 'REJECTED' | 'DISMISSED';
}
