import { defineApp } from 'zapier-platform-core';
import zapier from 'zapier-platform-core';

import { buildAuthentication } from './authentication';
import { buildZapierCreatesFromOpenApi } from './openapi/zapier';
import type { OpenApiDocument } from './openapi/types';
import { zapierCreateOperationIds } from './zapier-operation-ids';

const openApiSpec = require('./api/index.json') as OpenApiDocument;

const app = defineApp({
  version: require('../package.json').version as string,
  platformVersion: zapier.version,
  authentication: buildAuthentication(openApiSpec, {
    operationIds: zapierCreateOperationIds,
  }),
  creates: buildZapierCreatesFromOpenApi(openApiSpec, {
    operationIds: zapierCreateOperationIds,
  }),
});

export = app;
