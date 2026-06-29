import type { Bundle, HttpRequestOptions, ZObject } from 'zapier-platform-core';

import { DOKAAI_API_BASE_URL } from '../../config';
import type { DokaaiRequestOptions, ZapierHttpResponse } from './types';

const buildUrl = (path: string): string =>
  `${DOKAAI_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const authHeaders = (bundle: Bundle): Record<string, string> => ({
  'x-client-key': bundle.authData['x-client-key'] ?? '',
  'x-client-secret': bundle.authData['x-client-secret'] ?? '',
});

export const requestDokaaiApi = async <T = unknown>(
  z: ZObject,
  bundle: Bundle,
  options: DokaaiRequestOptions,
): Promise<ZapierHttpResponse<T>> => {
  const request: HttpRequestOptions & { url: string } = {
    url: buildUrl(options.path),
    method: options.method,
    headers: {
      Accept: 'application/json',
      ...authHeaders(bundle),
      ...(options.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  if (options.params !== undefined) {
    request.params = options.params;
  }

  if (options.body !== undefined) {
    request.body = options.body;
  }

  if (options.removeMissingValuesFrom !== undefined) {
    request.removeMissingValuesFrom = options.removeMissingValuesFrom;
  }

  return z.request<T>(request);
};
