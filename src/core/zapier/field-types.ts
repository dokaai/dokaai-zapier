export type ZapierFieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'datetime';

export interface ZapierInputField {
  key: string;
  label?: string;
  helpText?: string;
  type?: ZapierFieldType;
  required?: boolean;
  list?: boolean;
  altersDynamicFields?: boolean;
}
