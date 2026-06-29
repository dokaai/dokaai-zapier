import type { Bundle, ZObject } from 'zapier-platform-core';

import {
  CUSTOMER_FETCH_DEFAULT_ATTRIBUTE_TYPES,
  customerPaths,
} from '../../../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../../../core/http';
import { cleanIdentifier, requireIdentifier } from '../../../core/validation';
import { transformGetCustomerResponse } from '../transforms';

export const getCustomer = async (z: ZObject, bundle: Bundle) => {
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
  const attributeTypes =
    cleanIdentifier(bundle.inputData.attributeTypes) ||
    CUSTOMER_FETCH_DEFAULT_ATTRIBUTE_TYPES;

  const response = await requestDokaaiApi(z, bundle, {
    method: 'GET',
    path: customerPaths.byId(projectId, customerPoolId, customerId),
    params: { attributeTypes },
  });

  return transformGetCustomerResponse(parseDokaaiResponse(response), customerId);
};
