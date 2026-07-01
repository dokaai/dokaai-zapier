import type { Bundle, HttpRequestOptions } from 'zapier-platform-core';

import { isRecord } from '../core/zapier';
import type {
  HttpMethod,
  OpenApiDocument,
  OpenApiOperation,
} from './types';

export const HTTP_METHODS: readonly HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
];

type ZapierHttpMethod = NonNullable<HttpRequestOptions['method']>;

export const toZapierMethod = (method: HttpMethod): ZapierHttpMethod =>
  method.toUpperCase() as ZapierHttpMethod;

export const toSnakeCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

export const humanize = (value: string): string =>
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

export const pathFromTemplate = (
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

export const readByPath = (
  value: unknown,
  path: string | undefined,
): unknown => {
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

export const findOperationById = (
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

export const authHeaders = (
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

      return [];
    }),
  );
};

export const shouldIncludeValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== '';
