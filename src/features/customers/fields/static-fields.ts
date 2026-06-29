import { defineInputFields } from 'zapier-platform-core';

export const customerProjectAndPoolFields = defineInputFields([
  {
    key: 'projectId',
    label: 'Project ID',
    type: 'string',
    required: true,
    list: false,
    altersDynamicFields: false,
  },
  {
    key: 'customerPoolId',
    label: 'Customer Pool ID',
    type: 'string',
    required: true,
    list: false,
    altersDynamicFields: true,
  },
]);

export const customerIdField = {
  key: 'customerId',
  label: 'Customer ID',
  type: 'string',
  required: true,
  list: false,
  altersDynamicFields: false,
} as const;
