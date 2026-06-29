const {
  buildCreateCustomerPayload,
} = require('../../dist/features/customers/transforms/create-payload');
const {
  buildUpdateCustomerPayload,
} = require('../../dist/features/customers/transforms/update-payload');
const {
  transformGetCustomerResponse,
  transformCustomerMutationResponse,
} = require('../../dist/features/customers/transforms/customer-response');

describe('customer payloads and responses', () => {
  it('wraps create customer data and preserves false and zero values', () => {
    expect(
      buildCreateCustomerPayload({
        projectId: 'project',
        customerPoolId: 'pool',
        name: 'Ada',
        optedIn: false,
        count: 0,
        empty: '',
        missing: null,
      }),
    ).toEqual({
      customerData: {
        name: 'Ada',
        optedIn: false,
        count: 0,
      },
    });
  });

  it('builds update payloads at the body root and strips routing plus uniqueCustomerId', () => {
    expect(
      buildUpdateCustomerPayload({
        projectId: 'project',
        customerPoolId: 'pool',
        customerId: 'customer',
        uniqueCustomerId: 'external',
        name: 'Grace',
        active: false,
        score: 0,
        empty: '',
      }),
    ).toEqual({ name: 'Grace', active: false, score: 0 });
  });

  it('returns a stable ID from create responses', () => {
    expect(
      transformCustomerMutationResponse(
        {
          status: 'success',
          message: 'ok',
          data: { customerId: 'customer-1' },
        },
        undefined,
        'external-1',
      ),
    ).toMatchObject({
      id: 'customer-1',
      customerId: 'customer-1',
      uniqueCustomerId: 'external-1',
    });
  });

  it('flattens nested customer attributes without allowing reserved key overwrite', () => {
    const result = transformGetCustomerResponse(
      {
        status: 'success',
        message: 'ok',
        data: {
          id: { value: 'evil' },
          enabled: { value: false },
          count: { value: 0 },
          tags: { value: ['a', 'b'] },
          nullable: { value: null },
        },
      },
      'customer-1',
    );

    expect(result).toEqual({
      id: 'customer-1',
      customerId: 'customer-1',
      status: 'success',
      message: 'ok',
      enabled: false,
      count: 0,
      tags: ['a', 'b'],
      nullable: '',
    });
  });
});
