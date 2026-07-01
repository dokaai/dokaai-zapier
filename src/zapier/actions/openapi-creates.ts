import { defineCreate, defineInputFields } from 'zapier-platform-core';
import type { Bundle, ZObject } from 'zapier-platform-core';

import {
  compactInputEntries,
  isRecord,
  sortPriorityFieldsFirst,
} from '../../core/zapier';
import {
  authHeaders,
  HTTP_METHODS,
  humanize,
  pathFromTemplate,
  readByPath,
  shouldIncludeValue,
  toSnakeCase,
  toZapierMethod,
  getOpenApiBaseUrl,
} from '../../openapi/runtime';
import { pluginsForOperation } from '../plugins';
import type { ZapierOperationPluginContext } from '../plugins';
import {
  buildFieldsFromObjectSchema,
  getJsonRequestSchema,
  normalizeSchema,
} from '../../openapi/schema';
import type {
  DiscoveredZapierOperation,
  GeneratedInputField,
  JsonSchema,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiParameter,
} from '../../openapi/types';

const DEFAULT_EXCLUDED_BODY_FIELDS = new Set([
  'organizationId',
  'projectId',
  'createdById',
  'createdDate',
  'modifiedById',
  'modifiedDate',
  'isActive',
  'isDeleted',
]);

const operationBodySchema = (
  operation: OpenApiOperation,
  bodyRoot: string | undefined,
): JsonSchema | undefined => {
  const requestSchema = normalizeSchema(getJsonRequestSchema(operation.requestBody));

  if (bodyRoot === undefined) {
    return requestSchema;
  }

  return normalizeSchema(requestSchema.properties?.[bodyRoot]);
};

const inferBodyRoot = (operation: OpenApiOperation): string | undefined => {
  const requestSchema = normalizeSchema(getJsonRequestSchema(operation.requestBody));

  if (requestSchema.properties === undefined) {
    return undefined;
  }

  const requiredObjectProperties = (requestSchema.required ?? []).filter(
    (propertyName) => {
      const property = normalizeSchema(requestSchema.properties?.[propertyName]);
      return property.type === 'object' || property.allOf !== undefined;
    },
  );

  return requiredObjectProperties.length === 1
    ? requiredObjectProperties[0]
    : undefined;
};

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

const exampleFromSchema = (schema: JsonSchema | undefined): unknown => {
  const normalized = normalizeSchema(schema);

  if (normalized.enum?.length) {
    return normalized.enum[0];
  }

  if (normalized.type === 'null') {
    return null;
  }

  if (normalized.type === 'boolean') {
    return true;
  }

  if (normalized.type === 'integer' || normalized.type === 'number') {
    return 1;
  }

  if (normalized.type === 'array') {
    return [exampleFromSchema(normalized.items)];
  }

  if (normalized.type === 'object' || normalized.properties !== undefined) {
    return Object.fromEntries(
      Object.entries(normalized.properties ?? {}).map(([key, property]) => [
        key,
        exampleFromSchema(property),
      ]),
    );
  }

  if (normalized.format === 'date-time') {
    return '2026-01-01T00:00:00.000Z';
  }

  return 'example';
};

const sampleFromOperation = (
  operation: OpenApiOperation,
): Record<string, unknown> => {
  const sample = exampleFromSchema(successResponseSchema(operation));

  if (isRecord(sample) && Object.keys(sample).length > 0) {
    return sample;
  }

  return {
    id: operation.operationId ?? 'example',
  };
};

