export type ZapierFieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'password';

export interface ZapierInputField {
  key: string;
  label?: string;
  helpText?: string;
  type?: ZapierFieldType;
  required?: boolean;
  list?: boolean;
  altersDynamicFields?: boolean;
  dynamic?: string;
  resource?: string;
  choices?: unknown;
  dependsOn?: string[];
  children?: ZapierInputField[];
}
