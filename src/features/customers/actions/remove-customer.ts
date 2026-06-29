import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { removeCustomer } from '../api';
import {
  customerIdField,
  customerProjectAndPoolFields,
} from '../fields/static-fields';

export const removeCustomerCreate = defineCreate({
  operation: {
    perform: removeCustomer,
    inputFields: defineInputFields([
      ...customerProjectAndPoolFields.map((field) => ({
        ...field,
        altersDynamicFields: false,
      })),
      customerIdField,
    ]),
  },
  display: {
    description: 'Removes a customer from a Dokaai customer pool.',
    hidden: false,
    label: 'Delete Customer',
  },
  key: 'delete_customer',
  noun: 'Customer',
});
