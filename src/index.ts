import { defineApp } from 'zapier-platform-core';
import zapier from 'zapier-platform-core';

import type { OpenApiDocument } from './openapi/types';
import { buildZapierCreatesFromOpenApi } from './zapier/actions';
import { buildAuthentication } from './zapier/authentication';
import { buildZapierSearchesFromOpenApi } from './zapier/searches';
import { buildDropdownTriggers } from './zapier/triggers';
import {
  zapierActionOperationIds,
  zapierSearchOperationIds,
} from './zapier-operation-ids';

const openApiSpec = require('./api/index.json') as OpenApiDocument;

const app = defineApp({
  version: require('../package.json').version as string,
  platformVersion: zapier.version,
  flags: {
    cleanInputData: false,
  },
  authentication: buildAuthentication(openApiSpec, {
    operationIds: zapierActionOperationIds,
  }),
  triggers: buildDropdownTriggers(openApiSpec),
  creates: buildZapierCreatesFromOpenApi(openApiSpec, {
    operationIds: zapierActionOperationIds,
  }),
  searches: buildZapierSearchesFromOpenApi(openApiSpec, {
    operationIds: zapierSearchOperationIds,
  }),
});

export = app;
