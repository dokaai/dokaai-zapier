const perform = async (z, bundle) => {
  const { projectId, customerPoolId, customerId, ...dynamicCustomerFields } =
    bundle.inputData;

  const cleanProjectId = String(projectId || '').trim();
  const cleanCustomerPoolId = String(customerPoolId || '').trim();
  const cleanCustomerId = String(customerId || '').trim();

  if (!cleanProjectId) {
    throw new z.errors.Error(
      'Project ID is required.',
      'MissingProjectId',
      400,
    );
  }

  if (!cleanCustomerPoolId) {
    throw new z.errors.Error(
      'Customer Pool ID is required.',
      'MissingCustomerPoolId',
      400,
    );
  }

  if (!cleanCustomerId) {
    throw new z.errors.Error(
      'Customer ID is required.',
      'MissingCustomerId',
      400,
    );
  }

  const updateData = Object.fromEntries(
    Object.entries(dynamicCustomerFields).filter(([, value]) => {
      return value !== undefined && value !== null && value !== '';
    }),
  );

  // Prevent accidental updates if Zapier cached this field.
  delete updateData.uniqueCustomerId;

  if (Object.keys(updateData).length === 0) {
    throw new z.errors.Error(
      'Provide at least one customer field to update.',
      'MissingUpdateData',
      400,
    );
  }

  const options = {
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/customer/projects/${encodeURIComponent(
      cleanProjectId,
    )}/customer-pools/${encodeURIComponent(
      cleanCustomerPoolId,
    )}/customers/${encodeURIComponent(cleanCustomerId)}`,

    method: 'PUT',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    params: {},

    body: updateData,

    removeMissingValuesFrom: {
      body: true,
      params: true,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();

    const result = response.json;

    return {
      id: result.data?.customerId || result.data?.id || cleanCustomerId,

      customerId: result.data?.customerId || result.data?.id || cleanCustomerId,

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
      Accept: 'application/json',
    },
    params: {
      attributeTypes: 'all',
      page: 1,
      size: 100,
    },
  });

  response.throwForStatus();

  const result = response.json;

  const attributes = Array.isArray(result.data) ? result.data : [];

  return attributes
    .filter((attribute) => {
      return (
        attribute &&
        attribute.isActive !== false &&
        attribute.fieldName &&
        attribute.fieldName !== 'uniqueCustomerId'
      );
    })
    .map((attribute) => {
      const fieldType = String(attribute.fieldType || 'string').toLowerCase();

      return {
        key: attribute.fieldName,
        label: attribute.fieldDisplayName || attribute.fieldName,
        helpText:
          attribute.fieldDescription ||
          `Enter the new value for ${
            attribute.fieldDisplayName || attribute.fieldName
          }.`,
        type: mapZapierType(fieldType),
        required: false,
        list: fieldType === 'array',
      };
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
        label: 'Customer Pool Id',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: true,
      },
      {
        key: 'customerId',
        label: 'Customer ID',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      inputFields,
    ],
  },
  display: {
    description: 'Updates an existing customer in a Dokaai customer pool.',
    hidden: false,
    label: 'Update Customer',
  },
  key: 'update_customer',
  noun: 'Customer',
};
