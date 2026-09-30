import { defineInputFields, defineTrigger } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import type { GeneratedInputField, OpenApiDocument } from '../../openapi/types';
import {
  customerChoices,
  customerPoolChoices,
  notificationHandlerChoices,
  projectChoices,
  targetAudienceListChoices,
} from '../dynamic-fields';
import type { ZapierDynamicChoices } from '../dynamic-fields';

type ChoiceLoader = (
  z: ZObject,
  bundle: Bundle,
) => Promise<ZapierDynamicChoices>;

const projectField: GeneratedInputField = {
  key: 'projectId',
  label: 'Project',
  required: true,
  altersDynamicFields: true,
  dynamic: 'projects.id.name',
};

const customerPoolField: GeneratedInputField = {
  key: 'customerPoolId',
  label: 'Customer Pool',
  required: true,
  dependsOn: ['projectId'],
  altersDynamicFields: true,
  dynamic: 'customer_pools.id.name',
};

const targetAudienceListField: GeneratedInputField = {
  key: 'targetAudienceListId',
  label: 'Target Audience List',
  required: true,
  dependsOn: ['projectId'],
  altersDynamicFields: true,
  dynamic: 'target_audience_lists.id.name',
};

const recordsFromChoices =
  (loadChoices: ChoiceLoader) =>
  async (z: ZObject, bundle: Bundle): Promise<Record<string, unknown>[]> => {
    const { results } = await loadChoices(z, bundle);

    return results.map((choice) => ({
      id: choice.value,
      name: choice.label,
    }));
  };

const hiddenDisplay = (resource: string) => ({
  label: `List ${resource}`,
  description: `Loads ${resource.toLowerCase()} for dynamic dropdowns.`,
  hidden: true,
});

export const buildDropdownTriggers = (
  document: OpenApiDocument,
): Record<string, ReturnType<typeof defineTrigger>> => ({
  projects: defineTrigger({
    key: 'projects',
    noun: 'Project',
    display: hiddenDisplay('Projects'),
    operation: {
      perform: recordsFromChoices(projectChoices(document)),
    },
  }),
  customer_pools: defineTrigger({
    key: 'customer_pools',
    noun: 'Customer Pool',
    display: hiddenDisplay('Customer Pools'),
    operation: {
      inputFields: defineInputFields([projectField] as never),
      perform: recordsFromChoices(customerPoolChoices(document)),
    },
  }),
  target_audience_lists: defineTrigger({
    key: 'target_audience_lists',
    noun: 'Target Audience List',
    display: hiddenDisplay('Target Audience Lists'),
    operation: {
      inputFields: defineInputFields([projectField] as never),
      perform: recordsFromChoices(targetAudienceListChoices(document)),
      canPaginate: true,
    },
  }),
  notification_handlers: defineTrigger({
    key: 'notification_handlers',
    noun: 'Notification Handler',
    display: hiddenDisplay('Notification Handlers'),
    operation: {
      inputFields: defineInputFields([projectField] as never),
      perform: recordsFromChoices(notificationHandlerChoices(document)),
      canPaginate: true,
    },
  }),
  pool_customers: defineTrigger({
    key: 'pool_customers',
    noun: 'Customer',
    display: hiddenDisplay('Pool Customers'),
    operation: {
      inputFields: defineInputFields(
        [projectField, customerPoolField] as never,
      ),
      perform: recordsFromChoices(
        customerChoices(document, 'getPoolCustomers'),
      ),
      canPaginate: true,
    },
  }),
  target_audience_customers: defineTrigger({
    key: 'target_audience_customers',
    noun: 'Customer',
    display: hiddenDisplay('Target Audience Customers'),
    operation: {
      inputFields: defineInputFields(
        [projectField, targetAudienceListField] as never,
      ),
      perform: recordsFromChoices(
        customerChoices(document, 'getTargetAudienceListCustomers'),
      ),
      canPaginate: true,
    },
  }),
});
