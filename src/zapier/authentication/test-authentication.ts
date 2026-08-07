import type { Bundle, ZObject } from 'zapier-platform-core';

import { authHeaders, getOpenApiBaseUrl } from '../../openapi/runtime';
import type { OpenApiDocument } from '../../openapi/types';

export const buildTestAuthentication =
  (document: OpenApiDocument) => async (z: ZObject, bundle: Bundle) => {
    const response = await z.request({
      url: `${getOpenApiBaseUrl(document)}/opm/client-secrets/me`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeaders(document, bundle),
      },
    });

    response.throwForStatus();

    return response.json ?? response.data;
  };
