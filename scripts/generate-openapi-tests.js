const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const specPath = path.join(root, 'src/api/index.json');
const selectorPath = path.join(root, 'src/zapier-operation-ids.ts');
const testPath = path.join(root, 'test/integration/openapi-generated.test.js');

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const selectorSource = fs.readFileSync(selectorPath, 'utf8');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
const EXCLUDED_BODY_FIELDS = new Set([
  'organizationId',
  'projectId',
  'customAttribute',
  'createdById',
  'createdDate',
  'modifiedById',
  'modifiedDate',
  'isActive',
  'isDeleted',
]);

const readOperationIds = (name) => {
  const match = selectorSource.match(
    new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`),
  );

  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/'([^']+)'|"([^"]+)"/g)).map(
    (entry) => entry[1] || entry[2],
  );
};

const toSnakeCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

const normalizeSchema = (schema) => {
  if (!schema) {
    return {};
  }

  const unionSchema = [...(schema.anyOf || []), ...(schema.oneOf || [])].find(
    (candidate) => candidate.type !== 'null',
  );

  if (unionSchema) {
    return normalizeSchema(unionSchema);
  }

  if (!schema.allOf) {
    return schema;
  }

  return schema.allOf.reduce(
    (current, part) => {
      const normalized = normalizeSchema(part);
      return {
        ...current,
        ...normalized,
        required: [...(current.required || []), ...(normalized.required || [])],
        properties: {
          ...(current.properties || {}),
          ...(normalized.properties || {}),
        },
      };
    },
    Object.fromEntries(
      Object.entries(schema).filter(([key]) => key !== 'allOf'),
    ),
  );
};

const jsonSchemaFromContent = (container) =>
  container?.content?.['application/json']?.schema ||
  Object.values(container?.content || {})[0]?.schema;

const authFieldKeyFromScheme = (schemeKey) => {
  const scheme = spec.components?.securitySchemes?.[schemeKey];

  if (scheme?.type === 'apiKey' && scheme.in === 'header') {
    return scheme.name || schemeKey;
  }

  if (scheme?.type === 'http' && scheme.scheme === 'bearer') {
    return schemeKey;
  }

  return undefined;
};

const authHeadersForOperation = (operation) => {
  const requirement = spec.security?.[0] || {};

  return Object.fromEntries(
    Object.keys(requirement).flatMap((schemeKey) => {
      const scheme = spec.components?.securitySchemes?.[schemeKey];

      if (scheme?.type === 'apiKey' && scheme.in === 'header') {
        const key = scheme.name || schemeKey;
        return [[key, `${key}-value`]];
      }

      if (scheme?.type === 'http' && scheme.scheme === 'bearer') {
        return [['Authorization', `Bearer ${schemeKey}-value`]];
      }

      return [];
    }),
  );
};

const findOperation = (operationId) => {
  for (const [operationPath, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];

      if (operation?.operationId === operationId) {
        return { operationPath, method, operation };
      }
    }
  }

  throw new Error(`operationId not found in OpenAPI spec: ${operationId}`);
};

const inferBodyRoot = (operation) => {
  const requestSchema = normalizeSchema(jsonSchemaFromContent(operation.requestBody));
  const properties = requestSchema.properties || {};
  const requiredObjectProperties = (requestSchema.required || []).filter(
    (propertyName) => {
      const property = normalizeSchema(properties[propertyName]);
      return property.type === 'object' || property.allOf;
    },
  );

  return requiredObjectProperties.length === 1
    ? requiredObjectProperties[0]
    : undefined;
};

const operationBodySchema = (operation, bodyRoot) => {
  const requestSchema = normalizeSchema(jsonSchemaFromContent(operation.requestBody));
  return bodyRoot
    ? normalizeSchema(requestSchema.properties?.[bodyRoot])
    : requestSchema;
};

const fieldExample = (key, schema) => {
  const normalized = normalizeSchema(schema);

  if (normalized.type === 'array') {
    const itemSchema = normalizeSchema(normalized.items);

    if (itemSchema.type === 'object' || itemSchema.properties) {
      const item = Object.fromEntries(
        Object.entries(itemSchema.properties || {}).map(([childKey, childSchema]) => [
          childKey,
          fieldExample(childKey, childSchema),
        ]),
      );

      return [item];
    }

    return [`${key}-1`, `${key}-2`];
  }

  if (normalized.type === 'boolean') {
    return true;
  }

  if (normalized.type === 'integer' || normalized.type === 'number') {
    return 1;
  }

  if (normalized.type === 'object' || normalized.properties) {
    return {};
  }

  return `${key}-value`;
};

const shouldIncludeValue = (value) =>
  value !== undefined && value !== null && value !== '';

const buildValueFromSchema = (key, schema, inputData, excluded) => {
  const normalized = normalizeSchema(schema);

  if (Object.hasOwn(inputData, key)) {
    return inputData[key];
  }

  if (normalized.type === 'object' || normalized.properties) {
    return buildObjectFromSchema(normalized, inputData, excluded);
  }

  return undefined;
};

const buildObjectFromSchema = (schema, inputData, excluded) => {
  const normalized = normalizeSchema(schema);
  const entries = Object.entries(normalized.properties || {}).flatMap(
    ([key, propertySchema]) => {
      if (excluded.has(key)) {
        return [];
      }

      const value = buildValueFromSchema(key, propertySchema, inputData, excluded);

      return shouldIncludeValue(value) ? [[key, value]] : [];
    },
  );

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const successResponseSchema = (operation) => {
  const response =
    operation.responses?.['200'] ||
    operation.responses?.['201'] ||
    Object.entries(operation.responses || {}).find(([status]) =>
      status.startsWith('2'),
    )?.[1];

  return normalizeSchema(jsonSchemaFromContent(response));
};

const findIdPath = (schema, prefix = '') => {
  const normalized = normalizeSchema(schema);
  const properties = normalized.properties || {};

  if (properties.id) {
    return `${prefix}id`;
  }

  if (properties.customerId) {
    return `${prefix}customerId`;
  }

  const idProperty = Object.keys(properties).find((key) => /id$/i.test(key));

  if (idProperty) {
    return `${prefix}${idProperty}`;
  }

  for (const [key, property] of Object.entries(properties)) {
    const nested = normalizeSchema(property);

    if (nested.type !== 'object' && !nested.properties) {
      continue;
    }

    const nestedPath = findIdPath(nested, `${prefix}${key}.`);

    if (nestedPath) {
      return nestedPath;
    }
  }

  return undefined;
};

const setPathValue = (target, valuePath, value) => {
  const segments = valuePath.split('.');
  let current = target;

  for (const segment of segments.slice(0, -1)) {
    current[segment] = current[segment] || {};
    current = current[segment];
  }

  current[segments.at(-1)] = value;
};

const buildOperationFixture = (operationId) => {
  const { operationPath, method, operation } = findOperation(operationId);
  const key = toSnakeCase(operationId);
  const bodyRoot = inferBodyRoot(operation);
  const bodySchema = operationBodySchema(operation, bodyRoot);
  const pathParams = (operation.parameters || []).filter(
    (parameter) => parameter.in === 'path',
  );
  const queryParams = (operation.parameters || []).filter(
    (parameter) => parameter.in === 'query',
  );
  const pathParamNames = new Set(pathParams.map((parameter) => parameter.name));
  const queryParamNames = new Set(queryParams.map((parameter) => parameter.name));
  const bodyProperties = bodySchema.properties || {};
  const bodyFieldNames = Object.keys(bodyProperties).filter(
    (fieldName) =>
      !EXCLUDED_BODY_FIELDS.has(fieldName) &&
      !pathParamNames.has(fieldName) &&
      !queryParamNames.has(fieldName),
  );
  const inputData = {};

  for (const parameter of pathParams) {
    inputData[parameter.name] = `${parameter.name} value`;
  }

  for (const parameter of queryParams) {
    inputData[parameter.name] = fieldExample(parameter.name, parameter.schema);
  }

  for (const fieldName of bodyFieldNames) {
    inputData[fieldName] = fieldExample(fieldName, bodyProperties[fieldName]);
  }

  const body = buildObjectFromSchema(
    bodySchema,
    inputData,
    new Set([
      ...EXCLUDED_BODY_FIELDS,
      ...pathParamNames,
      ...queryParamNames,
    ]),
  );
  const expectedBody =
    body === undefined
      ? undefined
      : bodyRoot
        ? { [bodyRoot]: body }
        : body;
  const expectedParams = Object.fromEntries(
    queryParams
      .map((parameter) => [parameter.name, inputData[parameter.name]])
      .filter(([, value]) => shouldIncludeValue(value)),
  );
  const expectedUrl = `${spec.servers[0].url.replace(/\/+$/, '')}${operationPath.replace(
    /\{([^}]+)\}/g,
    (_match, paramName) => encodeURIComponent(String(inputData[paramName])),
  )}`;
  const idPath = findIdPath(successResponseSchema(operation));
  const responseJson = { status: 'success', data: {} };
  const responseId = `${key}-id`;

  if (idPath) {
    setPathValue(responseJson, idPath, responseId);
  }

  return {
    operationId,
    key,
    label: operation.summary || operationId,
    method: method.toUpperCase(),
    inputFields: [
      ...pathParams.map((parameter) => parameter.name),
      ...queryParams.map((parameter) => parameter.name),
      ...bodyFieldNames,
    ],
    inputData,
    expectedUrl,
    expectedParams: Object.keys(expectedParams).length ? expectedParams : undefined,
    expectedAuthHeaders: authHeadersForOperation(operation),
    expectedBody,
    responseJson,
    expectedId: idPath ? responseId : undefined,
  };
};

const responseDataSchema = (operation) =>
  normalizeSchema(successResponseSchema(operation)?.properties?.data);

const buildSearchFixture = (operationId) => {
  const { operationPath, method, operation } = findOperation(operationId);
  const key = toSnakeCase(operationId);
  const pathParams = (operation.parameters || []).filter(
    (parameter) => parameter.in === 'path',
  );
  const queryParams = (operation.parameters || []).filter(
    (parameter) => parameter.in === 'query',
  );
  const inputData = {};

  for (const parameter of pathParams) {
    inputData[parameter.name] = `${parameter.name} value`;
  }

  for (const parameter of queryParams) {
    inputData[parameter.name] = fieldExample(parameter.name, parameter.schema);
  }

  const expectedParams = Object.fromEntries(
    queryParams
      .map((parameter) => [parameter.name, inputData[parameter.name]])
      .filter(([, value]) => shouldIncludeValue(value)),
  );
  const expectedUrl = `${spec.servers[0].url.replace(/\/+$/, '')}${operationPath.replace(
    /\{([^}]+)\}/g,
    (_match, paramName) => encodeURIComponent(String(inputData[paramName])),
  )}`;
  const dataSchema = responseDataSchema(operation);
  const responseId = `${key}-id`;
  const responseItem = { id: responseId, name: `${key} name` };
  const isListResponse = dataSchema.type === 'array';
  const responseJson = {
    status: 'success',
    data: isListResponse ? [responseItem] : responseItem,
  };

  return {
    operationId,
    key,
    label: operation.summary || operationId,
    method: method.toUpperCase(),
    inputFields: [
      ...pathParams.map((parameter) => parameter.name),
      ...queryParams.map((parameter) => parameter.name),
    ],
    inputData,
    expectedUrl,
    expectedParams: Object.keys(expectedParams).length ? expectedParams : undefined,
    expectedAuthHeaders: authHeadersForOperation(operation),
    responseJson,
    expectedResult: [responseItem],
  };
};

const createOperationIds = readOperationIds('zapierActionOperationIds');
const searchOperationIds = readOperationIds('zapierSearchOperationIds');
const fixtures = createOperationIds.map(buildOperationFixture);
const searchFixtures = searchOperationIds.map(buildSearchFixture);
const authFieldKeys = [
  ...new Set(
    Object.keys(spec.security?.[0] || {}).flatMap((schemeKey) => {
      const key = authFieldKeyFromScheme(schemeKey);

      return key === undefined ? [] : [key];
    }),
  ),
];
const authData = Object.fromEntries(
  authFieldKeys.map((key) => [key, `${key}-value`]),
);

const generated = `// Auto-generated by npm run generate:tests.
// Do not edit directly; update src/zapier-operation-ids.ts or src/api/index.json.

