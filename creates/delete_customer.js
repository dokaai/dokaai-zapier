const perform = async (z, bundle) => {
  const projectId = String(bundle.inputData.projectId || '').trim();

  const customerPoolId = String(bundle.inputData.customerPoolId || '').trim();

  const customerId = String(bundle.inputData.customerId || '').trim();

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
    )}/customer/${encodeURIComponent(customerId)}/status`,

    method: 'PATCH',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    params: {},

    body: {},

    removeMissingValuesFrom: {
      body: true,
      params: true,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();

    const result = response.json;

    return {
      id: result.data?.id || customerId,
      customerId: result.data?.id || customerId,
      status: result.status,
      message: result.message,
    };
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
  },
  display: {
    description: 'Removes a customer from a Dokaai customer pool.',
    hidden: false,
    label: 'Delete Customer',
  },
  key: 'delete_customer',
  noun: 'Customer',
};
