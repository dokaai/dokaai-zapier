import { shouldIncludeValue } from '../../../openapi/runtime';
import { getJsonRequestSchema, normalizeSchema } from '../../../openapi/schema';
import { customerPoolAttributeFields } from '../../dynamic-fields/customer-pool-attributes';
import type { ZapierOperationPlugin } from '../types';
import type { ZapierOperationPluginContext } from '../types';

const CUSTOMER_ATTRIBUTE_OPERATION_IDS = new Set([
  'addCustomersToPool',
  'updateCustomerInPool',
]);

const knownOperationFieldKeys = ({
  discovered,
}: ZapierOperationPluginContext): Set<string> => {
  const requestSchema = normalizeSchema(
    getJsonRequestSchema(discovered.operation.requestBody),
  );
  const bodySchema = normalizeSchema(
    discovered.bodyRoot === undefined
      ? requestSchema
      : requestSchema.properties?.[discovered.bodyRoot],
  );

  return new Set([
    ...(discovered.operation.parameters ?? []).map(
      (parameter) => parameter.name,
    ),
    ...Object.keys(bodySchema.properties ?? {}),
  ]);
};

const collectCustomerAttributeValues = (
  context: ZapierOperationPluginContext,
  inputData: Record<string, unknown>,
): Record<string, unknown> => {
  const knownFields = knownOperationFieldKeys(context);

  return Object.fromEntries(
    Object.entries(inputData).filter(
      ([key, value]) => !knownFields.has(key) && shouldIncludeValue(value),
    ),
  );
};

export const customerPoolAttributesPlugin: ZapierOperationPlugin = {
  appliesTo: ({ discovered }) =>
    discovered.operation.operationId !== undefined &&
    CUSTOMER_ATTRIBUTE_OPERATION_IDS.has(discovered.operation.operationId),

  inputFields: ({ document }) => [customerPoolAttributeFields(document)],

  bodyFields: (context, inputData) =>
    collectCustomerAttributeValues(context, inputData),
};
