import type { Bundle, ZObject } from 'zapier-platform-core';

import { isRecord } from '../../core/zapier';
import {
  authHeaders,
  findOperationById,
  getOpenApiBaseUrl,
  pathFromTemplate,
  toZapierMethod,
} from '../../openapi/runtime';
import type { OpenApiDocument } from '../../openapi/types';

export type ZapierChoice = {
  value: string;
  sample: string;
  label: string;
};

export type ZapierDynamicChoices = {
  results: ZapierChoice[];
  paging_token?: string | null;
};

type PaginatedChoiceOptions = {
  document: OpenApiDocument;
  operationId: string;
  z: ZObject;
  bundle: Bundle;
  inputData?: Record<string, unknown>;
  params?: Record<string, unknown>;
  mapItem: (item: Record<string, unknown>) => ZapierChoice | undefined;
};

const readPage = (bundle: Bundle): number => {
  const rawPage = bundle.meta?.paging_token ?? bundle.meta?.page ?? 1;
  const page = Number(rawPage);

  return Number.isFinite(page) && page > 0 ? page : 1;
};

const readSearch = (bundle: Bundle): string | undefined => {
  const inputSearch = bundle.inputData.search;

  if (typeof inputSearch === 'string' && inputSearch.trim().length > 0) {
    return inputSearch;
  }

  const cleanedSearch =
    typeof bundle.cleanedRequest?.querystring === 'object'
      ? bundle.cleanedRequest.querystring.search
      : undefined;

  return typeof cleanedSearch === 'string' && cleanedSearch.trim().length > 0
    ? cleanedSearch
    : undefined;
};

export const loadPaginatedChoices = async ({
  document,
  operationId,
  z,
  bundle,
  inputData = {},
  params = {},
  mapItem,
}: PaginatedChoiceOptions): Promise<ZapierDynamicChoices> => {
  const operation = findOperationById(document, operationId);

  if (operation === undefined) {
    return { results: [], paging_token: null };
  }

  const requestInputData = {
    ...bundle.inputData,
    ...inputData,
  };
  const page = readPage(bundle);
  const search = readSearch(bundle);
  const response = await z.request({
    url: `${getOpenApiBaseUrl(document)}${pathFromTemplate(
      operation.path,
      requestInputData,
    )}`,
    method: toZapierMethod(operation.method),
    headers: {
      Accept: 'application/json',
      ...authHeaders(document, bundle),
    },
    params: {
      page: String(page),
      size: '100',
      ...(search === undefined ? {} : { search }),
      ...params,
    },
    removeMissingValuesFrom: {
      params: true,
    },
  });

  response.throwForStatus();

  const raw = response.json ?? response.data;
  const items = isRecord(raw) && Array.isArray(raw.data) ? raw.data : [];
  const hasMore =
    isRecord(raw) &&
    isRecord(raw.metaData) &&
    raw.metaData.hasMore === true;
  const results = items.flatMap((item): ZapierChoice[] => {
    if (!isRecord(item)) {
      return [];
    }

    const choice = mapItem(item);

    return choice === undefined ? [] : [choice];
  });

  return {
    results,
    paging_token: hasMore ? String(page + 1) : null,
  };
};

export const choiceFromIdName = (
  item: Record<string, unknown>,
): ZapierChoice | undefined => {
  if (typeof item.id !== 'string' || typeof item.name !== 'string') {
    return undefined;
  }

  return {
    value: item.id,
    sample: item.id,
    label: item.name,
  };
};
