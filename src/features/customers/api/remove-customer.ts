import type { Bundle, ZObject } from 'zapier-platform-core';

import { customerPaths } from '../../../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../../../core/http';
import { requireIdentifier } from '../../../core/validation';
import { transformRemoveCustomerResponse } from '../transforms';

export const removeCustomer = async (z: ZObject, bundle: Bundle) => {
  const projectId = requireIdentifier(
    z,
    bundle.inputData.projectId,
    'MissingProjectId',
  );
  const customerPoolId = requireIdentifier(
    z,
    bundle.inputData.customerPoolId,
    'MissingCustomerPoolId',
  );
  const customerId = requireIdentifier(
    z,
    bundle.inputData.customerId,
    'MissingCustomerId',
  );

  const response = await requestDokaaiApi(z, bundle, {
    method: 'PATCH',
    path: customerPaths.status(projectId, customerPoolId, customerId),
    body: {},
    removeMissingValuesFrom: { body: true, params: true },
  });

  return transformRemoveCustomerResponse(parseDokaaiResponse(response), customerId);
};
