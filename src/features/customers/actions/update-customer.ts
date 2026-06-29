import { defineCreate, defineInputFields } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { updateCustomer } from '../api';
import { buildCustomerFields, fetchCustomerAttributes } from '../fields';
import {
  customerIdField,
  customerProjectAndPoolFields,
} from '../fields/static-fields';

const dynamicInputFields = async (z: ZObject, bundle: Bundle) =>
  buildCustomerFields(await fetchCustomerAttributes(z, bundle), {
    mode: 'update',
    forceOptional: true,
  });

export const updateCustomerCreate = defineCreate({
  operation: {
    perform: updateCustomer,
    inputFields: defineInputFields([
      ...customerProjectAndPoolFields,
      customerIdField,
      dynamicInputFields,
    ]),
  },
  display: {
    description: 'Updates an existing customer in a Dokaai customer pool.',
    hidden: false,
    label: 'Update Customer',
  },
  key: 'update_customer',
  noun: 'Customer',
});
