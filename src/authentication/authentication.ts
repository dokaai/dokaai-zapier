import type { OpenApiDocument } from '../openapi/types';
import { buildAuthenticationFields } from './fields';
import { buildTestAuthentication } from './test-authentication';

export const buildAuthentication = (
  document: OpenApiDocument,
  options: {
    operationIds?: readonly string[];
  } = {},
) =>
  ({
    type: 'custom',
    test: buildTestAuthentication(document),
    fields: buildAuthenticationFields(document, options.operationIds),
    connectionLabel: 'Dokaai Account',
    customConfig: {},
  }) as const;
