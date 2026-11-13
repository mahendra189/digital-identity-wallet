/**
 * SD-JWT (Selective Disclosure JWT) Engine
 * Implements IETF SD-JWT (RFC 9537) disclosure extraction and presentation assembly
 * with cryptographic Key-Binding JWT generation.
 */

import { CampusIdClaims, SDJWTCredential } from '../types/campusId';
import { createKeyBindingJWT, base64UrlDecode, utf8Decode } from './crypto';

export interface DisclosedPayload {
  token: string;
  revealedClaims: Partial<CampusIdClaims>;
  withheldClaims: Array<keyof CampusIdClaims>;
}

export interface PresentationOptions {
  aud?: string;
  nonce?: string;
  holderPrivateKey?: CryptoKey;
}

/**
 * Creates an SD-JWT presentation containing strictly the disclosures
 * that the holder has toggled ON, appended with a genuine Key-Binding JWT.
 */
export const createSelectiveDisclosurePresentation = async (
  credential: SDJWTCredential,
  allowedClaims: Array<keyof CampusIdClaims>,
  options?: PresentationOptions
): Promise<DisclosedPayload> => {
  const allClaims: Array<keyof CampusIdClaims> = [
    'name',
    'roll_number',
    'branch',
    'enrollment_status',
    'valid_until',
  ];

  const revealedClaims: Partial<CampusIdClaims> = {};
  const withheldClaims: Array<keyof CampusIdClaims> = [];
  const selectedDisclosures: string[] = [];

  for (const claimKey of allClaims) {
    if (allowedClaims.includes(claimKey) && credential.claims[claimKey] !== undefined) {
      revealedClaims[claimKey] = credential.claims[claimKey] as any;
      if (credential.disclosures[claimKey]) {
        selectedDisclosures.push(credential.disclosures[claimKey]!);
      }
    } else {
      withheldClaims.push(claimKey);
    }
  }

  // Base SD-JWT part: <Issuer-JWT>~<disclosure1>~...~
  const baseJwt = credential.rawSDJWT.split('~')[0];
  const signedPart = `${baseJwt}~${selectedDisclosures.join('~')}~`;

  // If audience, nonce, and private key are provided, generate cryptographic Key-Binding JWT
  let presentationToken = signedPart;
  if (options?.holderPrivateKey && options?.aud && options?.nonce) {
    const kbJwt = await createKeyBindingJWT(
      options.holderPrivateKey,
      signedPart,
      options.aud,
      options.nonce
    );
    presentationToken = `${signedPart}${kbJwt}`;
  }

  return {
    token: presentationToken,
    revealedClaims,
    withheldClaims,
  };
};

/**
 * Parses a raw SD-JWT string, extracts disclosures, and reconstructs decoded claims.
 */
export const parseSDJWTCredential = (rawSDJWT: string): {
  claims: Partial<CampusIdClaims>;
  disclosures: Partial<Record<keyof CampusIdClaims, string>>;
  issuerPayload: any;
} => {
  const parts = rawSDJWT.split('~');
  const baseJwt = parts[0];
  const disclosureStrings = parts.slice(1).filter((d) => Boolean(d));

  let issuerPayload: any = {};
  try {
    const payloadB64 = baseJwt.split('.')[1];
    issuerPayload = JSON.parse(utf8Decode(base64UrlDecode(payloadB64)));
  } catch (err) {
    console.error('Failed to decode base JWT payload:', err);
  }

  const claims: Partial<CampusIdClaims> = {};
  const disclosures: Partial<Record<keyof CampusIdClaims, string>> = {};

  for (const d of disclosureStrings) {
    try {
      const decodedJson = utf8Decode(base64UrlDecode(d));
      const parsed = JSON.parse(decodedJson);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const [_, claimName, claimValue] = parsed;
        claims[claimName as keyof CampusIdClaims] = claimValue;
        disclosures[claimName as keyof CampusIdClaims] = d;
      }
    } catch {
      // ignore unparseable disclosure segment
    }
  }

  return { claims, disclosures, issuerPayload };
};
