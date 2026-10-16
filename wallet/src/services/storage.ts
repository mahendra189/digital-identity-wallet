/**
 * Local Client Vault Storage
 * Stores credentials and sharing history locally on the client.
 * Invariant: Plain credentials never leave the client storage for central databases.
 */

import { SDJWTCredential } from '../types/campusId';
import { SharedHistoryEntry } from '../types/history';

const CREDENTIALS_KEY = 'inji_wallet_credentials_v1';
const HISTORY_KEY = 'inji_wallet_shared_history_v1';

// Seed demo credential if empty (for standalone demo capability)
const DEMO_CAMPUS_ID: SDJWTCredential = {
  id: 'urn:uuid:campus-id-9821-4402',
  type: 'CampusID',
  issuer: {
    id: 'https://certify.college.edu/inji',
    name: 'State Institute of Technology',
    logo: '🎓',
  },
  issuanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  expirationDate: '2028-06-30T23:59:59Z',
  status: 'valid',
  statusList: {
    uri: 'https://certify.college.edu/status-list/campus-id-2026',
    index: 42,
  },
  claims: {
    name: 'Mahendra Kumar',
    roll_number: '2024CS089',
    branch: 'Computer Science & Engineering',
    enrollment_status: 'ACTIVE',
    valid_until: '2028-06-30',
  },
  disclosures: {
    name: 'WyJzYWx0XzEiLCAibmFtZSIsICJNYWhlbmRyYSBLdW1hciJd',
    roll_number: 'WyJzYWx0XzIiLCAicm9sbF9udW1iZXIiLCAiMjAyNENTMDg5Il0',
    branch: 'WyJzYWx0XzMiLCAiYnJhbmNoIiwgIkNvbXB1dGVyIFNjaWVuY2UgJiBFbmdpbmVlcmluZyJd',
    enrollment_status: 'WyJzYWx0XzQiLCAiZW5yb2xsbWVudF9zdGF0dXMiLCAiQUNUSVZFIl0',
    valid_until: 'WyJzYWx0XzUiLCAidmFsaWRfdW50aWwiLCAiMjAyOC0wNi0zMCJd',
  },
  rawSDJWT: 'eyJhbGciOiJFUzI1NiIsInR5cCI6InZjK3NkLWp3dCJ9.demo_header.demo_signature~WyJzYWx0XzEiXQ~WyJzYWx0XzIiXQ',
};

export const getStoredCredentials = (): SDJWTCredential[] => {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) {
      // Seed with initial demo Campus ID so the wallet is immediately usable
      saveCredentials([DEMO_CAMPUS_ID]);
      return [DEMO_CAMPUS_ID];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read credentials from local storage:', err);
    return [DEMO_CAMPUS_ID];
  }
};

export const saveCredentials = (creds: SDJWTCredential[]): void => {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (err) {
    console.error('Failed to save credentials to local storage:', err);
  }
};

export const addCredential = (cred: SDJWTCredential): void => {
  const current = getStoredCredentials();
  const exists = current.some((c) => c.id === cred.id);
  const updated = exists ? current.map((c) => (c.id === cred.id ? cred : c)) : [cred, ...current];
  saveCredentials(updated);
};

export const removeCredential = (id: string): void => {
  const current = getStoredCredentials();
  saveCredentials(current.filter((c) => c.id !== id));
};

export const getSharedHistory = (): SharedHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read history from local storage:', err);
    return [];
  }
};

export const logSharedHistory = (entry: Omit<SharedHistoryEntry, 'id' | 'timestamp'>): SharedHistoryEntry => {
  const current = getSharedHistory();
  const newEntry: SharedHistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([newEntry, ...current]));
  } catch (err) {
    console.error('Failed to write history to local storage:', err);
  }
  return newEntry;
};
