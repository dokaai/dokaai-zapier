import { defineApp } from 'zapier-platform-core';
import zapier from 'zapier-platform-core';

import { authentication } from './authentication';
import {
  createCustomerCreate,
  getCustomerByIdCreate,
  removeCustomerCreate,
  updateCustomerCreate,
} from './features/customers';
import {
  addCustomerToTargetAudienceCreate,
  removeCustomerFromTargetAudienceCreate,
} from './features/target-audiences';

const app = defineApp({
  version: require('../package.json').version as string,
  platformVersion: zapier.version,
  authentication,
  requestTemplate: {
    params: {},
    headers: {
      'x-client-secret': '{{bundle.authData.x-client-secret}}',
      'x-client-key': '{{bundle.authData.x-client-key}}',
    },
  },
  creates: {
    [createCustomerCreate.key]: createCustomerCreate,
    [updateCustomerCreate.key]: updateCustomerCreate,
    [removeCustomerCreate.key]: removeCustomerCreate,
    [addCustomerToTargetAudienceCreate.key]: addCustomerToTargetAudienceCreate,
    [removeCustomerFromTargetAudienceCreate.key]:
      removeCustomerFromTargetAudienceCreate,
    [getCustomerByIdCreate.key]: getCustomerByIdCreate,
  },
});

export = app;
