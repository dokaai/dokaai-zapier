import type { Bundle, ZObject } from 'zapier-platform-core';

import type { GeneratedInputField, OpenApiDocument } from '../../openapi/types';
import { loadPaginatedChoices } from './choice-utils';

export const notificationHandlerChoices =
  (document: OpenApiDocument) => async (z: ZObject, bundle: Bundle) => {
    const { projectId } = bundle.inputData;

    if (typeof projectId !== 'string' && typeof projectId !== 'number') {
      return { results: [], paging_token: null };
    }

    return loadPaginatedChoices({
      document,
      operationId: 'getAllNotificationHandlersInProject',
      z,
      bundle,
      mapItem: (notificationHandler) => {
        const value =
          typeof notificationHandler.id === 'string'
            ? notificationHandler.id
            : undefined;

        if (
          value === undefined ||
          typeof notificationHandler.name !== 'string'
        ) {
          return undefined;
        }

        return {
          value,
          sample: value,
          label: notificationHandler.name,
        };
      },
    });
  };

export const applyNotificationHandlerChoices = (
  document: OpenApiDocument,
  field: GeneratedInputField,
): GeneratedInputField => {
  if (field.key !== 'notificationHandlerId') {
    return field;
  }

  return {
    ...field,
    dependsOn: ['projectId'],
    choices: {
      perform: notificationHandlerChoices(document),
    },
  };
};
