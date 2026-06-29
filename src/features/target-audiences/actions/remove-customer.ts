import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { removeCustomerFromTargetAudience } from '../api';
import {
  targetAudienceBaseFields,
  targetAudienceCustomerIdField,
} from '../fields';

export const removeCustomerFromTargetAudienceCreate = defineCreate({
  operation: {
    perform: removeCustomerFromTargetAudience,
    inputFields: defineInputFields([
      ...targetAudienceBaseFields,
      targetAudienceCustomerIdField,
    ]),
    sample: {
      id: 'ffab69b1-433a-4339-9e89-06e22981c984',
      customerId: 'ffab69b1-433a-4339-9e89-06e22981c984',
      targetAudienceListId: '277702f9-9017-4a07-814a-8ce000a58176',
      status: 'success',
      message: 'Customer removed from TAL successfully',
      data: { id: '277702f9-9017-4a07-814a-8ce000a58176' },
    },
  },
  display: {
    description: 'Removes a customer from a Dokaai target audience list.',
    hidden: false,
    label: 'Remove Customer from Target Audience List',
  },
  key: 'remove_customer_from_target_audience',
  noun: 'Target Audience Customer',
});
