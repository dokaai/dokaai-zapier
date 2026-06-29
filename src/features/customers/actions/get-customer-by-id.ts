import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { getCustomer } from '../api';
import {
  customerIdField,
  customerProjectAndPoolFields,
} from '../fields/static-fields';

export const getCustomerByIdCreate = defineCreate({
  operation: {
    perform: getCustomer,
    inputFields: defineInputFields([
      ...customerProjectAndPoolFields.map((field) => ({
        ...field,
        altersDynamicFields: false,
      })),
      customerIdField,
    ]),
    sample: {
      id: 'ffab69b1-433a-4339-9e89-06e22981c984',
      customerId: 'ffab69b1-433a-4339-9e89-06e22981c984',
      status: 'success',
      message: 'Pool Customer Fetched Successfully',
      uniqueCustomerId: 'test-01',
      emailId: 'ayush.srivastava@nthexam.com',
      phoneNumber: '+919369450531',
      name: 'Ayusshhhhh',
      iosDeviceTokens: [],
      androidDeviceTokens: ['ddddd'],
    },
  },
  display: {
    description:
      'Fetches a customer from a Dokaai customer pool using the internal customer ID.',
    hidden: false,
    label: 'Get Customer by ID',
  },
  key: 'get_customer_by_id',
  noun: 'Customer',
});
