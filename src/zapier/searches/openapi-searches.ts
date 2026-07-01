import { defineInputFields, defineSearch } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import { compactInputEntries, isRecord } from '../../core/zapier';
import {
  authHeaders,
  getOpenApiBaseUrl,
  HTTP_METHODS,
  humanize,
  pathFromTemplate,
  readByPath,
  toSnakeCase,
  toZapierMethod,
} from '../../openapi/runtime';
import { getJsonRequestSchema, normalizeSchema } from '../../openapi/schema';
import type {
  DiscoveredZapierOperation,
  GeneratedInputField,
  JsonSchema,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiParameter,
} from '../../openapi/types';

const successResponseSchema = (
  operation: OpenApiOperation,
): JsonSchema | undefined => {
  const response =
    operation.responses?.['200'] ??
    operation.responses?.['201'] ??
    Object.entries(operation.responses ?? {}).find(([status]) =>
      status.startsWith('2'),
    )?.[1];

  return normalizeSchema(getJsonRequestSchema(response));
};

const findIdPath = (
  schema: JsonSchema | undefined,
  prefix = '',
): string | undefined => {
  const normalized = normalizeSchema(schema);
  const properties = normalized.properties ?? {};

  if (properties.id !== undefined) {
    return `${prefix}id`;
  }

  if (properties.customerId !== undefined) {
    return `${prefix}customerId`;
  }

  const idProperty = Object.keys(properties).find((key) => /id$/i.test(key));

  if (idProperty !== undefined) {
    return `${prefix}${idProperty}`;
  }

  for (const [key, property] of Object.entries(properties)) {
    const nested = normalizeSchema(property);

    if (nested.type === 'array') {
      const nestedPath = findIdPath(nested.items, `${prefix}${key}.0.`);

      if (nestedPath !== undefined) {
        return nestedPath;
      }

      continue;
    }

    if (nested.type !== 'object' && nested.properties === undefined) {
      continue;
    }

    const nestedPath = findIdPath(nested, `${prefix}${key}.`);

    if (nestedPath !== undefined) {
      return nestedPath;
    }
  }

  return undefined;
};

const sampleFromOperation = (
  operation: OpenApiOperation,
): Record<string, unknown> => {
  const dataSchema = normalizeSchema(successResponseSchema(operation)?.properties?.data);
  const itemSchema =
    dataSchema.type === 'array' ? normalizeSchema(dataSchema.items) : dataSchema;

  if (itemSchema.properties !== undefined) {
    return Object.fromEntries(
      Object.keys(itemSchema.properties).slice(0, 3).map((key) => [key, key]),
    );
  }

  return {
    id: operation.operationId ?? 'example',
  };
};

const parameterFields = (
  parameters: readonly OpenApiParameter[] | undefined,
): GeneratedInputField[] =>
  (parameters ?? [])
    .filter((parameter) => parameter.in === 'path' || parameter.in === 'query')
    .map((parameter) => {
      const schema = normalizeSchema(parameter.schema);
      const field: GeneratedInputField = {
        key: parameter.name,
        label: parameter.name
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .replace(/\b\w/g, (character) => character.toUpperCase()),
        type:
          schema.type === 'integer'
            ? 'integer'
            : schema.type === 'number'
              ? 'number'
              : schema.type === 'boolean'
                ? 'boolean'
                : 'string',
        required: parameter.in === 'path' ? true : parameter.required ?? false,
        altersDynamicFields: parameter.in === 'path',
        list: schema.type === 'array',
      };

      if (parameter.description !== undefined) {
        field.helpText = parameter.description;
      }

      if (schema.enum !== undefined) {
        field.choices = schema.enum
          .filter((choice): choice is string => typeof choice === 'string')
          .map((choice) => choice);
      }

      return field;
    });

const buildQueryParams = (
  operation: OpenApiOperation,
  inputData: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  const params = compactInputEntries(
    (operation.parameters ?? [])
      .filter((parameter) => parameter.in === 'query')
      .map((parameter) => [parameter.name, inputData[parameter.name]]),
  );

  return Object.keys(params).length > 0 ? params : undefined;
};

const pathIdFromInput = (
  operation: OpenApiOperation,
  inputData: Record<string, unknown>,
): string | undefined => {
  const idParameter = [...(operation.parameters ?? [])]
    .filter((parameter) => parameter.in === 'path')
    .reverse()
    .find((parameter) => /id$/i.test(parameter.name) && parameter.name !== 'projectId');
  const value =
    idParameter === undefined ? undefined : inputData[idParameter.name];

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
};

