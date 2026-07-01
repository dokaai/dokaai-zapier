import type { Bundle, ZObject } from 'zapier-platform-core';

import { isRecord } from '../../core/zapier';
import {
  authHeaders,
  findOperationById,
  getOpenApiBaseUrl,
  humanize,
  pathFromTemplate,
  toZapierMethod,
} from '../../openapi/runtime';
import type { GeneratedInputField, OpenApiDocument } from '../../openapi/types';

const mapCustomerAttributeFieldType = (
  fieldType: unknown,
): NonNullable<GeneratedInputField['type']> => {
  if (fieldType === 'number') {
    return 'number';
  }

  if (fieldType === 'boolean') {
    return 'boolean';
  }

  if (fieldType === 'date' || fieldType === 'dateTime') {
    return 'datetime';
  }

  if (fieldType === 'json') {
    return 'text';
  }

  return 'string';
};

export const customerPoolAttributeFields =
  (document: OpenApiDocument) =>
  async (z: ZObject, bundle: Bundle): Promise<GeneratedInputField[]> => {
    const attributesOperation = findOperationById(
      document,
      'getPoolCustomerAttribute',
    );

    if (attributesOperation === undefined) {
      return [];
    }

    const { projectId, customerPoolId } = bundle.inputData;

    if (
      (typeof projectId !== 'string' && typeof projectId !== 'number') ||
      (typeof customerPoolId !== 'string' && typeof customerPoolId !== 'number')
    ) {
      return [];
    }

    const url = `${getOpenApiBaseUrl(document)}${pathFromTemplate(
      attributesOperation.path,
      bundle.inputData,
    )}`;
    const response = await z.request({
      url,
      method: toZapierMethod(attributesOperation.method),
      headers: {
        Accept: 'application/json',
        ...authHeaders(document, bundle),
      },
      params: {
        attributeTypes: 'custom',
        page: '1',
        size: '100',
      },
      removeMissingValuesFrom: {
        params: true,
      },
    });

    response.throwForStatus();

    const raw = response.json ?? response.data;
    const attributes = isRecord(raw) && Array.isArray(raw.data) ? raw.data : [];

    return attributes.flatMap((attribute): GeneratedInputField[] => {
      if (!isRecord(attribute) || typeof attribute.fieldName !== 'string') {
        return [];
      }

      const field: GeneratedInputField = {
        key: attribute.fieldName,
        label:
          typeof attribute.fieldDisplayName === 'string'
            ? attribute.fieldDisplayName
            : humanize(attribute.fieldName),
        type: mapCustomerAttributeFieldType(attribute.fieldType),
        required: attribute.isMandatory === true,
      };

      if (attribute.fieldDescription !== undefined) {
        field.helpText = String(attribute.fieldDescription);
      }

      if (attribute.fieldType === 'array') {
        field.list = true;
      }

      return [field];
    });
  };
