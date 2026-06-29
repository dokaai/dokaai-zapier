const perform = async (z, bundle) => {
  const projectId = String(bundle.inputData.projectId || '').trim();

  const targetAudienceListId = String(
    bundle.inputData.targetAudienceListId || '',
  ).trim();

  const rawCustomerIds = bundle.inputData.customerIds;

  const customerIds = Array.isArray(rawCustomerIds)
    ? rawCustomerIds
    : String(rawCustomerIds || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

  if (!projectId) {
    throw new z.errors.Error(
      'Project ID is required.',
      'MissingProjectId',
      400,
    );
  }

  if (!targetAudienceListId) {
    throw new z.errors.Error(
      'Target Audience List ID is required.',
      'MissingTargetAudienceListId',
      400,
    );
  }

  if (customerIds.length === 0) {
    throw new z.errors.Error(
      'Provide at least one Customer ID.',
      'MissingCustomerIds',
      400,
    );
  }

  const options = {
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/nudge/projects/${encodeURIComponent(
      projectId,
    )}/target-audience-lists/${encodeURIComponent(
      targetAudienceListId,
    )}/customers`,

    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    body: {
      customerIds,
    },

    removeMissingValuesFrom: {
      body: true,
      params: true,
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();

    const result = response.json;

    return {
      id: targetAudienceListId,
      targetAudienceListId,
      customerIds,
      status: result.status,
      message: result.message,
      data: result.data,
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
        key: 'targetAudienceListId',
        label: 'Target Audience List ID',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customerIds',
        label: 'Customer IDs',
        type: 'string',
        required: true,
        list: true,
        altersDynamicFields: false,
      },
    ],
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
};
