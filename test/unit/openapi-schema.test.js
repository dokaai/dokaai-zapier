const { buildFieldsFromObjectSchema } = require('../../src/openapi/schema');
const { discoverZapierCreates } = require('../../src/zapier/actions');
const { buildZapierCreatesFromOpenApi } = require('../../src/zapier/actions');
const { buildZapierSearchesFromOpenApi } = require('../../src/zapier/searches');
const { buildAuthentication } = require('../../src/zapier/authentication');
const spec = require('../../src/api/index.json');

describe('OpenAPI schema adapter', () => {
  it('discovers selected Zapier creates from plain OpenAPI operationIds', () => {
    const creates = discoverZapierCreates(spec, [
      'addCustomersToPool',
      'associateCustomerToTargetAudienceList',
    ]);

    expect(creates).toHaveLength(2);
    expect(creates.find((create) => create.key === 'add_customers_to_pool')).toMatchObject({
      method: 'post',
      path: '/customer/projects/{projectId}/customer-pools/{customerPoolId}/customers',
      key: 'add_customers_to_pool',
      bodyRoot: 'customerData',
      idPath: 'data.customerId',
    });
    expect(
      creates.find(
        (create) =>
          create.key === 'associate_customer_to_target_audience_list',
      ),
    ).toMatchObject({
      method: 'post',
      path: '/nudge/projects/{projectId}/target-audience-lists/{targetAudienceListId}/customers',
      key: 'associate_customer_to_target_audience_list',
      idPath: 'data.targetAudienceListId',
    });
  });

  it('builds Zapier fields from object schemas', () => {
    const fields = buildFieldsFromObjectSchema(
      {
        type: 'object',
        required: ['email', 'tags'],
        properties: {
          email: { type: 'string' },
          tags: {
            anyOf: [
              {
                type: 'array',
                items: { type: 'string' },
              },
              { type: 'null' },
            ],
          },
          score: { type: 'number' },
          ignored: { type: 'string' },
        },
      },
      { exclude: ['ignored'] },
    );

    expect(fields).toEqual([
      {
        key: 'email',
        label: 'Email',
        helpText: undefined,
        required: true,
        type: 'string',
        list: false,
      },
      {
        key: 'tags',
        label: 'Tags',
        helpText: undefined,
        required: true,
        type: 'string',
        list: true,
      },
      {
        key: 'score',
        label: 'Score',
        helpText: undefined,
        required: false,
        type: 'number',
        list: false,
      },
    ]);
  });

  it('uses OpenAPI enum values as Zapier choices for params and body fields', () => {
    const searches = buildZapierSearchesFromOpenApi(spec, {
      operationIds: ['getPoolCustomerById'],
    });
    const creates = buildZapierCreatesFromOpenApi(spec, {
      operationIds: ['triggerNotificationHandler'],
    });
    const attributeTypesField =
      searches.get_pool_customer_by_id.operation.inputFields.find(
        (field) => field.key === 'attributeTypes',
      );
    const modeField =
      creates.trigger_notification_handler.operation.inputFields.find(
        (field) => field.key === 'mode',
      );

    expect(attributeTypesField.choices).toEqual(['all', 'custom', 'app']);
    expect(modeField.choices).toEqual(['live', 'test']);
  });

  it('uses global OpenAPI auth fields for generated requests', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Example',
        version: '1.0.0',
      },
      servers: [{ url: 'https://api.example.com' }],
      components: {
        securitySchemes: {
          clientKeyHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'x-client-key',
          },
        },
      },
      security: [{ clientKeyHeader: [] }],
      paths: {
        '/secure-action': {
          post: {
            operationId: 'secureAction',
            summary: 'Secure Action',
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const authentication = buildAuthentication(document, {
      operationIds: ['secureAction'],
    });
    const creates = buildZapierCreatesFromOpenApi(document, {
      operationIds: ['secureAction'],
    });
    const requests = [];
    const z = {
      request: jest.fn(async (options) => {
        requests.push(options);
        return {
          json: { id: 'secure-action-id' },
          data: { id: 'secure-action-id' },
          throwForStatus: jest.fn(),
        };
      }),
    };

    await creates.secure_action.operation.perform(z, {
      inputData: {},
      authData: {
        'x-client-key': 'client-key',
      },
    });

    expect(authentication.fields.map((field) => field.key)).toEqual([
      'x-client-key',
    ]);
    expect(creates.secure_action.operation.inputFields).toEqual([]);
    expect(requests[0].headers).toMatchObject({
      'x-client-key': 'client-key',
    });
  });

  it('loads pool customer attributes as dynamic fields and submits them as customAttribute', async () => {
    const creates = buildZapierCreatesFromOpenApi(spec, {
      operationIds: ['addCustomersToPool', 'updateCustomerInPool'],
    });
    const addInputFields =
      creates.add_customers_to_pool.operation.inputFields;
    const updateInputFields =
      creates.update_customer_in_pool.operation.inputFields;
    const loadAddDynamicFields = addInputFields.find(
      (field) => typeof field === 'function',
    );
    const loadUpdateDynamicFields = updateInputFields.find(
      (field) => typeof field === 'function',
    );
    const authData = {
      'x-client-key': 'client-key',
      'x-client-secret': 'client-secret',
    };
    const attributeResponse = {
      status: 'success',
      data: [
        {
          fieldName: 'vipStatus',
          fieldDisplayName: 'VIP Status',
          fieldType: 'boolean',
          isMandatory: true,
          fieldDescription: 'Whether this customer is a VIP.',
        },
        {
          fieldName: 'lifetimeValue',
          fieldDisplayName: 'Lifetime Value',
          fieldType: 'number',
          isMandatory: false,
        },
      ],
    };
    const fieldRequests = [];
    const fieldZ = {
      request: jest.fn(async (options) => {
        fieldRequests.push(options);
        return {
          json: attributeResponse,
          data: attributeResponse,
          throwForStatus: jest.fn(),
        };
      }),
    };

    const dynamicFields = await loadAddDynamicFields(fieldZ, {
      inputData: {
        projectId: 'project-id',
        customerPoolId: 'pool-id',
      },
      authData,
    });

    expect(typeof loadUpdateDynamicFields).toBe('function');
    expect(fieldRequests[0]).toMatchObject({
      method: 'GET',
      params: {
        attributeTypes: 'custom',
        page: '1',
        size: '100',
      },
      headers: {
        'x-client-key': 'client-key',
        'x-client-secret': 'client-secret',
      },
    });
    expect(fieldRequests[0].url).toContain(
      '/customer/projects/project-id/customer-pools/pool-id/attributes',
    );
    expect(dynamicFields).toEqual([
      {
        key: 'customAttribute__vipStatus',
        label: 'VIP Status',
        type: 'boolean',
        required: true,
        helpText: 'Whether this customer is a VIP.',
      },
      {
        key: 'customAttribute__lifetimeValue',
        label: 'Lifetime Value',
        type: 'number',
        required: false,
      },
    ]);

    const addRequests = [];
    const addZ = {
      request: jest.fn(async (options) => {
        addRequests.push(options);
        return {
          json: { status: 'success', data: { customerId: 'customer-id' } },
          data: { status: 'success', data: { customerId: 'customer-id' } },
          throwForStatus: jest.fn(),
        };
      }),
    };

    await creates.add_customers_to_pool.operation.perform(addZ, {
      inputData: {
        projectId: 'project-id',
        customerPoolId: 'pool-id',
        uniqueCustomerId: 'customer-1',
        customAttribute__vipStatus: true,
        customAttribute__lifetimeValue: 42,
      },
      authData,
    });

    expect(addRequests[0].body).toMatchObject({
      customerData: {
        uniqueCustomerId: 'customer-1',
        customAttribute: {
          vipStatus: true,
          lifetimeValue: 42,
        },
      },
    });

    const updateRequests = [];
    const updateZ = {
      request: jest.fn(async (options) => {
        updateRequests.push(options);
        return {
          json: { status: 'success', data: { id: 'customer-id' } },
          data: { status: 'success', data: { id: 'customer-id' } },
          throwForStatus: jest.fn(),
        };
      }),
    };

    await creates.update_customer_in_pool.operation.perform(updateZ, {
      inputData: {
        projectId: 'project-id',
        customerPoolId: 'pool-id',
        customerId: 'customer-id',
        customAttribute__vipStatus: false,
      },
      authData,
    });

    expect(updateRequests[0].body).toMatchObject({
      customAttribute: {
        vipStatus: false,
      },
    });
  });
});
