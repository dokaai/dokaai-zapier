import type { Bundle, ZObject } from 'zapier-platform-core';

import { targetAudiencePaths } from '../../../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../../../core/http';
import { requireIdentifier } from '../../../core/validation';
import { transformRemoveCustomerResponse } from '../transforms';

export const removeCustomerFromTargetAudience = async (
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
  const customerId = requireIdentifier(
    z,
    bundle.inputData.customerId,
    'MissingCustomerId',
  );

  const response = await requestDokaaiApi(z, bundle, {
    method: 'PATCH',
    path: targetAudiencePaths.customer(
      projectId,
      targetAudienceListId,
      customerId,
    ),
    body: {},
    removeMissingValuesFrom: { body: true, params: true },
  });

  return transformRemoveCustomerResponse(
    parseDokaaiResponse(response),
    targetAudienceListId,
    customerId,
  );
};
