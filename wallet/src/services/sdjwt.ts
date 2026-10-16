/**
 * SD-JWT (Selective Disclosure JWT) Engine
 * Implements IETF SD-JWT disclosure assembly for Member 4 holder-controlled sharing.
 */

import { CampusIdClaims, SDJWTCredential } from '../types/campusId';

export interface DisclosedPayload {
  token: string;
  revealedClaims: Partial<CampusIdClaims>;
  withheldClaims: Array<keyof CampusIdClaims>;
}

/**
 * Creates an SD-JWT presentation containing strictly the disclosures
 * that the holder has toggled ON.
 */
export const createSelectiveDisclosurePresentation = (
  credential: SDJWTCredential,
  allowedClaims: Array<keyof CampusIdClaims>
): DisclosedPayload => {
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
        selectedDisclosures.push(credential.disclosures[claimKey]);
      }
    } else {
      withheldClaims.push(claimKey);
    }
  }

  // Build SD-JWT presentation string: <Issuer-JWT>~<disclosure1>~<disclosure2>~...~
  const baseJwt = credential.rawSDJWT.split('~')[0];
  const presentationToken = `${baseJwt}~${selectedDisclosures.join('~')}~`;

  return {
    token: presentationToken,
    revealedClaims,
    withheldClaims,
  };
};
