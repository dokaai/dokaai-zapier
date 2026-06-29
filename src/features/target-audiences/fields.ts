import { defineInputFields } from 'zapier-platform-core';

export const targetAudienceBaseFields = defineInputFields([
  {
    key: 'projectId',
    label: 'Project ID',
    type: 'string',
    required: true,
    list: false,
    altersDynamicFields: false,
  },
  {
    key: 'targetAudienceListId',
    label: 'Target Audience List ID',
    type: 'string',
    required: true,
    list: false,
    altersDynamicFields: false,
  },
]);

export const customerIdsField = {
  key: 'customerIds',
  label: 'Customer IDs',
  type: 'string',
  required: true,
  list: true,
  altersDynamicFields: false,
} as const;

export const targetAudienceCustomerIdField = {
  key: 'customerId',
  label: 'Customer ID',
  type: 'string',
  required: true,
  list: false,
  altersDynamicFields: false,
} as const;