const idFromRecord = (record: Record<string, unknown>): string | undefined => {
  const idValue =
    record.id ??
    record.customerId ??
    record.notificationHandlerId ??
    Object.entries(record).find(([key]) => /id$/i.test(key))?.[1];

  return typeof idValue === 'string' || typeof idValue === 'number'
    ? String(idValue)
    : undefined;
};

const withZapierId = (
  value: unknown,
  fallbackId: string | undefined,
): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {
      id: fallbackId ?? JSON.stringify(value),
      value,
    };
  }

  return {
    ...value,
    id: idFromRecord(value) ?? fallbackId ?? JSON.stringify(value),
  };
};

const normalizeSearchResults = (
  raw: unknown,
  discovered: DiscoveredZapierOperation,
  inputData: Record<string, unknown>,
): Record<string, unknown>[] => {
  const data = isRecord(raw) && Object.hasOwn(raw, 'data') ? raw.data : raw;
  const fallbackId =
    (typeof readByPath(raw, discovered.idPath) === 'string' ||
    typeof readByPath(raw, discovered.idPath) === 'number'
      ? String(readByPath(raw, discovered.idPath))
      : undefined) ?? pathIdFromInput(discovered.operation, inputData);

  if (Array.isArray(data)) {
    return data.map((item, index) =>
      withZapierId(item, fallbackId === undefined ? String(index) : fallbackId),
    );
  }

  if (data === undefined || data === null) {
    return [];
  }

  return [withZapierId(data, fallbackId)];
};

const performSearch =
  (document: OpenApiDocument, discovered: DiscoveredZapierOperation) =>
  async (z: ZObject, bundle: Bundle): Promise<Record<string, unknown>[]> => {
    const inputData = bundle.inputData;
    const url = `${getOpenApiBaseUrl(document)}${pathFromTemplate(
      discovered.path,
      inputData,
    )}`;
    const params = buildQueryParams(discovered.operation, inputData);
    const response = await z.request({
      url,
      method: toZapierMethod(discovered.method),
      headers: {
        Accept: 'application/json',
        ...authHeaders(document, bundle),
      },
      ...(params === undefined ? {} : { params }),
      removeMissingValuesFrom: {
        params: true,
      },
    });

    response.throwForStatus();

    return normalizeSearchResults(
      response.json ?? response.data,
      discovered,
      inputData,
    );
  };

export const discoverZapierSearches = (
  document: OpenApiDocument,
  operationIds?: readonly string[],
): DiscoveredZapierOperation[] => {
  const discoveredOperations = Object.entries(document.paths).flatMap(
    ([path, pathItem]) =>
      HTTP_METHODS.flatMap((method) => {
        const operation = pathItem[method];
        const operationId = operation?.operationId;

        if (
          operation === undefined ||
          operationId === undefined ||
          method !== 'get'
        ) {
          return [];
        }

        const discovered: DiscoveredZapierOperation = {
          method,
          path,
          operation,
          key: toSnakeCase(operationId),
        };
        const idPath = findIdPath(successResponseSchema(operation));

        if (idPath !== undefined) {
          discovered.idPath = idPath;
        }

        return [discovered];
      }),
  );

  if (operationIds === undefined) {
    return discoveredOperations;
  }

  const operationsById = new Map(
    discoveredOperations.flatMap((discovered) => {
      const operationId = discovered.operation.operationId;

      return operationId === undefined ? [] : [[operationId, discovered]];
    }),
  );

  return operationIds.map((operationId) => {
    const discovered = operationsById.get(operationId);

    if (discovered === undefined) {
      throw new Error(
        `Selected search operationId was not found in OpenAPI GET operations: ${operationId}`,
      );
    }

    return discovered;
  });
};

export const buildZapierSearchesFromOpenApi = (
  document: OpenApiDocument,
  options: {
    operationIds?: readonly string[];
  } = {},
): Record<string, ReturnType<typeof defineSearch>> =>
  Object.fromEntries(
    discoverZapierSearches(document, options.operationIds).map((discovered) => {
      const { operation } = discovered;
      const key = discovered.key;
      const label = operation.summary ?? humanize(operation.operationId ?? key);
      const search = defineSearch({
        key,
        noun: label,
        display: {
          label,
          description: operation.description ?? operation.summary ?? label,
          hidden: false,
        },
        operation: {
          perform: performSearch(document, discovered),
          inputFields: defineInputFields(
            parameterFields(operation.parameters) as never,
          ),
          sample: sampleFromOperation(operation),
        },
      });

      return [key, search];
    }),
  );
