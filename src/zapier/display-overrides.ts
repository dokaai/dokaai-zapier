import { zapierLabel } from '../openapi/runtime';
import type { OpenApiOperation } from '../openapi/types';

type ZapierDisplayOverride = {
  label: string;
  description: string;
};

const ZAPIER_DISPLAY_OVERRIDES: Record<string, ZapierDisplayOverride> = {
  addCustomersToPool: {
    label: 'Add Customers to Pool',
    description: 'Adds customers to a customer pool.',
  },
  addCustomerCustomAttribute: {
    label: 'Create Customer Custom Attribute',
    description: 'Creates a customer custom attribute.',
  },
  associateCustomerToTargetAudienceList: {
    label: 'Add Customers to Target Audience List',
    description: 'Adds customers to a target audience list.',
  },
  deleteCustomerFromTargetAudienceList: {
    label: 'Remove Customer From Target Audience List',
    description: 'Removes a customer from a target audience list.',
  },
  updateCustomerInPool: {
    label: 'Update Customer in Pool',
    description: 'Updates a customer in a pool.',
  },
  removeCustomerFromPool: {
    label: 'Remove Customer From Pool',
    description: 'Removes a customer from a pool.',
  },
  triggerNotificationHandler: {
    label: 'Send Notification',
    description: 'Sends a notification using a notification handler.',
  },
  getPoolCustomers: {
    label: 'Find Pool Customers',
    description: 'Finds customers in a pool.',
  },
  getPoolCustomerById: {
    label: 'Find Pool Customer by ID',
    description: 'Finds a customer in a pool by ID.',
  },
  getNotificationHandler: {
    label: 'Find Notification Handler',
    description: 'Finds a notification handler by ID.',
  },
  getAllNotificationHandlersInProject: {
    label: 'Find Notification Handlers',
    description: 'Finds notification handlers in the current project.',
  },
  getNotificationHandlerByKey: {
    label: 'Find Notification Handler by Key',
    description: 'Finds a notification handler by its handler key.',
  },
};

export const zapierDisplayForOperation = (
  operation: OpenApiOperation,
  fallbackKey: string,
): ZapierDisplayOverride => {
  const operationId = operation.operationId;

  if (operationId !== undefined) {
    const override = ZAPIER_DISPLAY_OVERRIDES[operationId];

    if (override !== undefined) {
      return override;
    }
  }

  const label = zapierLabel(operation.summary ?? operationId ?? fallbackKey);

  return {
    label,
    description: operation.description ?? operation.summary ?? label,
  };
};
