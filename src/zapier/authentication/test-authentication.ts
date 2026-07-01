import type { ZObject } from 'zapier-platform-core';

import type { OpenApiDocument } from '../../openapi/types';

export const buildTestAuthentication =
  (_document: OpenApiDocument) => async (_z: ZObject) => ({
    status: 'success',
  });