const App = require('../../src');

const operationFixtures = ${JSON.stringify(fixtures, null, 2)};
const searchFixtures = ${JSON.stringify(searchFixtures, null, 2)};

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
  };

  return { z, requests };
};

const bundle = (inputData) => ({
  inputData,
  authData: ${JSON.stringify(authData, null, 4)},
});

describe('OpenAPI generated Zapier app', () => {
  it('builds selected creates from plain OpenAPI operationIds', () => {
    expect(Object.keys(App.creates)).toEqual(
      operationFixtures.map((fixture) => fixture.key),
    );

    for (const fixture of operationFixtures) {
      expect(App.creates[fixture.key].display.label).toBe(fixture.label);
      expect(App.creates[fixture.key].noun).toBe(fixture.label);
    }
  });

  it('builds selected searches from plain OpenAPI operationIds', () => {
    expect(Object.keys(App.searches)).toEqual(
      searchFixtures.map((fixture) => fixture.key),
    );

    for (const fixture of searchFixtures) {
      expect(App.searches[fixture.key].display.label).toBe(fixture.label);
      expect(App.searches[fixture.key].noun).toBe(fixture.label);
    }
  });

  it('derives auth fields from OpenAPI security schemes', () => {
    expect(App.authentication.fields.map((field) => field.key)).toEqual(
      ${JSON.stringify(authFieldKeys, null, 6)},
    );
  });

  it('runs a generic auth test without requiring Zapier metadata in OpenAPI', async () => {
    const { z, requests } = makeZ({ status: 'success', data: [] });

    const result = await App.authentication.test(z, bundle({}));

    expect(requests).toEqual([]);
    expect(result).toEqual({ status: 'success' });
  });

  it('generates input fields from path params and request body schema', () => {
    for (const fixture of operationFixtures) {
      const fields = App.creates[fixture.key].operation.inputFields;

      expect(
        fields
          .filter((field) => typeof field === 'object')
          .map((field) => field.key),
      ).toEqual(fixture.inputFields);
    }
  });

  it('generates search input fields from path and query params', () => {
    for (const fixture of searchFixtures) {
      const fields = App.searches[fixture.key].operation.inputFields;

      expect(fields.map((field) => field.key)).toEqual(fixture.inputFields);
    }
  });

  it('performs each generated create using inferred OpenAPI request shape', async () => {
    for (const fixture of operationFixtures) {
      const { z, requests } = makeZ(fixture.responseJson);

      const result = await App.creates[fixture.key].operation.perform(
        z,
        bundle(fixture.inputData),
      );

      expect(requests[0].method).toBe(fixture.method);
      expect(requests[0].url).toBe(fixture.expectedUrl);
      expect(requests[0].params).toEqual(fixture.expectedParams);
      expect(requests[0].headers).toMatchObject({
        ...fixture.expectedAuthHeaders,
        ...(fixture.expectedBody === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
      });
      expect(requests[0].body).toEqual(fixture.expectedBody);

      if (fixture.expectedId !== undefined) {
        expect(result.id).toBe(fixture.expectedId);
      }
    }
  });

  it('performs each generated search using inferred OpenAPI request shape', async () => {
    for (const fixture of searchFixtures) {
      const { z, requests } = makeZ(fixture.responseJson);

      const result = await App.searches[fixture.key].operation.perform(
        z,
        bundle(fixture.inputData),
      );

      expect(requests[0].method).toBe(fixture.method);
      expect(requests[0].url).toBe(fixture.expectedUrl);
      expect(requests[0].params).toEqual(fixture.expectedParams);
      expect(requests[0].headers).toMatchObject(fixture.expectedAuthHeaders);
      expect(requests[0].body).toBeUndefined();
      expect(result).toEqual(fixture.expectedResult);
    }
  });
});
`;

fs.writeFileSync(testPath, generated);
console.log(`Generated ${path.relative(root, testPath)} for ${fixtures.length} create operation(s) and ${searchFixtures.length} search operation(s).`);
