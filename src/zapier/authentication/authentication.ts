import type { OpenApiDocument } from '../../openapi/types';
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
    connectionLabel: '{{bundle.inputData.data.workspaceId}} - {{bundle.inputData.data.name}} - {{bundle.inputData.data.environment}}',
    customConfig: {},
  }) as const;
