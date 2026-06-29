import type { Bundle, ZObject } from 'zapier-platform-core';

import { customerPaths } from '../../../config';
import { requestDokaaiApi, parseSuccessfulEnvelope } from '../../../core/http';
import { cleanIdentifier } from '../../../core/validation';
import { isRecord } from '../../../core/zapier';

export const listCustomerPools = async (z: ZObject, bundle: Bundle) => {
  const projectId = cleanIdentifier(bundle.inputData.projectId);

  if (!projectId) {
    return [];
  }

  const response = await requestDokaaiApi(z, bundle, {
    method: 'GET',
    path: customerPaths.pools(projectId),
  });

  const result = parseSuccessfulEnvelope(
    z,
    response,
    'Unable to fetch customer pools.',
    'CustomerPoolsError',
  );
  const pools = Array.isArray(result.data) ? result.data : [];

  return pools.flatMap((pool) => {
    if (!isRecord(pool)) {
      return [];
    }

    const id = typeof pool.id === 'string' ? pool.id : undefined;

    if (!id) {
      return [];
    }

    return [
      {
        id,
        name: typeof pool.name === 'string' && pool.name ? pool.name : id,
        description:
          typeof pool.description === 'string' ? pool.description : '',
        poolLevel: typeof pool.poolLevel === 'string' ? pool.poolLevel : '',
        isOwner: pool.isOwner === true,
        accessLevel:
          typeof pool.accessLevel === 'string' ? pool.accessLevel : '',
      },
    ];
  });
};
