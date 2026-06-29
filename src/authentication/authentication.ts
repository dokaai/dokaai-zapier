import { authenticationFields } from './fields';
import { testAuthentication } from './test-authentication';

export const authentication = {
  type: 'custom',
  test: testAuthentication,
  fields: authenticationFields,
  connectionLabel: 'Dokaai Account',
  customConfig: {},
} as const;
