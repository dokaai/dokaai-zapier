import type { ZapierFieldType } from '../../../core/zapier';

export const mapCustomerAttributeType = (fieldType: string): ZapierFieldType => {
  switch (fieldType.toLowerCase()) {
    case 'integer':
      return 'integer';
    case 'number':
    case 'float':
    case 'double':
    case 'decimal':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'datetime':
    case 'date_time':
      return 'datetime';
    default:
      return 'string';
  }
};
