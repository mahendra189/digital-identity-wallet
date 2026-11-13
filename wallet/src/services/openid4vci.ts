/**
 * OpenID4VCI Ingestion Service
 * Implements real OpenID for Verifiable Credential Issuance (OpenID4VCI)
 * pre-authorized code flow with holder proof-of-possession.
 */

import { CampusIdClaims, SDJWTCredential } from '../types/campusId';
import { createProofOfPossessionJWT } from './crypto';
import { parseSDJWTCredential } from './sdjwt';
import { getOrCreateHolderKey, saveCredential } from './storage';

export interface CredentialOfferPayload {
  credential_issuer: string;
  credential_configuration_ids: string[];
  pre_authorized_code?: string;
}

export const parseCredentialOffer = (offerUrl: string): CredentialOfferPayload | null => {
  try {
    const trimmed = offerUrl.trim();

    // 1. If raw JSON string
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const grants = parsed.grants || {};
      const preAuthGrant = grants['urn:ietf:params:oauth:grant-type:pre-authorized_code'];
      return {
        credential_issuer: parsed.credential_issuer || 'http://localhost:8000',
        credential_configuration_ids: parsed.credential_configuration_ids || ['CampusID'],
        pre_authorized_code: preAuthGrant?.['pre-authorized_code'] || parsed.pre_authorized_code,
      };
    }

    // 2. If openid-credential-offer:// or http(s) URL
    const url = new URL(trimmed.replace('openid-credential-offer://', 'https://placeholder/'));

    // Check if offer is embedded in ?credential_offer=<json>
    const embeddedOffer = url.searchParams.get('credential_offer');
    if (embeddedOffer) {
      const parsed = JSON.parse(decodeURIComponent(embeddedOffer));
      const grants = parsed.grants || {};
      const preAuthGrant = grants['urn:ietf:params:oauth:grant-type:pre-authorized_code'];
      return {
        credential_issuer: parsed.credential_issuer || 'http://localhost:8000',
        credential_configuration_ids: parsed.credential_configuration_ids || ['CampusID'],
        pre_authorized_code: preAuthGrant?.['pre-authorized_code'],
      };
    }

    const issuer = url.searchParams.get('credential_issuer') || 'http://localhost:8000';
    const preAuthCode = url.searchParams.get('pre-authorized_code');
    const configIds = url.searchParams.get('credential_configuration_ids')?.split(',') || ['CampusID'];

    return {
      credential_issuer: issuer,
      credential_configuration_ids: configIds,
      pre_authorized_code: preAuthCode || undefined,
    };
  } catch (err) {
    console.error('Failed to parse offer URL:', err);
    return null;
  }
};

/**
 * Executes a genuine OpenID4VCI exchange with the configured issuer.
 */
export const claimCredentialFromOffer = async (
  offerInput: string
): Promise<SDJWTCredential> => {
  const parsedOffer = parseCredentialOffer(offerInput);
  if (!parsedOffer) {
    throw new Error('Invalid or unparseable credential offer format');
  }

  const issuerBase = parsedOffer.credential_issuer.replace(/\/+$/, '');

  // 1. Discover endpoints from issuer metadata
  let tokenEndpoint = `${issuerBase}/api/v1/issuer/token`;
  let credentialEndpoint = `${issuerBase}/api/v1/issuer/credential`;

  try {
    const metaResp = await fetch(`${issuerBase}/.well-known/openid-credential-issuer`);
    if (metaResp.ok) {
      const meta = await metaResp.json();
      if (meta.token_endpoint) tokenEndpoint = meta.token_endpoint;
      if (meta.credential_endpoint) credentialEndpoint = meta.credential_endpoint;
    }
  } catch (e) {
    console.warn('Metadata discovery failed, falling back to standard endpoints:', e);
  }

  // 2. Exchange pre-authorized code for token and c_nonce
  const preAuthCode = parsedOffer.pre_authorized_code || 'demo_code';
  const tokenResp = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
      pre_authorized_code: preAuthCode,
    }),
  });

  if (!tokenResp.ok) {
    const errBody = await tokenResp.json().catch(() => ({}));
    throw new Error(errBody.detail?.message || errBody.error_description || `Token exchange failed: HTTP ${tokenResp.status}`);
  }

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;
  const cNonce = tokenData.c_nonce || 'default_nonce';

  // 3. Generate holder proof of possession JWT using wallet's secure keypair
  const holder = await getOrCreateHolderKey();
  const proofJwt = await createProofOfPossessionJWT(holder, issuerBase, cNonce);

  // 4. Request signed credential from issuer
  const credResp = await fetch(credentialEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      format: 'vc+sd-jwt',
      vct: 'CampusID',
      proof: {
        proof_type: 'jwt',
        jwt: proofJwt,
      },
    }),
  });

  if (!credResp.ok) {
    const errBody = await credResp.json().catch(() => ({}));
    throw new Error(errBody.detail?.message || errBody.error || `Credential issuance failed: HTTP ${credResp.status}`);
  }

  const credData = await credResp.json();
  const rawSDJWT = credData.credential;
  if (!rawSDJWT || typeof rawSDJWT !== 'string') {
    throw new Error('Issuer did not return a valid SD-JWT string');
  }

  // 5. Parse disclosures, claims, and issuer envelope
  const { claims, disclosures, issuerPayload } = parseSDJWTCredential(rawSDJWT);

  const credentialId =
    (claims.roll_number ? `CID-${claims.roll_number}` : '') ||
    issuerPayload.credential_id ||
    `CID-${Date.now().toString(16)}`;

  const validUntil =
    claims.valid_until ||
    issuerPayload.valid_until ||
    new Date(Date.now() + 365 * 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const fullClaims: CampusIdClaims = {
    name: claims.name || 'Student',
    roll_number: claims.roll_number || 'UNKNOWN',
    branch: claims.branch || 'General Studies',
    enrollment_status: (claims.enrollment_status as any) || 'ACTIVE',
    valid_until: validUntil,
  };

  const credentialRecord: SDJWTCredential = {
    id: credentialId,
    type: 'CampusID',
    issuer: {
      id: issuerPayload.iss || issuerBase,
      name: 'National Campus Authority',
      logo: '🏛️',
    },
    issuanceDate: issuerPayload.iat
      ? new Date(issuerPayload.iat * 1000).toISOString()
      : new Date().toISOString(),
    expirationDate: validUntil,
    status: 'valid',
    statusList: {
      uri: `${issuerBase}/api/v1/revocations`,
      index: 0,
    },
    claims: fullClaims,
    disclosures,
    rawSDJWT,
  };

  // 6. Save in wallet secure storage
  await saveCredential(credentialRecord);
  return credentialRecord;
};
