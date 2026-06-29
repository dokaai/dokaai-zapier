import type { ZObject } from 'zapier-platform-core';

import { throwZapierError } from '../http';

export const requireNonEmptyRecord = (
  z: ZObject,
  value: Record<string, unknown>,
): Record<string, unknown> => {
  if (Object.keys(value).length === 0) {
    throwZapierError(
      z,
      'Provide at least one customer field to update.',
      'MissingUpdateData',
      400,
    );
  }

  return value;
};
