import type { Bundle, ZObject } from 'zapier-platform-core';

import { customerPaths } from '../../../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../../../core/http';
import { requireIdentifier } from '../../../core/validation';
import {
  buildCreateCustomerPayload,
  transformCustomerMutationResponse,
} from '../transforms';

export const createCustomer = async (z: ZObject, bundle: Bundle) => {
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
  const payload = buildCreateCustomerPayload(bundle.inputData);

  const response = await requestDokaaiApi(z, bundle, {
    method: 'POST',
    path: customerPaths.collection(projectId, customerPoolId),
    body: payload,
    removeMissingValuesFrom: { body: true, params: true },
  });

  const raw = parseDokaaiResponse(response);
  return transformCustomerMutationResponse(
    raw,
    undefined,
    payload.customerData.uniqueCustomerId,
  );
};
