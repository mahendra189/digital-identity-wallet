/**
 * OpenID4VCI Ingestion Service (Member 3)
 * Handles receiving credential offers and issuing signed Campus IDs.
 */

import { SDJWTCredential } from '../types/campusId';

export interface CredentialOfferPayload {
  credential_issuer: string;
  credential_configuration_ids: string[];
  grants?: {
    authorization_code?: { issuer_state: string };
    'urn:ietf:params:oauth:grant-type:pre-authorized_code'?: {
      'pre-authorized_code': string;
    };
  };
}

export const parseCredentialOffer = (offerUrl: string): CredentialOfferPayload | null => {
  try {
    const url = new URL(offerUrl.replace('openid-credential-offer://', 'https://placeholder/'));
    const issuer = url.searchParams.get('credential_issuer') || 'https://certify.college.edu';
    return {
      credential_issuer: issuer,
      credential_configuration_ids: ['CampusID'],
    };
  } catch (err) {
    console.error('Failed to parse offer URL:', err);
    return null;
  }
};

/**
 * Simulates or executes OpenID4VCI exchange with Inji Certify / Mock Issuer
 */
export const claimCredentialFromOffer = async (
  issuerUrl: string,
  studentName = 'Mahendra Kumar',
  rollNumber = '2024CS089'
): Promise<SDJWTCredential> => {
  // Simulates network latency for realistic demo
  await new Promise((resolve) => setTimeout(resolve, 800));

  const uniqueId = `urn:uuid:${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`;
  
  return {
    id: uniqueId,
    type: 'CampusID',
    issuer: {
      id: issuerUrl || 'https://certify.college.edu/inji',
      name: 'National Campus Authority',
      logo: '🏛️',
    },
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 365 * 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'valid',
    statusList: {
      uri: `${issuerUrl}/status-list/2026`,
      index: Math.floor(Math.random() * 1000),
    },
    claims: {
      name: studentName,
      roll_number: rollNumber,
      branch: 'Computer Science & Engineering',
      enrollment_status: 'ACTIVE',
      valid_until: '2028-06-30',
    },
    disclosures: {
      name: btoa(JSON.stringify(['salt_name', 'name', studentName])),
      roll_number: btoa(JSON.stringify(['salt_roll', 'roll_number', rollNumber])),
      branch: btoa(JSON.stringify(['salt_branch', 'branch', 'Computer Science & Engineering'])),
      enrollment_status: btoa(JSON.stringify(['salt_status', 'enrollment_status', 'ACTIVE'])),
      valid_until: btoa(JSON.stringify(['salt_valid', 'valid_until', '2028-06-30'])),
    },
    rawSDJWT: `eyJhbGciOiJFUzI1NiIsInR5cCI6InZjK3NkLWp3dCJ9.payload.${Date.now()}`,
  };
};
