export interface CustomerAttribute {
  fieldName: string;
  fieldDisplayName?: string | undefined;
  fieldDescription?: string | undefined;
  fieldType?: string | undefined;
  isMandatory?: boolean | undefined;
  isActive?: boolean | undefined;
  attributeType?: string | undefined;
}

export type CustomerFieldMode = 'create' | 'update';

export interface CustomerOperationInput extends Record<string, unknown> {
  projectId?: unknown;
  customerPoolId?: unknown;
  customerId?: unknown;
  attributeTypes?: unknown;
}
