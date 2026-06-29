import type { ZObject } from 'zapier-platform-core';

import { throwZapierError } from '../../../core/http';

const normalizeSingleCustomerId = (value: unknown): string[] => {
  if (typeof value !== 'string') {
    throw new TypeError('Customer ID values must be strings.');
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const normalizeCustomerIds = (
  z: ZObject,
  value: unknown,
): string[] => {
  try {
    const flattened = Array.isArray(value)
      ? value.flatMap((item) => normalizeSingleCustomerId(item))
      : normalizeSingleCustomerId(value);

    const seen = new Set<string>();
    const customerIds = flattened.filter((customerId) => {
      if (seen.has(customerId)) {
        return false;
      }

      seen.add(customerId);
      return true;
    });

    if (customerIds.length === 0) {
      throwZapierError(
        z,
        'Provide at least one Customer ID.',
        'MissingCustomerIds',
        400,
      );
    }

    return customerIds;
  } catch (error) {
    if (error instanceof TypeError) {
      throwZapierError(
        z,
        'Customer IDs must be strings or a Zapier list of strings.',
        'MissingCustomerIds',
        400,
      );
    }

    throw error;
  }
};
