const {
  buildCustomerFields,
} = require('../../dist/features/customers/fields/build-customer-fields');
const {
  mapCustomerAttributeType,
} = require('../../dist/features/customers/fields/field-type-mapper');
const {
  fetchCustomerAttributes,
} = require('../../dist/features/customers/api/fetch-attributes');

describe('customer dynamic fields', () => {
  const attributes = [
    {
      fieldName: 'uniqueCustomerId',
      fieldDisplayName: 'Unique ID',
      fieldType: 'string',
      isMandatory: true,
      isActive: true,
    },
    {
      fieldName: 'age',
      fieldType: 'integer',
      isMandatory: true,
      isActive: true,
    },
    {
      fieldName: 'iosDeviceTokens',
      fieldType: 'array',
      isActive: true,
    },
    {
      fieldName: 'inactive',
      fieldType: 'string',
      isActive: false,
    },
    { fieldType: 'string', isActive: true },
    null,
  ];

  it('maps supported API field types to Zapier field types', () => {
    expect(mapCustomerAttributeType('integer')).toBe('integer');
    expect(mapCustomerAttributeType('float')).toBe('number');
    expect(mapCustomerAttributeType('double')).toBe('number');
    expect(mapCustomerAttributeType('decimal')).toBe('number');
    expect(mapCustomerAttributeType('boolean')).toBe('boolean');
    expect(mapCustomerAttributeType('dateTime')).toBe('datetime');
    expect(mapCustomerAttributeType('array')).toBe('string');
    expect(mapCustomerAttributeType('unknown')).toBe('string');
  });

  it('omits inactive and malformed attributes while preserving create mandatory fields', () => {
    const fields = buildCustomerFields(attributes, { mode: 'create' });

    expect(fields.map((field) => field.key)).toEqual([
      'uniqueCustomerId',
      'age',
      'iosDeviceTokens',
    ]);
    expect(fields.find((field) => field.key === 'age').required).toBe(true);
    expect(fields.find((field) => field.key === 'iosDeviceTokens').list).toBe(
      true,
    );
  });

  it('makes update fields optional and excludes uniqueCustomerId', () => {
    const fields = buildCustomerFields(attributes, {
      mode: 'update',
      forceOptional: true,
    });

    expect(fields.map((field) => field.key)).toEqual([
      'age',
      'iosDeviceTokens',
    ]);
    expect(fields.every((field) => field.required === false)).toBe(true);
  });

  it('does not request attributes when project or pool IDs are missing', async () => {
    const z = { request: jest.fn() };
    const result = await fetchCustomerAttributes(z, {
      inputData: { projectId: 'project', customerPoolId: '' },
      authData: {},
    });

    expect(result).toEqual([]);
    expect(z.request).not.toHaveBeenCalled();
  });
});
