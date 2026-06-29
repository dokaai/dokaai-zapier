const perform = async (z, bundle) => {
  const { projectId, customerPoolId, ...dynamicCustomerFields } =
    bundle.inputData;

  // Remove empty optional fields while preserving valid values like:
  // false, 0, empty arrays, etc.
  const customerData = Object.fromEntries(
    Object.entries(dynamicCustomerFields).filter(([, value]) => {
      return value !== undefined && value !== null && value !== '';
    }),
  );

  const options = {
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/customer/projects/${encodeURIComponent(
      projectId,
    )}/customer-pools/${encodeURIComponent(customerPoolId)}/customers`,

    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    params: {},

    body: {
      customerData,
    },

    removeMissingValuesFrom: {
      body: true,
      params: true,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();

    const result = response.json;

    const customerId =
      result.data?.customerId ||
      result.data?.id ||
      customerData.uniqueCustomerId;

    // Zapier create actions should return one object with an `id`.
    return {
      id: customerId,
      customerId,
      uniqueCustomerId: customerData.uniqueCustomerId,
      status: result.status,
      message: result.message,
      data: result.data,
    };
  });
};

const inputFields = async (z, bundle) => {
  const projectId = String(bundle.inputData.projectId || '').trim();
  const customerPoolId = String(bundle.inputData.customerPoolId || '').trim();

  if (!projectId || !customerPoolId) {
    return [];
  }

  const response = await z.request({
    method: 'GET',
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/customer/projects/${encodeURIComponent(
      projectId,
    )}/customer-pools/${encodeURIComponent(customerPoolId)}/attributes`,
    headers: {
      'x-client-key': bundle.authData['x-client-key'],
      'x-client-secret': bundle.authData['x-client-secret'],
      Accept: 'application/json',
    },
    params: {
      attributeTypes: 'all',
      page: '1',
      size: '100',
    },
  });

  response.throwForStatus();

  const result = response.json;

  if (result.status !== 'success') {
    throw new z.errors.Error(
      result.message || 'Unable to load customer attributes.',
      'CustomerAttributesError',
      400,
    );
  }

  const attributes = Array.isArray(result.data) ? result.data : [];

  return attributes
    .filter((attribute) => {
      return attribute && attribute.isActive !== false && attribute.fieldName;
    })
    .map((attribute) => {
      const fieldType = String(attribute.fieldType || 'string').toLowerCase();

      const field = {
        key: attribute.fieldName,
        label: attribute.fieldDisplayName || attribute.fieldName,
        helpText:
          attribute.fieldDescription ||
          `Enter a value for ${attribute.fieldDisplayName || attribute.fieldName}.`,
        required: Boolean(attribute.isMandatory),
        type: mapZapierType(fieldType),
      };

      // iosDeviceTokens, androidDeviceTokens, etc.
      if (fieldType === 'array') {
        field.type = 'string';
        field.list = true;
      }

      return field;
    });

  function mapZapierType(fieldType) {
    switch (fieldType) {
      case 'integer':
        return 'integer';

      case 'number':
      case 'float':
      case 'double':
      case 'decimal':
        return 'number';

      case 'boolean':
        return 'boolean';

      case 'date':
      case 'datetime':
      case 'date_time':
        return 'datetime';

      case 'array':
        return 'string';

      default:
        return 'string';
    }
  }
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
        altersDynamicFields: true,
      },
      inputFields,
    ],
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
};
