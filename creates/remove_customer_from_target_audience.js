const perform = async (z, bundle) => {
  const projectId = String(bundle.inputData.projectId || '').trim();

  const targetAudienceListId = String(
    bundle.inputData.targetAudienceListId || '',
  ).trim();

  const customerId = String(bundle.inputData.customerId || '').trim();

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

  if (!customerId) {
    throw new z.errors.Error(
      'Customer ID is required.',
      'MissingCustomerId',
      400,
    );
  }

  const options = {
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/nudge/projects/${encodeURIComponent(
      projectId,
    )}/target-audience-lists/${encodeURIComponent(
      targetAudienceListId,
    )}/customer/${encodeURIComponent(customerId)}`,

    method: 'PATCH',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

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
      id: customerId,
      customerId,
      targetAudienceListId,
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
};
