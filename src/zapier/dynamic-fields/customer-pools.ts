import type { Bundle, ZObject } from 'zapier-platform-core';

import { isRecord } from '../../core/zapier';
import {
  authHeaders,
  findOperationById,
  getOpenApiBaseUrl,
  pathFromTemplate,
  toZapierMethod,
} from '../../openapi/runtime';
import type { GeneratedInputField, OpenApiDocument } from '../../openapi/types';

type ZapierChoice = {
  value: string;
  sample: string;
  label: string;
};

type ZapierDynamicChoices = {
  results: ZapierChoice[];
};

export const customerPoolChoices =
  (document: OpenApiDocument) =>
  async (z: ZObject, bundle: Bundle): Promise<ZapierDynamicChoices> => {
    const listPoolsOperation = findOperationById(
      document,
      'getAllCustomerPoolInProject',
    );
    const { projectId } = bundle.inputData;

    if (
      listPoolsOperation === undefined ||
      (typeof projectId !== 'string' && typeof projectId !== 'number')
    ) {
      return { results: [] };
    }

    const url = `${getOpenApiBaseUrl(document)}${pathFromTemplate(
      listPoolsOperation.path,
      bundle.inputData,
    )}`;

    const response = await z.request({
      url,
      method: toZapierMethod(listPoolsOperation.method),
      headers: {
        Accept: 'application/json',
        ...authHeaders(document, bundle),
      },
    });

    response.throwForStatus();

    const raw = response.json ?? response.data;
    const customerPools = isRecord(raw) && Array.isArray(raw.data) ? raw.data : [];

    const results = customerPools.flatMap((customerPool): ZapierChoice[] => {
      if (
        !isRecord(customerPool) ||
        typeof customerPool.id !== 'string' ||
        typeof customerPool.name !== 'string'
      ) {
        return [];
      }

      return [
        {
          value: customerPool.id,
          sample: customerPool.id,
          label: customerPool.name,
        },
      ];
    });

    return { results };
  };

export const applyCustomerPoolChoices = (
  document: OpenApiDocument,
  field: GeneratedInputField,
): GeneratedInputField => {
  if (field.key !== 'customerPoolId') {
    return field;
  }

  return {
    ...field,
    dependsOn: ['projectId'],
    altersDynamicFields: true,
    choices: {
      perform: customerPoolChoices(document),
    },
  };
};
