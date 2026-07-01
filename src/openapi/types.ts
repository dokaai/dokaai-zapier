import type { ZapierFieldType } from '../core/zapier';

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head';

export interface JsonSchema {
  type?: string | readonly string[];
  format?: string;
  description?: string;
  title?: string;
  enum?: readonly unknown[];
  required?: readonly string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  allOf?: readonly JsonSchema[];
  anyOf?: readonly JsonSchema[];
  oneOf?: readonly JsonSchema[];
}

export type OpenApiSecurityRequirement = Record<string, readonly string[]>;

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
}

export interface OpenApiMediaType {
  schema?: JsonSchema;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: readonly OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
  security?: readonly OpenApiSecurityRequirement[];
}

export type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>>;

export interface OpenApiDocument {
  components?: {
    securitySchemes?: Record<
      string,
      {
        type?: string;
        in?: string;
        name?: string;
        scheme?: string;
        bearerFormat?: string;
        description?: string;
      }
    >;
  };
  security?: readonly OpenApiSecurityRequirement[];
  servers?: readonly {
    url: string;
  }[];
  paths: Record<string, OpenApiPathItem>;
}

export interface DiscoveredZapierOperation {
  method: HttpMethod;
  path: string;
  operation: OpenApiOperation;
  key: string;
  bodyRoot?: string;
  idPath?: string;
}

export interface GeneratedInputField {
  key: string;
  label?: string;
  helpText?: string;
  type?: ZapierFieldType;
  required?: boolean;
  list?: boolean;
  altersDynamicFields?: boolean;
  choices?: unknown;
  dependsOn?: string[];
  children?: GeneratedInputField[];
}
