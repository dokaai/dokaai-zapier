import { defineCreate, defineInputFields } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { createCustomer } from '../api';
import { buildCustomerFields, fetchCustomerAttributes } from '../fields';
import { customerProjectAndPoolFields } from '../fields/static-fields';

const dynamicInputFields = async (z: ZObject, bundle: Bundle) =>
  buildCustomerFields(await fetchCustomerAttributes(z, bundle), {
    mode: 'create',
  });

export const createCustomerCreate = defineCreate({
  operation: {
    perform: createCustomer,
    inputFields: defineInputFields([
      ...customerProjectAndPoolFields,
      dynamicInputFields,
    ]),
    sample: {
      status: 'success',
      message: 'Customer added to pool successfully',
      data: { customerId: 'ffab69b1-433a-4339-9e89-06e22981c984' },
      metaData: null,
      error: null,
    },
  },
  display: {
    description: 'Creates a customer in a Dokaai customer pool.',
    hidden: false,
    label: 'Create Customer',
  },
  key: 'create_customer',
  noun: 'Customer',
});
