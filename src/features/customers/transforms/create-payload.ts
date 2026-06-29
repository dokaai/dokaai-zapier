import { compactInputEntries } from '../../../core/zapier';

const CREATE_ROUTING_FIELDS = new Set(['projectId', 'customerPoolId']);

export interface CreateCustomerPayload extends Record<string, unknown> {
  customerData: Record<string, unknown>;
}

export const buildCreateCustomerPayload = (
  inputData: Record<string, unknown>,
): CreateCustomerPayload => {
  const customerData = compactInputEntries(
    Object.entries(inputData).filter(([key]) => !CREATE_ROUTING_FIELDS.has(key)),
  );

  return { customerData };
};
