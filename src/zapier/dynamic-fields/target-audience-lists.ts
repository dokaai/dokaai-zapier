import type { Bundle, ZObject } from 'zapier-platform-core';

import type { GeneratedInputField, OpenApiDocument } from '../../openapi/types';
import { choiceFromIdName, loadPaginatedChoices } from './choice-utils';

export const targetAudienceListChoices =
  (document: OpenApiDocument) => async (z: ZObject, bundle: Bundle) => {
    const { projectId } = bundle.inputData;

    if (typeof projectId !== 'string' && typeof projectId !== 'number') {
      return { results: [], paging_token: null };
    }

    return loadPaginatedChoices({
      document,
      operationId: 'getTargetAudienceLists',
      z,
      bundle,
      mapItem: choiceFromIdName,
    });
  };

export const applyTargetAudienceListChoices = (
  document: OpenApiDocument,
  field: GeneratedInputField,
): GeneratedInputField => {
  if (field.key !== 'targetAudienceListId' && field.key !== 'filterOutTALId') {
    return field;
  }

  return {
    ...field,
    dependsOn: ['projectId'],
    altersDynamicFields: true,
    choices: {
      perform: targetAudienceListChoices(document),
    },
  };
};
