/**
 * OpenID4VP Presentation Service
 * Handles receiving authorization requests from Verifiers, enforcing required claims,
 * constructing cryptographic SD-JWT presentations with holder key-binding,
 * and transmitting proof to the verifier's callback endpoint.
 */

import { VerifierPresentationRequest, PresentationSubmission } from '../types/presentation';
import { CampusIdClaims, SDJWTCredential } from '../types/campusId';
import { createSelectiveDisclosurePresentation } from './sdjwt';
import { getOrCreateHolderKey, logSharedHistory } from './storage';

export const parsePresentationRequest = (qrOrUri: string): VerifierPresentationRequest | null => {
  try {
    const trimmed = qrOrUri.trim();

    // 1. If it's a JSON string:
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      return {
        sessionId: parsed.sessionId || parsed.nonce || `sess_${Date.now()}`,
        verifier: {
          name: parsed.client_name || parsed.verifier?.name || 'Campus Verifier',
          domain: parsed.client_id || parsed.verifier?.domain || 'campus-verifier',
          purpose: parsed.purpose || parsed.verifier?.purpose || 'Verify student identity and status',
        },
        requiredClaims: parsed.required_claims || parsed.requiredClaims || ['enrollment_status', 'valid_until'],
        optionalClaims: parsed.optional_claims || parsed.optionalClaims || ['name', 'roll_number', 'branch'],
        callbackUrl: parsed.response_uri || parsed.callbackUrl || 'http://localhost:8000/api/v1/presentation',
        nonce: parsed.nonce || Math.random().toString(36).substring(7),
      };
    }

    // 2. If it's an openid4vp URI or HTTP link:
    let urlStr = trimmed;
    if (urlStr.startsWith('openid4vp:')) {
      urlStr = urlStr.replace(/^openid4vp:\/\/|^openid4vp:\/?\/?/, 'https://placeholder/');
    }
    const url = new URL(urlStr);
    const requiredStr = url.searchParams.get('required_claims') || url.searchParams.get('requiredClaims') || 'enrollment_status,valid_until';
    const requiredClaims = requiredStr.split(',').map((s) => s.trim()).filter(Boolean) as Array<keyof CampusIdClaims>;
    const optionalStr = url.searchParams.get('optional_claims') || url.searchParams.get('optionalClaims') || 'name,roll_number,branch';
    const optionalClaims = optionalStr.split(',').map((s) => s.trim()).filter(Boolean) as Array<keyof CampusIdClaims>;

    return {
      sessionId: url.searchParams.get('session_id') || url.searchParams.get('nonce') || `sess_${Date.now()}`,
      verifier: {
        name: url.searchParams.get('client_name') || 'Campus Central Verifier',
        domain: url.searchParams.get('client_id') || url.searchParams.get('aud') || 'campus-verifier',
        purpose: url.searchParams.get('purpose') || 'Verify student credentials',
      },
      requiredClaims,
      optionalClaims,
      callbackUrl: url.searchParams.get('response_uri') || url.searchParams.get('callbackUrl') || 'http://localhost:8000/api/v1/presentation',
      nonce: url.searchParams.get('nonce') || url.searchParams.get('request_nonce') || Math.random().toString(36).substring(7),
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
): Promise<{ success: boolean; submission: PresentationSubmission; message: string; verifierResult?: any }> => {
  // 1. Strict server/client required claims check
  for (const reqClaim of request.requiredClaims) {
    if (!allowedClaims.includes(reqClaim)) {
      throw new Error(`Mandatory required claim "${reqClaim}" must be disclosed to complete verification.`);
    }
  }

  // 2. Retrieve holder's private key for genuine Key-Binding JWT signature
  const holder = await getOrCreateHolderKey();

  // 3. Construct real cryptographic SD-JWT presentation with key-binding
  const disclosure = await createSelectiveDisclosurePresentation(credential, allowedClaims, {
    aud: request.verifier.domain,
    nonce: request.nonce,
    holderPrivateKey: holder.keyPair.privateKey,
  });

  const submission: PresentationSubmission = {
    sessionId: request.sessionId,
    disclosedSDJWT: disclosure.token,
    disclosedClaims: disclosure.revealedClaims,
    timestamp: new Date().toISOString(),
  };

  // 4. Real network dispatch to verifier endpoint
  let verifierResponseData: any = null;
  try {
    const res = await fetch(request.callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presentation: disclosure.token,
        nonce: request.nonce,
        aud: request.verifier.domain,
        required_claims: request.requiredClaims,
        disclosedClaims: disclosure.revealedClaims,
      }),
    });

    verifierResponseData = await res.json().catch(() => ({}));

    if (!res.ok || verifierResponseData.status === 'invalid' || verifierResponseData.status === 'revoked') {
      const reasons = verifierResponseData.reasons?.join(', ') || verifierResponseData.detail?.message || `HTTP ${res.status}`;
      throw new Error(`Verifier rejected presentation (${verifierResponseData.status || 'error'}): ${reasons}`);
    }
  } catch (netErr: any) {
    // If it's a verification failure from the server, propagate it
    if (netErr.message && netErr.message.includes('Verifier rejected')) {
      throw netErr;
    }
    // Network dispatch failed
    throw new Error(`Could not reach verifier at ${request.callbackUrl}: ${netErr.message || netErr}`);
  }

  // 5. Log presentation event in shared history
  const allKnownClaims: Array<keyof CampusIdClaims> = ['name', 'roll_number', 'branch', 'enrollment_status', 'valid_until'];
  const withheldClaims = allKnownClaims.filter((k) => !allowedClaims.includes(k));

  await logSharedHistory({
    verifierName: request.verifier.name,
    verifierDomain: request.verifier.domain,
    purpose: request.verifier.purpose,
    disclosedClaims: allowedClaims,
    withheldClaims,
    outcome: 'ACCEPTED',
  });


  return {
    success: true,
    submission,
    verifierResult: verifierResponseData,
    message: `Successfully verified and presented ${Object.keys(disclosure.revealedClaims).length} claims to ${request.verifier.name}`,
  };
};
