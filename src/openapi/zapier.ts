import { defineCreate, defineInputFields } from 'zapier-platform-core';
import type { Bundle, HttpRequestOptions, ZObject } from 'zapier-platform-core';

import { compactInputEntries, isRecord } from '../core/zapier';
import {
  buildFieldsFromObjectSchema,
  getJsonRequestSchema,
  normalizeSchema,
} from './schema';
import type {
  DiscoveredZapierOperation,
  GeneratedInputField,
  HttpMethod,
  JsonSchema,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiParameter,
} from './types';

const HTTP_METHODS: readonly HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
];

type ZapierHttpMethod = NonNullable<HttpRequestOptions['method']>;

const toZapierMethod = (method: HttpMethod): ZapierHttpMethod =>
  method.toUpperCase() as ZapierHttpMethod;

const DEFAULT_EXCLUDED_BODY_FIELDS = new Set([
  'organizationId',
  'projectId',
  'customAttribute',
  'createdById',
  'createdDate',
  'modifiedById',
  'modifiedDate',
  'isActive',
  'isDeleted',
]);

const CUSTOMER_ATTRIBUTE_FIELD_PREFIX = 'customAttribute__';
const CUSTOMER_ATTRIBUTE_OPERATION_IDS = new Set([
  'addCustomersToPool',
  'updateCustomerInPool',
]);

const toSnakeCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

const humanize = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const getOpenApiBaseUrl = (document: OpenApiDocument): string => {
  const serverUrl = document.servers?.[0]?.url;

  if (serverUrl === undefined || serverUrl.trim().length === 0) {
    throw new Error('OpenAPI spec must define at least one server URL.');
  }

  return serverUrl.replace(/\/+$/, '');
};

const pathFromTemplate = (
  template: string,
  inputData: Record<string, unknown>,
): string =>
  template.replace(/\{([^}]+)\}/g, (_match, rawName: string) => {
    const value = inputData[rawName];

    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(`${rawName} is required.`);
    }

    return encodeURIComponent(String(value));
  });

const readByPath = (value: unknown, path: string | undefined): unknown => {
  if (path === undefined) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, value);
};

const findOperationById = (
  document: OpenApiDocument,
  operationId: string,
):
  | {
      method: HttpMethod;
      path: string;
      operation: OpenApiOperation;
    }
  | undefined => {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];

      if (operation?.operationId === operationId) {
        return { method, path, operation };
      }
    }
  }

  return undefined;
};

const authHeaders = (
  document: OpenApiDocument,
  bundle: Bundle,
): Record<string, string> => {
  const securityRequirement = document.security?.[0];
  const requiredSchemes = Object.keys(securityRequirement ?? {});
  const schemes = document.components?.securitySchemes ?? {};

  return Object.fromEntries(
    requiredSchemes.flatMap((schemeKey) => {
      const scheme = schemes[schemeKey];

      if (scheme?.type === 'apiKey' && scheme.in === 'header') {
        const key = scheme.name ?? schemeKey;
        const value = bundle.authData[key];

        if (typeof value !== 'string' || value.length === 0) {
          throw new Error(`${key} is required.`);
        }

        return [[key, value]];
      }

      if (scheme?.type === 'http' && scheme.scheme === 'bearer') {
        const token = bundle.authData[schemeKey];

        if (typeof token !== 'string' || token.length === 0) {
          throw new Error(`${schemeKey} is required.`);
        }

        return [['Authorization', `Bearer ${token}`]];
      }

      if (scheme === undefined) {
        return [];
      }

      return [];
    }),
  );
};

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

const customerAttributeInputFields =
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
        attributeTypes: 'all',
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
        key: `${CUSTOMER_ATTRIBUTE_FIELD_PREFIX}${attribute.fieldName}`,
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
  const pathParams = new Set(
    (operation.parameters ?? [])
      .filter((parameter) => parameter.in === 'path')
      .map((parameter) => parameter.name),
  );
  const excluded = [
    ...DEFAULT_EXCLUDED_BODY_FIELDS,
    ...pathParams,
  ];
  const bodySchema = operationBodySchema(operation, discovered.bodyRoot);

  return [
    ...pathParameterFields(operation.parameters),
    ...buildFieldsFromObjectSchema(bodySchema, { exclude: excluded }),
    ...(operation.operationId !== undefined &&
    CUSTOMER_ATTRIBUTE_OPERATION_IDS.has(operation.operationId)
      ? [customerAttributeInputFields(document)]
      : []),
  ];
};

const shouldIncludeValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== '';

const excludedBodyFields = (
  discovered: DiscoveredZapierOperation,
): Set<string> =>
  new Set([
    ...DEFAULT_EXCLUDED_BODY_FIELDS,
    ...(discovered.operation.parameters ?? [])
      .filter((parameter) => parameter.in === 'path' || parameter.in === 'query')
      .map((parameter) => parameter.name),
  ]);

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
  discovered: DiscoveredZapierOperation,
  inputData: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  const excluded = excludedBodyFields(discovered);
  const body = buildObjectFromSchema(
    operationBodySchema(discovered.operation, discovered.bodyRoot),
    inputData,
    excluded,
  ) ?? {};
  const customAttribute = Object.fromEntries(
    Object.entries(inputData).flatMap(([key, value]) =>
      key.startsWith(CUSTOMER_ATTRIBUTE_FIELD_PREFIX) &&
      shouldIncludeValue(value)
        ? [[key.slice(CUSTOMER_ATTRIBUTE_FIELD_PREFIX.length), value]]
        : [],
    ),
  );
  const bodyRoot = discovered.bodyRoot;

  if (Object.keys(customAttribute).length > 0) {
    body.customAttribute = customAttribute;
  }

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
    const body = buildBody(discovered, inputData);
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
