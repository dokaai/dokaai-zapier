const perform = async (z, bundle) => {
  return [bundle.cleanedRequest];
};

const performSubscribe = async (z, bundle) => {
  const projectId = String(bundle.inputData.projectId || '').trim();

  if (!projectId) {
    return [];
  }

  const response = await z.request({
    method: 'GET',
    url: `https://api-200422742317.asia-south1.run.app/api/v1/dokaai/customer/projects/${encodeURIComponent(
      projectId,
    )}/customer-pools/`,
    headers: {
      'x-client-key': bundle.authData['x-client-key'],
      'x-client-secret': bundle.authData['x-client-secret'],
      Accept: 'application/json',
    },
  });

  response.throwForStatus();

  const result = response.json;

  if (result.status !== 'success') {
    throw new z.errors.Error(
      result.message || 'Unable to fetch customer pools.',
      'CustomerPoolsError',
      400,
    );
  }

  const pools = Array.isArray(result.data) ? result.data : [];

  return pools.map((pool) => ({
    id: pool.id,
    name: pool.name || pool.id,
    description: pool.description || '',
    poolLevel: pool.poolLevel || '',
    isOwner: Boolean(pool.isOwner),
    accessLevel: pool.accessLevel || '',
  }));
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'projectId',
        type: 'string',
        label: 'Project ID',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
    type: 'hook',
    performSubscribe: performSubscribe,
  },
  display: {
    description: 'Returns customer pools available in a Dokaai project.',
    hidden: false,
    label: 'Find Customer Pools',
  },
  key: 'find_customer_pools',
  noun: 'Customer Pool',
};
