import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { addCustomersToTargetAudience } from '../api';
import { customerIdsField, targetAudienceBaseFields } from '../fields';

export const addCustomerToTargetAudienceCreate = defineCreate({
  operation: {
    perform: addCustomersToTargetAudience,
    inputFields: defineInputFields([
      ...targetAudienceBaseFields,
      customerIdsField,
    ]),
    sample: {
      id: '277702f9-9017-4a07-814a-8ce000a58176',
      targetAudienceListId: '277702f9-9017-4a07-814a-8ce000a58176',
      customerIds: [
        'ffab69b1-433a-4339-9e89-06e22981c984',
        'e98f4299-b919-4bc2-9037-f45129c5a5c2',
      ],
      status: 'success',
      message: 'Customers added successfully to target audience list',
      data: { targetAudienceListId: '277702f9-9017-4a07-814a-8ce000a58176' },
    },
  },
  display: {
    description: 'Adds one or more customers to a Dokaai target audience list.',
    hidden: false,
    label: 'Add Customer to Target Audience List',
  },
  key: 'add_customer_to_target_audience',
  noun: 'Target Audience Customer',
});
