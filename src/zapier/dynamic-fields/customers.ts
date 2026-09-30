import type { Bundle, ZObject } from 'zapier-platform-core';

import type {
  GeneratedInputField,
  OpenApiDocument,
  OpenApiOperation,
} from '../../openapi/types';
import { loadPaginatedChoices } from './choice-utils';

const customerLabel = (customer: Record<string, unknown>): string | undefined => {
  const name =
    typeof customer.name === 'string' && customer.name.trim().length > 0
      ? customer.name.trim()
      : undefined;
  const uniqueCustomerId =
    typeof customer.uniqueCustomerId === 'string' &&
    customer.uniqueCustomerId.trim().length > 0
      ? customer.uniqueCustomerId.trim()
      : undefined;
  const email =
    typeof customer.emailId === 'string' && customer.emailId.trim().length > 0
      ? customer.emailId.trim()
      : undefined;

  if (name !== undefined && uniqueCustomerId !== undefined) {
    return `${name} (${uniqueCustomerId})`;
  }

  return name ?? uniqueCustomerId ?? email;
};

export const customerChoices =
  (document: OpenApiDocument, operationId: string) =>
  async (z: ZObject, bundle: Bundle) => {
    const requiredInputs =
      operationId === 'getPoolCustomers'
        ? ['projectId', 'customerPoolId']
        : ['projectId', 'targetAudienceListId'];
    const hasRequiredInputs = requiredInputs.every((key) => {
      const value = bundle.inputData[key];

      return typeof value === 'string' || typeof value === 'number';
    });

    if (!hasRequiredInputs) {
      return { results: [], paging_token: null };
    }

    return loadPaginatedChoices({
      document,
      operationId,
      z,
      bundle,
      mapItem: (customer) => {
        const value =
          typeof customer.id === 'string' ? customer.id : undefined;
        const label = customerLabel(customer) ?? value;

        if (value === undefined || label === undefined) {
          return undefined;
        }

        return {
          value,
          sample: value,
          label,
        };
      },
    });
  };

export const applyCustomerChoices = (
  _document: OpenApiDocument,
  field: GeneratedInputField,
  operation: OpenApiOperation,
): GeneratedInputField => {
  if (field.key !== 'customerId') {
    return field;
  }

  const parameterNames = new Set(
    (operation.parameters ?? []).map((parameter) => parameter.name),
  );

  if (parameterNames.has('customerPoolId')) {
    return {
      ...field,
      dependsOn: ['projectId', 'customerPoolId'],
      dynamic: 'pool_customers.id.name',
    };
  }

  if (parameterNames.has('targetAudienceListId')) {
    return {
      ...field,
      dependsOn: ['projectId', 'targetAudienceListId'],
      dynamic: 'target_audience_customers.id.name',
    };
  }

  return field;
};
