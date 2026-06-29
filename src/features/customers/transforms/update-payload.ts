import { NON_EDITABLE_CUSTOMER_FIELDS } from '../../../config';
import { compactInputEntries } from '../../../core/zapier';

const UPDATE_ROUTING_FIELDS = new Set([
  'projectId',
  'customerPoolId',
  'customerId',
  ...NON_EDITABLE_CUSTOMER_FIELDS,
]);

export const buildUpdateCustomerPayload = (
  inputData: Record<string, unknown>,
): Record<string, unknown> =>
  compactInputEntries(
    Object.entries(inputData).filter(([key]) => !UPDATE_ROUTING_FIELDS.has(key)),
  );
