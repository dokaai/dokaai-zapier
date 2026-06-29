const perform = async (z, bundle) => {
  const projectId = String(bundle.inputData.projectId || '').trim();

  const customerPoolId = String(bundle.inputData.customerPoolId || '').trim();

  const customerId = String(bundle.inputData.customerId || '').trim();

  const attributeTypes = String(
    bundle.inputData.attributeTypes || 'all',
  ).trim();

  if (!projectId) {
    throw new z.errors.Error(
      'Project ID is required.',
      'MissingProjectId',
      400,
    );
  }

  if (!customerPoolId) {
    throw new z.errors.Error(
      'Customer Pool ID is required.',
      'MissingCustomerPoolId',
      400,
    );
  }

  if (!customerId) {
    throw new z.errors.Error(
      'Customer ID is required.',
      'MissingCustomerId',
      400,
    );
  }

  const options = {
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/customer/projects/${encodeURIComponent(
      projectId,
    )}/customer-pools/${encodeURIComponent(
      customerPoolId,
    )}/customers/${encodeURIComponent(customerId)}`,

    method: 'GET',

    headers: {
      Accept: 'application/json',
    },

    params: {
      attributeTypes,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();

    const result = response.json;
    const attributes = result.data || {};

    const customer = {
      id: customerId,
      customerId,
      status: result.status,
      message: result.message,
    };

    for (const [key, attribute] of Object.entries(attributes)) {
      if (
        attribute &&
        typeof attribute === 'object' &&
        !Array.isArray(attribute) &&
        Object.prototype.hasOwnProperty.call(attribute, 'value')
      ) {
        customer[key] =
          attribute.value === null || attribute.value === undefined
            ? ''
            : attribute.value;
      } else {
        customer[key] = attribute;
      }
    }

    return customer;
  });
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
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
        altersDynamicFields: false,
      },
      {
        key: 'customerId',
        label: 'Customer ID',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
    sample: {
      id: 'ffab69b1-433a-4339-9e89-06e22981c984',
      customerId: 'ffab69b1-433a-4339-9e89-06e22981c984',
      status: 'success',
      message: 'Pool Customer Fetched Successfully',
      uniqueCustomerId: 'test-01',
      emailId: 'ayush.srivastava@nthexam.com',
      phoneNumber: '+919369450531',
      name: 'Ayusshhhhh',
      pinCode: '233228',
      countryIsoCode: '',
      iosDeviceTokens: [],
      androidDeviceTokens: ['ddddd'],
      timeZone: '',
      test_attribute: '',
      test_date: '',
      ewwe: '',
      qweqrqrq: '',
      test_vn: '',
      test_hhv: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth: '',
      location: '',
      gender: '',
      profile: '',
      tenant_id: '',
      user_name: '',
      test_uu: '',
      test_oo: '',
      test_ddd: '',
      test_srivastava: '',
      test_ee: '',
      test_attr: '',
      test_hh: '',
      test: '',
      token: '',
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
};
