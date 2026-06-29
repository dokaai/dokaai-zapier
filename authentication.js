module.exports = {
  type: 'custom',
  test: {
    params: { page: '1', size: '25' },
    removeMissingValuesFrom: { body: false, params: false },
    url: 'https://api-200422742317.asia-south1.run.app/api/v1/dokaai/nudge/projects/344727e4-1640-41a8-818e-de1eef498396/notification-handlers',
  },
  fields: [
    {
      helpText: 'Enter you dokaai x-client-key',
      computed: false,
      key: 'x-client-key',
      required: true,
      label: 'Client Key',
      type: 'password',
    },
    {
      helpText: 'Enter you dokaai x-client-secret',
      computed: false,
      key: 'x-client-secret',
      required: true,
      label: 'Client Secret',
      type: 'password',
    },
  ],
  connectionLabel: 'Dokaai Account',
  customConfig: {},
};
