/**
 * Cryptographic primitives for Holder Wallet using the Web Crypto API.
 * Provides P-256 (secp256r1) keypair generation, did:jwk construction,
 * OpenID4VCI proof-of-possession signing, and OpenID4VP Key-Binding JWT signing.
 */

export interface HolderKeyPair {
  keyPair: CryptoKeyPair;
  jwk: JsonWebKey;
  didJwk: string;
}

export const base64UrlEncode = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const base64UrlDecode = (str: string): Uint8Array => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const utf8Encode = (text: string): Uint8Array => {
  return new TextEncoder().encode(text);
};

export const utf8Decode = (bytes: Uint8Array): string => {
  return new TextDecoder().decode(bytes);
};

export const sha256Base64Url = async (input: string | Uint8Array): Promise<string> => {
  const data = typeof input === 'string' ? utf8Encode(input) : input;
  const hash = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return base64UrlEncode(hash);
};


/**
 * Generates an ECDSA P-256 keypair and returns public JWK and did:jwk identifier.
 */
export const generateHolderKeyPair = async (): Promise<HolderKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable for local vault serialization
    ['sign', 'verify']
  );

  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const cleanJwk = {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
  };
  const didJwk = 'did:jwk:' + base64UrlEncode(utf8Encode(JSON.stringify(cleanJwk))) + '#0';

  return { keyPair, jwk: cleanJwk, didJwk };
};

/**
 * Signs an input string with an ECDSA P-256 private key and returns raw 64-byte IEEE P1363 signature base64url encoded.
 */
export const signES256 = async (privateKey: CryptoKey, data: string): Promise<string> => {
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    utf8Encode(data) as unknown as BufferSource
  );
  return base64UrlEncode(signature);
};

/**
 * Creates an OpenID4VCI Proof-of-Possession JWT (openid4vci-proof+jwt).
 */
export const createProofOfPossessionJWT = async (
  holder: HolderKeyPair,
  audience: string,
  nonce: string
): Promise<string> => {
  const header = {
    alg: 'ES256',
    typ: 'openid4vci-proof+jwt',
    kid: holder.didJwk,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    iat: now,
    nonce: nonce,
  };

  const headerB64 = base64UrlEncode(utf8Encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(utf8Encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signatureB64 = await signES256(holder.keyPair.privateKey, signingInput);
  return `${signingInput}.${signatureB64}`;
};

/**
 * Creates an SD-JWT Key-Binding JWT (kb+jwt) bound to the disclosed parts, verifier aud, and nonce.
 */
export const createKeyBindingJWT = async (
  privateKey: CryptoKey,
  signedPart: string,
  audience: string,
  nonce: string
): Promise<string> => {
  const sdHash = await sha256Base64Url(signedPart);
  const header = {
    alg: 'ES256',
    typ: 'kb+jwt',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    aud: audience,
    nonce: nonce,
    sd_hash: sdHash,
  };

  const headerB64 = base64UrlEncode(utf8Encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(utf8Encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signatureB64 = await signES256(privateKey, signingInput);
  return `${signingInput}.${signatureB64}`;
};
