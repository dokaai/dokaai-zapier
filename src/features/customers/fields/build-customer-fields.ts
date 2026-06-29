import { NON_EDITABLE_CUSTOMER_FIELDS } from '../../../config';
import type { ZapierInputField } from '../../../core/zapier';
import type { CustomerAttribute, CustomerFieldMode } from '../types';
import { mapCustomerAttributeType } from './field-type-mapper';

interface BuildCustomerFieldsOptions {
  mode: CustomerFieldMode;
  exclude?: readonly string[];
  forceOptional?: boolean;
}

const normalizeAttribute = (
  attribute: unknown,
): CustomerAttribute | undefined => {
  if (typeof attribute !== 'object' || attribute === null) {
    return undefined;
  }

  const candidate = attribute as Record<string, unknown>;
  const fieldName =
    typeof candidate.fieldName === 'string' ? candidate.fieldName.trim() : '';

  if (!fieldName || candidate.isActive === false) {
    return undefined;
  }

  return {
    fieldName,
    fieldDisplayName:
      typeof candidate.fieldDisplayName === 'string'
        ? candidate.fieldDisplayName
        : undefined,
    fieldDescription:
      typeof candidate.fieldDescription === 'string'
        ? candidate.fieldDescription
        : undefined,
    fieldType:
      typeof candidate.fieldType === 'string' ? candidate.fieldType : 'string',
    isMandatory: candidate.isMandatory === true,
    isActive: candidate.isActive === false ? false : true,
    attributeType:
      typeof candidate.attributeType === 'string'
        ? candidate.attributeType
        : undefined,
  };
};

export const buildCustomerFields = (
  attributes: readonly unknown[],
  options: BuildCustomerFieldsOptions,
): ZapierInputField[] => {
  const excluded = new Set([
    ...(options.exclude ?? []),
    ...(options.mode === 'update' ? NON_EDITABLE_CUSTOMER_FIELDS : []),
  ]);

  return attributes.flatMap((attribute) => {
    const normalized = normalizeAttribute(attribute);

    if (normalized === undefined || excluded.has(normalized.fieldName)) {
      return [];
    }

    const fieldType = normalized.fieldType ?? 'string';
    const label = normalized.fieldDisplayName || normalized.fieldName;
    const isArrayField = fieldType.toLowerCase() === 'array';

    return [
      {
        key: normalized.fieldName,
        label,
        helpText:
          normalized.fieldDescription ||
          (options.mode === 'update'
            ? `Enter the new value for ${label}.`
            : `Enter a value for ${label}.`),
        required:
          options.forceOptional === true || options.mode === 'update'
            ? false
            : normalized.isMandatory === true,
        type: mapCustomerAttributeType(fieldType),
        list: isArrayField,
      },
    ];
  });
};
