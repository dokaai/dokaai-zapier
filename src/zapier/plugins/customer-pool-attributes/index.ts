import { shouldIncludeValue } from '../../../openapi/runtime';
import {
  customerPoolAttributeFields,
  CUSTOMER_ATTRIBUTE_FIELD_PREFIX,
} from '../../dynamic-fields/customer-pool-attributes';
import type { ZapierOperationPlugin } from '../types';

const CUSTOMER_ATTRIBUTE_BODY_KEY = 'customAttribute';
const CUSTOMER_ATTRIBUTE_OPERATION_IDS = new Set([
  'addCustomersToPool',
  'updateCustomerInPool',
]);

const collectCustomerAttributeValues = (
  inputData: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(inputData).flatMap(([key, value]) =>
      key.startsWith(CUSTOMER_ATTRIBUTE_FIELD_PREFIX) &&
      shouldIncludeValue(value)
        ? [[key.slice(CUSTOMER_ATTRIBUTE_FIELD_PREFIX.length), value]]
        : [],
    ),
  );

export const customerPoolAttributesPlugin: ZapierOperationPlugin = {
  appliesTo: ({ discovered }) =>
    discovered.operation.operationId !== undefined &&
    CUSTOMER_ATTRIBUTE_OPERATION_IDS.has(discovered.operation.operationId),

  excludedBodyFields: () => [CUSTOMER_ATTRIBUTE_BODY_KEY],

  inputFields: ({ document }) => [customerPoolAttributeFields(document)],

  bodyFields: (_context, inputData) => {
    const customAttribute = collectCustomerAttributeValues(inputData);

    return Object.keys(customAttribute).length > 0
      ? { [CUSTOMER_ATTRIBUTE_BODY_KEY]: customAttribute }
      : {};
  },
};