const pathParameterFields = (
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

const buildInputFields = (
  document: OpenApiDocument,
  discovered: DiscoveredZapierOperation,
): Array<
  | GeneratedInputField
  | ((z: ZObject, bundle: Bundle) => Promise<GeneratedInputField[]>)
> => {
  const { operation } = discovered;
  const context: ZapierOperationPluginContext = { document, discovered };
  const plugins = pluginsForOperation(context);
  const pathParams = new Set(
    (operation.parameters ?? [])
      .filter((parameter) => parameter.in === 'path')
      .map((parameter) => parameter.name),
  );
  const excluded = [
    ...DEFAULT_EXCLUDED_BODY_FIELDS,
    ...pathParams,
    ...plugins.flatMap(
      (plugin) => plugin.excludedBodyFields?.(context) ?? [],
    ),
  ];
  const bodySchema = operationBodySchema(operation, discovered.bodyRoot);

  return sortPriorityFieldsFirst([
    ...pathParameterFields(operation.parameters),
    ...buildFieldsFromObjectSchema(bodySchema, { exclude: excluded }),
    ...plugins.flatMap((plugin) => plugin.inputFields?.(context) ?? []),
  ]);
};

const excludedBodyFields = (
  document: OpenApiDocument,
  discovered: DiscoveredZapierOperation,
): Set<string> =>
  {
    const context: ZapierOperationPluginContext = { document, discovered };

    return new Set([
      ...DEFAULT_EXCLUDED_BODY_FIELDS,
      ...pluginsForOperation(context).flatMap(
        (plugin) => plugin.excludedBodyFields?.(context) ?? [],
      ),
      ...(discovered.operation.parameters ?? [])
        .filter(
          (parameter) => parameter.in === 'path' || parameter.in === 'query',
        )
        .map((parameter) => parameter.name),
    ]);
  };

const buildValueFromSchema = (
  key: string,
  schema: JsonSchema | undefined,
  inputData: Record<string, unknown>,
  excluded: Set<string>,
): unknown => {
  const normalized = normalizeSchema(schema);

  if (Object.hasOwn(inputData, key)) {
    return inputData[key];
  }

  if (normalized.type === 'object' || normalized.properties !== undefined) {
    return buildObjectFromSchema(normalized, inputData, excluded);
  }

  return undefined;
};

const buildObjectFromSchema = (
  schema: JsonSchema | undefined,
  inputData: Record<string, unknown>,
  excluded: Set<string>,
): Record<string, unknown> | undefined => {
  const normalized = normalizeSchema(schema);
  const entries = Object.entries(normalized.properties ?? {}).flatMap(
    ([key, propertySchema]) => {
      if (excluded.has(key)) {
        return [];
      }

      const value = buildValueFromSchema(
        key,
        propertySchema,
        inputData,
        excluded,
      );

      return shouldIncludeValue(value) ? [[key, value] as const] : [];
    },
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const buildBody = (
  document: OpenApiDocument,
  discovered: DiscoveredZapierOperation,
  inputData: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  const excluded = excludedBodyFields(document, discovered);
  const body = buildObjectFromSchema(
    operationBodySchema(discovered.operation, discovered.bodyRoot),
    inputData,
    excluded,
  ) ?? {};
  const context: ZapierOperationPluginContext = { document, discovered };
  const pluginBodyFields = pluginsForOperation(context).reduce<
    Record<string, unknown>
  >(
    (fields, plugin) => ({
      ...fields,
      ...(plugin.bodyFields?.(context, inputData) ?? {}),
    }),
    {},
  );
  const bodyRoot = discovered.bodyRoot;

  Object.assign(body, pluginBodyFields);

  if (Object.keys(body).length === 0) {
    return undefined;
  }

  if (bodyRoot === undefined) {
    return body;
  }

  return { [bodyRoot]: body };
};

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

const performOperation =
  (document: OpenApiDocument, discovered: DiscoveredZapierOperation) =>
  async (z: ZObject, bundle: Bundle): Promise<Record<string, unknown>> => {
    const inputData = bundle.inputData;
    const url = `${getOpenApiBaseUrl(document)}${pathFromTemplate(
      discovered.path,
      inputData,
    )}`;
    const body = buildBody(document, discovered, inputData);
    const params = buildQueryParams(discovered.operation, inputData);
    const response = await z.request({
      url,
      method: toZapierMethod(discovered.method),
      headers: {
        Accept: 'application/json',
        ...authHeaders(document, bundle),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(params === undefined ? {} : { params }),
      ...(body === undefined ? {} : { body }),
      removeMissingValuesFrom: {
        body: true,
        params: true,
      },
    });

    response.throwForStatus();

    const raw = response.json ?? response.data;
    const id = readByPath(raw, discovered.idPath);

    return {
      ...(isRecord(raw) ? raw : { data: raw }),
      ...(typeof id === 'string' || typeof id === 'number'
        ? { id: String(id) }
        : {}),
    };
  };

export const discoverZapierCreates = (
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
        method === 'get'
      ) {
        return [];
      }

      const discovered: DiscoveredZapierOperation = {
        method,
        path,
        operation,
        key: toSnakeCase(operationId),
      };
      const bodyRoot = inferBodyRoot(operation);
      const idPath = findIdPath(successResponseSchema(operation));

      if (bodyRoot !== undefined) {
        discovered.bodyRoot = bodyRoot;
      }

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
        `Selected create operationId was not found in OpenAPI non-GET operations: ${operationId}`,
      );
    }

    return discovered;
  });
};

export const buildZapierCreatesFromOpenApi = (
  document: OpenApiDocument,
  options: {
    operationIds?: readonly string[];
  } = {},
): Record<string, ReturnType<typeof defineCreate>> =>
  Object.fromEntries(
    discoverZapierCreates(document, options.operationIds).map((discovered) => {
      const { operation } = discovered;
      const key = discovered.key;
      const label = operation.summary ?? humanize(operation.operationId ?? key);
      const create = defineCreate({
        key,
        noun: label,
        display: {
          label,
          description: operation.description ?? operation.summary ?? label,
          hidden: false,
        },
        operation: {
          perform: performOperation(document, discovered),
          inputFields: defineInputFields(
            buildInputFields(document, discovered) as never,
          ),
          sample: sampleFromOperation(operation),
        },
      });

      return [key, create];
    }),
  );
