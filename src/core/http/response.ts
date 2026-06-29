import type { ZObject } from 'zapier-platform-core';

import { readEnvelope } from '../zapier';
import { throwZapierError, type DokaaiErrorCode } from './errors';
import type { ZapierHttpResponse } from './types';

export const parseDokaaiResponse = <T = unknown>(
  response: ZapierHttpResponse<unknown>,
): T => {
  response.throwForStatus();
  return (response.json ?? response.data) as T;
};

export const parseSuccessfulEnvelope = (
  z: ZObject,
  response: ZapierHttpResponse<unknown>,
  fallbackMessage: string,
  errorCode: DokaaiErrorCode,
) => {
  const envelope = readEnvelope(parseDokaaiResponse(response));

  if (envelope.status !== 'success') {
    throwZapierError(
      z,
      typeof envelope.message === 'string' && envelope.message.length > 0
        ? envelope.message
        : fallbackMessage,
      errorCode,
      400,
    );
  }

  return envelope;
};
