import { defineInputFields } from 'zapier-platform-core';

export const authenticationFields = defineInputFields([
  {
    helpText: 'Enter your Dokaai x-client-key.',
    computed: false,
    key: 'x-client-key',
    required: true,
    label: 'Client Key',
    type: 'password',
  },
  {
    helpText: 'Enter your Dokaai x-client-secret.',
    computed: false,
    key: 'x-client-secret',
    required: true,
    label: 'Client Secret',
    type: 'password',
  },
]);
