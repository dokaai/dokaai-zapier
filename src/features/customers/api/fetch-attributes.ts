import type { Bundle, ZObject } from 'zapier-platform-core';

import { CUSTOMER_ATTRIBUTE_QUERY, customerPaths } from '../../../config';
import { requestDokaaiApi, parseSuccessfulEnvelope } from '../../../core/http';
import { cleanIdentifier } from '../../../core/validation';

export const fetchCustomerAttributes = async (
  z: ZObject,
  bundle: Bundle,
): Promise<unknown[]> => {
  const projectId = cleanIdentifier(bundle.inputData.projectId);
  const customerPoolId = cleanIdentifier(bundle.inputData.customerPoolId);

  if (!projectId || !customerPoolId) {
    return [];
  }

  const response = await requestDokaaiApi(z, bundle, {
    method: 'GET',
    path: customerPaths.attributes(projectId, customerPoolId),
    params: CUSTOMER_ATTRIBUTE_QUERY,
  });

  const result = parseSuccessfulEnvelope(
    z,
    response,
    'Unable to load customer attributes.',
    'CustomerAttributesError',
  );

  return Array.isArray(result.data) ? result.data : [];
};
