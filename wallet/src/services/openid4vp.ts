/**
 * OpenID4VP Presentation Service (Member 4)
 * Handles receiving authorization requests from Verifier and dispatching proof.
 */

import { VerifierPresentationRequest, PresentationSubmission } from '../types/presentation';
import { CampusIdClaims, SDJWTCredential } from '../types/campusId';
import { createSelectiveDisclosurePresentation } from './sdjwt';

export const parsePresentationRequest = (qrOrUri: string): VerifierPresentationRequest | null => {
  try {
    // If it's a JSON string:
    if (qrOrUri.trim().startsWith('{')) {
      return JSON.parse(qrOrUri);
    }

    // If it's an openid4vp:// URI:
    const url = new URL(qrOrUri.replace('openid4vp://', 'https://placeholder/'));
    const requiredStr = url.searchParams.get('required_claims') || 'enrollment_status,valid_until';
    const requiredClaims = requiredStr.split(',') as Array<keyof CampusIdClaims>;

    return {
      sessionId: url.searchParams.get('session_id') || `sess_${Date.now()}`,
      verifier: {
        name: url.searchParams.get('client_name') || 'Campus Central Library',
        domain: url.searchParams.get('client_id') || 'library.campus.edu',
        purpose: url.searchParams.get('purpose') || 'Verify current active student status',
      },
      requiredClaims,
      optionalClaims: ['name', 'roll_number', 'branch'],
      callbackUrl: url.searchParams.get('response_uri') || 'https://verify.campus.edu/api/v1/presentation',
      nonce: url.searchParams.get('nonce') || Math.random().toString(36).substring(7),
    };
  } catch (err) {
    console.error('Failed to parse presentation request:', err);
    return null;
  }
};

export const submitPresentationProof = async (
  request: VerifierPresentationRequest,
  credential: SDJWTCredential,
  allowedClaims: Array<keyof CampusIdClaims>
): Promise<{ success: boolean; submission: PresentationSubmission; message: string }> => {
  const disclosure = createSelectiveDisclosurePresentation(credential, allowedClaims);

  const submission: PresentationSubmission = {
    sessionId: request.sessionId,
    disclosedSDJWT: disclosure.token,
    disclosedClaims: disclosure.revealedClaims,
    timestamp: new Date().toISOString(),
  };

  // Simulates network dispatch to verifier callback endpoint
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    success: true,
    submission,
    message: `Successfully presented ${Object.keys(disclosure.revealedClaims).length} claims to ${request.verifier.name}`,
  };
};
