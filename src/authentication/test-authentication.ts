import type { Bundle, ZObject } from 'zapier-platform-core';

import { notificationHandlerPaths } from '../config';
import { requestDokaaiApi, parseDokaaiResponse } from '../core/http';

const TEST_PROJECT_ID = '344727e4-1640-41a8-818e-de1eef498396';

export const testAuthentication = async (z: ZObject, bundle: Bundle) => {
  const response = await requestDokaaiApi(z, bundle, {
    method: 'GET',
    path: notificationHandlerPaths.collection(TEST_PROJECT_ID),
    params: { page: '1', size: '25' },
    removeMissingValuesFrom: { body: false, params: false },
  });

  return parseDokaaiResponse(response);
};
