import type { Bundle, ZObject } from 'zapier-platform-core';

import { targetAudiencePaths } from '../../../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../../../core/http';
import { requireIdentifier } from '../../../core/validation';
import {
  normalizeCustomerIds,
  transformAddCustomersResponse,
} from '../transforms';

export const addCustomersToTargetAudience = async (
  z: ZObject,
  bundle: Bundle,
) => {
  const projectId = requireIdentifier(
    z,
    bundle.inputData.projectId,
    'MissingProjectId',
  );
  const targetAudienceListId = requireIdentifier(
    z,
    bundle.inputData.targetAudienceListId,
    'MissingTargetAudienceListId',
  );
  const customerIds = normalizeCustomerIds(z, bundle.inputData.customerIds);

  const response = await requestDokaaiApi(z, bundle, {
    method: 'POST',
    path: targetAudiencePaths.customers(projectId, targetAudienceListId),
    body: { customerIds },
    removeMissingValuesFrom: { body: true, params: true },
  });

  return transformAddCustomersResponse(
    parseDokaaiResponse(response),
    targetAudienceListId,
    customerIds,
  );
};
