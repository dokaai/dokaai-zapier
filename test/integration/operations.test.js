const App = require('../../index');

const makeZ = (responseJson = { status: 'success', data: {} }) => {
  const requests = [];
  const z = {
    request: jest.fn(async (options) => {
      requests.push(options);
      return {
        json: responseJson,
        data: responseJson,
        throwForStatus: jest.fn(),
      };
    }),
    errors: {
      Error: class AppError extends Error {
        constructor(message, code, status) {
          super(message);
          this.code = code;
          this.status = status;
        }
      },
    },
  };

  return { z, requests };
};

const bundle = (inputData) => ({
  inputData,
  authData: {
    'x-client-key': 'client-key',
    'x-client-secret': 'client-secret',
  },
});

describe('Zapier operations', () => {
  it('sends auth credentials as headers and does not return them', async () => {
    const { z, requests } = makeZ({ status: 'success', data: [] });

    const result = await App.authentication.test(z, bundle({}));

    expect(requests[0].headers).toMatchObject({
      'x-client-key': 'client-key',
      'x-client-secret': 'client-secret',
      Accept: 'application/json',
    });
    expect(JSON.stringify(result)).not.toContain('client-secret');
  });

  it('surfaces authentication request failures', async () => {
    const failure = new Error('Unauthorized');
    const z = {
      request: jest.fn(async () => ({
        json: { status: 'error', message: 'Unauthorized' },
        data: { status: 'error', message: 'Unauthorized' },
        throwForStatus: () => {
          throw failure;
        },
      })),
    };

    await expect(App.authentication.test(z, bundle({}))).rejects.toBe(failure);
  });

  it('creates a customer with wrapped customerData and encoded URL segments', async () => {
    const { z, requests } = makeZ({
      status: 'success',
      message: 'created',
      data: { customerId: 'customer-id' },
    });

    const result = await App.creates.create_customer.operation.perform(
      z,
      bundle({
        projectId: 'project/a',
        customerPoolId: 'pool b',
        uniqueCustomerId: 'external-id',
        active: false,
        score: 0,
      }),
    );

    expect(requests[0].method).toBe('POST');
    expect(requests[0].url).toContain('/projects/project%2Fa/');
    expect(requests[0].url).toContain('/customer-pools/pool%20b/customers');
    expect(requests[0].body).toEqual({
      customerData: {
        uniqueCustomerId: 'external-id',
        active: false,
        score: 0,
      },
    });
    expect(result.id).toBe('customer-id');
  });

  it('updates a customer with root body values and no customerData wrapper', async () => {
    const { z, requests } = makeZ({
      status: 'success',
      data: { id: 'customer-id' },
    });

    await App.creates.update_customer.operation.perform(
      z,
      bundle({
        projectId: 'project',
        customerPoolId: 'pool',
        customerId: 'customer/id',
        uniqueCustomerId: 'stale',
        active: false,
        score: 0,
      }),
    );

    expect(requests[0].method).toBe('PUT');
    expect(requests[0].url).toContain('/customers/customer%2Fid');
    expect(requests[0].body).toEqual({ active: false, score: 0 });
    expect(requests[0].body.customerData).toBeUndefined();
  });

  it('fails empty update requests with MissingUpdateData', async () => {
    const { z } = makeZ();

    await expect(
      App.creates.update_customer.operation.perform(
        z,
        bundle({
          projectId: 'project',
          customerPoolId: 'pool',
          customerId: 'customer',
          uniqueCustomerId: 'stale',
        }),
      ),
    ).rejects.toMatchObject({ code: 'MissingUpdateData', status: 400 });
  });

  it('removes a customer using the singular status endpoint', async () => {
    const { z, requests } = makeZ({ status: 'success', data: {} });

    const result = await App.creates.delete_customer.operation.perform(
      z,
      bundle({
        projectId: 'project',
        customerPoolId: 'pool',
        customerId: 'customer',
      }),
    );

    expect(requests[0].method).toBe('PATCH');
    expect(requests[0].url).toContain(
      '/customer/projects/project/customer-pools/pool/customer/customer/status',
    );
    expect(result.id).toBe('customer');
  });

  it('adds target audience customers with normalized IDs', async () => {
    const { z, requests } = makeZ({ status: 'success', data: {} });

    await App.creates.add_customer_to_target_audience.operation.perform(
      z,
      bundle({
        projectId: 'project',
        targetAudienceListId: 'tal',
        customerIds: ['a,b', 'a', 'c'],
      }),
    );

    expect(requests[0].method).toBe('POST');
    expect(requests[0].body).toEqual({ customerIds: ['a', 'b', 'c'] });
  });

  it('removes target audience customers using the customer ID path', async () => {
    const { z, requests } = makeZ({ status: 'success', data: {} });

    await App.creates.remove_customer_from_target_audience.operation.perform(
      z,
      bundle({
        projectId: 'project',
        targetAudienceListId: 'tal/id',
        customerId: 'customer/id',
      }),
    );

    expect(requests[0].method).toBe('PATCH');
    expect(requests[0].url).toContain(
      '/target-audience-lists/tal%2Fid/customer/customer%2Fid',
    );
  });
});
