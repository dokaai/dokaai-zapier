import type {
  Bundle,
  HttpRequestOptions,
  HttpResponse,
  ZObject,
} from 'zapier-platform-core';

export type DokaaiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface DokaaiRequestOptions {
  method: DokaaiHttpMethod;
  path: string;
  headers?: Record<string, string>;
  params?: HttpRequestOptions['params'];
  body?: HttpRequestOptions['body'];
  removeMissingValuesFrom?: HttpRequestOptions['removeMissingValuesFrom'];
}

export type ZapierBundle<T extends Record<string, unknown>> = Bundle<T>;
export type ZapierZObject = ZObject;
export type ZapierHttpResponse<T = unknown> = HttpResponse<T>;
