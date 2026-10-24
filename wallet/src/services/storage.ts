/**
 * Secure Client Storage Vault for Holder Wallet
 * Stores cryptographic keypairs and verifiable credentials.
 *
 * Security Model:
 * 1. Cryptographic private signing keys are generated via Web Crypto API and
 *    stored in IndexedDB as non-extractable / structured CryptoKey objects.
 *    Private keys are NEVER stored as plaintext strings in browser localStorage.
 * 2. Credential payloads and disclosures are stored locally on the device.
 *    Plain credentials never leave client storage for central databases.
 */

import { SDJWTCredential } from '../types/campusId';
import { SharedHistoryEntry } from '../types/history';
import { generateHolderKeyPair, HolderKeyPair } from './crypto';

const DB_NAME = 'inji_wallet_vault_db';
const DB_VERSION = 2;
const STORE_KEYS = 'vault_keys';
const STORE_CREDS = 'vault_credentials';
const STORE_HISTORY = 'vault_history';
const STORE_UPLOADS = 'vault_uploads';

export interface UploadedDocument {
  id: string;
  name: string;
  category: string;
  fileSize: number;
  mimeType: string;
  dataUrl?: string;
  createdAt: string;
}

// In-memory fallback cache for SSR, test runners, or non-IndexedDB environments
let memKey: HolderKeyPair | null = null;
let memCredentials: SDJWTCredential[] = [];
let memHistory: SharedHistoryEntry[] = [];
let memUploads: UploadedDocument[] = [];

const openVaultDb = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS);
      }
      if (!db.objectStoreNames.contains(STORE_CREDS)) {
        db.createObjectStore(STORE_CREDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        db.createObjectStore(STORE_UPLOADS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

/**
 * Retrieves or generates the holder's cryptographic P-256 keypair from the secure vault.
 */
export const getOrCreateHolderKey = async (): Promise<HolderKeyPair> => {
  if (memKey) return memKey;

  const db = await openVaultDb();
  if (!db) {
    if (!memKey) {
      memKey = await generateHolderKeyPair();
    }
    return memKey;
  }

  return new Promise(async (resolve, reject) => {
    try {
      const tx = db.transaction(STORE_KEYS, 'readwrite');
      const store = tx.objectStore(STORE_KEYS);
      const getReq = store.get('holder_key');

      getReq.onsuccess = async () => {
        if (getReq.result) {
          memKey = getReq.result;
          resolve(getReq.result);
        } else {
          const newKey = await generateHolderKeyPair();
          store.put(newKey, 'holder_key');
          memKey = newKey;
          resolve(newKey);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    } catch (err) {
      if (!memKey) memKey = await generateHolderKeyPair();
      resolve(memKey);
    }
  });
};

/**
 * Loads credentials stored in the local wallet vault.
 */
export const getStoredCredentials = async (): Promise<SDJWTCredential[]> => {
  const db = await openVaultDb();
  if (!db) {
    return memCredentials;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CREDS, 'readonly');
      const store = tx.objectStore(STORE_CREDS);
      const req = store.getAll();
      req.onsuccess = () => {
        memCredentials = req.result || [];
        resolve(memCredentials);
      };
      req.onerror = () => resolve(memCredentials);
    } catch {
      resolve(memCredentials);
    }
  });
};

/**
 * Synchronous accessor for initial UI render state.
 */
export const getCachedCredentials = (): SDJWTCredential[] => {
  return memCredentials;
};

/**
 * Stores a credential into the wallet vault.
 */
export const saveCredential = async (cred: SDJWTCredential): Promise<void> => {
  const exists = memCredentials.some((c) => c.id === cred.id);
  memCredentials = exists ? memCredentials.map((c) => (c.id === cred.id ? cred : c)) : [cred, ...memCredentials];

  const db = await openVaultDb();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_CREDS, 'readwrite');
      const store = tx.objectStore(STORE_CREDS);
      store.put(cred);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      resolve();
    }
  });
};

/**
 * Removes a credential from the vault.
 */
export const removeCredential = async (id: string): Promise<void> => {
  memCredentials = memCredentials.filter((c) => c.id !== id);

  const db = await openVaultDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CREDS, 'readwrite');
      tx.objectStore(STORE_CREDS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const deleteCredential = removeCredential;

/**
 * Retrieves all user-uploaded documents from the local vault.
 */
export const getUploadedDocuments = async (): Promise<UploadedDocument[]> => {
  const db = await openVaultDb();
  if (!db) return memUploads;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_UPLOADS, 'readonly');
      const store = tx.objectStore(STORE_UPLOADS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as UploadedDocument[]) || []);
      req.onerror = () => resolve(memUploads);
    } catch {
      resolve(memUploads);
    }
  });
};

/**
 * Saves a user-uploaded file into the local vault.
 */
export const saveUploadedDocument = async (doc: UploadedDocument): Promise<void> => {
  memUploads = [doc, ...memUploads.filter((d) => d.id !== doc.id)];
  const db = await openVaultDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_UPLOADS, 'readwrite');
      tx.objectStore(STORE_UPLOADS).put(doc);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

/**
 * Removes a user-uploaded file from the local vault.
 */
export const deleteUploadedDocument = async (id: string): Promise<void> => {
  memUploads = memUploads.filter((d) => d.id !== id);
  const db = await openVaultDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_UPLOADS, 'readwrite');
      tx.objectStore(STORE_UPLOADS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

/**
 * Retrieves the disclosure history.
 */
export const getSharedHistory = async (): Promise<SharedHistoryEntry[]> => {
  const db = await openVaultDb();
  if (!db) return memHistory;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.getAll();
      req.onsuccess = () => {
        memHistory = (req.result || []).sort(
          (a: SharedHistoryEntry, b: SharedHistoryEntry) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(memHistory);
      };
      req.onerror = () => resolve(memHistory);
    } catch {
      resolve(memHistory);
    }
  });
};

/**
 * Records a presentation event into sharing history.
 */
export const logSharedHistory = async (
  entry: Omit<SharedHistoryEntry, 'id' | 'timestamp'>
): Promise<SharedHistoryEntry> => {
  const newEntry: SharedHistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  memHistory = [newEntry, ...memHistory];

  const db = await openVaultDb();
  if (db) {
    try {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      tx.objectStore(STORE_HISTORY).put(newEntry);
    } catch (e) {
      // ignore
    }
  }

  return newEntry;
};

/**
 * Resets and completely wipes all vault keys, credentials, and history.
 */
export const resetWallet = async (): Promise<void> => {
  memKey = null;
  memCredentials = [];
  memHistory = [];

  const db = await openVaultDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_KEYS, STORE_CREDS, STORE_HISTORY], 'readwrite');
      tx.objectStore(STORE_KEYS).clear();
      tx.objectStore(STORE_CREDS).clear();
      tx.objectStore(STORE_HISTORY).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};
