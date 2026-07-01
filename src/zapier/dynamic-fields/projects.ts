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

// TODO: Make this dynamic later on for other services.
const SERVICE_ID = 'f72c921b-0ad0-4387-8ac8-9ff8467d77cc';

export const projectChoices =
  (document: OpenApiDocument) =>
  async (z: ZObject, bundle: Bundle): Promise<ZapierDynamicChoices> => {
    const listProjectsOperation = findOperationById(
      document,
      'getAllProjectsWithService',
    );

    if (listProjectsOperation === undefined) {
      return { results: [] };
    }

    const requestInputData = {
      ...bundle.inputData,
      serviceId: SERVICE_ID,
    };
    const response = await z.request({
      url: `${getOpenApiBaseUrl(document)}${pathFromTemplate(
        listProjectsOperation.path,
        requestInputData,
      )}`,
      method: toZapierMethod(listProjectsOperation.method),
      headers: {
        Accept: 'application/json',
        ...authHeaders(document, bundle),
      },
      params: {
        page: '1',
        size: '100',
      },
      removeMissingValuesFrom: {
        params: true,
      },
    });

    response.throwForStatus();

    const raw = response.json ?? response.data;
    const projects = isRecord(raw) && Array.isArray(raw.data) ? raw.data : [];
    const results = projects.flatMap((project): ZapierChoice[] => {
      if (
        !isRecord(project) ||
        typeof project.id !== 'string' ||
        typeof project.name !== 'string'
      ) {
        return [];
      }

      return [
        {
          value: project.id,
          sample: project.id,
          label: project.name,
        },
      ];
    });

    return { results };
  };

export const applyProjectChoices = (
  document: OpenApiDocument,
  field: GeneratedInputField,
): GeneratedInputField => {
  if (field.key !== 'projectId') {
    return field;
  }

  return {
    ...field,
    altersDynamicFields: true,
    choices: {
      perform: projectChoices(document),
    },
  };
};
