// Used for PUT, POST, PATCH and DELETE operations in Zapier actions
export const zapierActionOperationIds = [
  'addCustomersToPool',
  'addCustomerCustomAttribute',
  'associateCustomerToTargetAudienceList',
  'deleteCustomerFromTargetAudienceList',
  'updateCustomerInPool',
  'removeCustomerFromPool',
  'triggerNotificationHandler'
] as const;

// Used for GET operations in Zapier searches
export const zapierSearchOperationIds = [
  'getPoolCustomers',
  'getPoolCustomerById',
  'getNotificationHandler',
  'getAllNotificationHandlersInProject'
] as const;
