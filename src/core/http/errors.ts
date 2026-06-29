import type { ZObject } from 'zapier-platform-core';

export type DokaaiErrorCode =
  | 'MissingProjectId'
  | 'MissingCustomerPoolId'
  | 'MissingCustomerId'
  | 'MissingTargetAudienceListId'
  | 'MissingCustomerIds'
  | 'MissingUpdateData'
  | 'CustomerAttributesError'
  | 'CustomerPoolsError'
  | 'AuthenticationError';

export const throwZapierError = (
  z: ZObject,
  message: string,
  code: DokaaiErrorCode,
  status = 400,
): never => {
  throw new z.errors.Error(message, code, status);
};
