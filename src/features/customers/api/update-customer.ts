import type { Bundle, ZObject } from 'zapier-platform-core';

import { customerPaths } from '../../../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../../../core/http';
import {
  requireIdentifier,
  requireNonEmptyRecord,
} from '../../../core/validation';
import {
  buildUpdateCustomerPayload,
  transformCustomerMutationResponse,
} from '../transforms';

export const updateCustomer = async (z: ZObject, bundle: Bundle) => {
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
  const payload = requireNonEmptyRecord(
    z,
    buildUpdateCustomerPayload(bundle.inputData),
  );

  const response = await requestDokaaiApi(z, bundle, {
    method: 'PUT',
    path: customerPaths.byId(projectId, customerPoolId, customerId),
    body: payload,
    removeMissingValuesFrom: { body: true, params: true },
  });

  return transformCustomerMutationResponse(
    parseDokaaiResponse(response),
    customerId,
  );
};
