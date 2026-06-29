const authentication = require('./authentication');
const findCustomerPoolsTrigger = require('./triggers/find_customer_pools.js');
const createCustomerCreate = require('./creates/create_customer.js');
const updateCustomerCreate = require('./creates/update_customer.js');
const deleteCustomerCreate = require('./creates/delete_customer.js');
const addCustomerToTargetAudienceCreate = require('./creates/add_customer_to_target_audience.js');
const removeCustomerFromTargetAudienceCreate = require('./creates/remove_customer_from_target_audience.js');
const getCustomerByIdCreate = require('./creates/get_customer_by_id.js');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: authentication,
  requestTemplate: {
    params: {},
    headers: {
      'x-client-secret': '{{bundle.authData.x-client-secret}}',
      'x-client-key': '{{bundle.authData.x-client-key}}',
    },
  },
  creates: {
    [createCustomerCreate.key]: createCustomerCreate,
    [updateCustomerCreate.key]: updateCustomerCreate,
    [deleteCustomerCreate.key]: deleteCustomerCreate,
    [addCustomerToTargetAudienceCreate.key]: addCustomerToTargetAudienceCreate,
    [removeCustomerFromTargetAudienceCreate.key]:
      removeCustomerFromTargetAudienceCreate,
    [getCustomerByIdCreate.key]: getCustomerByIdCreate,
  },
  triggers: { [findCustomerPoolsTrigger.key]: findCustomerPoolsTrigger },
};
