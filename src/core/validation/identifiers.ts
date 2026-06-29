import type { ZObject } from 'zapier-platform-core';

import { throwZapierError, type DokaaiErrorCode } from '../http';

const missingMessages: Record<DokaaiErrorCode, string> = {
  MissingProjectId: 'Project ID is required.',
  MissingCustomerPoolId: 'Customer Pool ID is required.',
  MissingCustomerId: 'Customer ID is required.',
  MissingTargetAudienceListId: 'Target Audience List ID is required.',
  MissingCustomerIds: 'Provide at least one Customer ID.',
  MissingUpdateData: 'Provide at least one customer field to update.',
  CustomerAttributesError: 'Unable to load customer attributes.',
  CustomerPoolsError: 'Unable to fetch customer pools.',
  AuthenticationError: 'Authentication failed.',
};

export const cleanIdentifier = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : String(value ?? '').trim();

export const requireIdentifier = (
  z: ZObject,
  value: unknown,
  code: DokaaiErrorCode,
): string => {
  const cleaned = cleanIdentifier(value);

  if (!cleaned) {
    throwZapierError(z, missingMessages[code], code, 400);
  }

  return cleaned;
};
