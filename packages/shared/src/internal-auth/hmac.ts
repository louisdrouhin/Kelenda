import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_TIMESTAMP_SKEW_SECONDS = 30;

export interface SignedRequestHeaders {
  'X-Calling-Service': string;
  'X-Timestamp': string;
  'X-Signature': string;
}

function computeSignature(
  secret: string,
  method: string,
  path: string,
  timestamp: string,
  body: string,
): string {
  return createHmac('sha256', secret)
    .update(`${method}${path}${timestamp}${body}`)
    .digest('hex');
}

export function signInternalRequest(
  callingService: string,
  secret: string,
  method: string,
  path: string,
  body = '',
): SignedRequestHeaders {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = computeSignature(secret, method, path, timestamp, body);
  return {
    'X-Calling-Service': callingService,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}

export interface VerifyInternalRequestParams {
  secret: string;
  method: string;
  path: string;
  body?: string;
  timestamp: string;
  signature: string;
}

export function verifyInternalRequest(params: VerifyInternalRequestParams): boolean {
  const { secret, method, path, body = '', timestamp, signature } = params;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_TIMESTAMP_SKEW_SECONDS) return false;

  const expected = computeSignature(secret, method, path, timestamp, body);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
