import type { GeneratedInputField, JsonSchema } from './types';

const firstNonNullSchema = (
  schemas: readonly JsonSchema[] | undefined,
): JsonSchema | undefined =>
  schemas?.find((schema) => {
    if (typeof schema.type === 'string') {
      return schema.type !== 'null';
    }

    if (Array.isArray(schema.type)) {
      return schema.type.some((type) => type !== 'null');
    }

    return true;
  });

export const normalizeSchema = (schema: JsonSchema | undefined): JsonSchema => {
  if (schema === undefined) {
    return {};
  }

  const unionSchema = firstNonNullSchema(schema.anyOf ?? schema.oneOf);

  if (unionSchema !== undefined) {
    return normalizeSchema(unionSchema);
  }

  if (schema.allOf === undefined) {
    return schema;
  }

  const schemaWithoutAllOf = { ...schema };
  delete schemaWithoutAllOf.allOf;
  const merged = schema.allOf.reduce<JsonSchema>(
    (current, part) => {
      const normalized = normalizeSchema(part);

      return {
        ...current,
        ...normalized,
        required: [
          ...(current.required ?? []),
          ...(normalized.required ?? []),
        ],
        properties: {
          ...(current.properties ?? {}),
          ...(normalized.properties ?? {}),
        },
      };
    },
    schemaWithoutAllOf,
  );

  return merged;
};

const readSchemaType = (schema: JsonSchema): string | undefined => {
  if (typeof schema.type === 'string') {
    return schema.type;
  }

  return schema.type?.find((type) => type !== 'null');
};

const mapFieldType = (
  schema: JsonSchema,
): NonNullable<GeneratedInputField['type']> => {
  const type = readSchemaType(schema);

  if (schema.format === 'date-time' || schema.format === 'date') {
    return 'datetime';
  }

  if (type === 'integer') {
    return 'integer';
  }

  if (type === 'number') {
    return 'number';
  }

  if (type === 'boolean') {
    return 'boolean';
  }

  if (type === 'object') {
    return 'text';
  }

  return 'string';
};

const humanize = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const buildFieldsFromObjectSchema = (
  schema: JsonSchema | undefined,
  options: {
    exclude?: readonly string[];
  } = {},
): GeneratedInputField[] => {
  const normalized = normalizeSchema(schema);
  const required = new Set(normalized.required ?? []);
  const excluded = new Set(options.exclude ?? []);

  return Object.entries(normalized.properties ?? {})
    .filter(([key]) => !excluded.has(key))
    .map(([key, propertySchema]) => {
      const property = normalizeSchema(propertySchema);
      const type = readSchemaType(property);
      const itemSchema = normalizeSchema(property.items);
      const field: GeneratedInputField = {
        key,
        label: property.title ?? humanize(key),
        required: required.has(key),
        type: mapFieldType(property),
        list: type === 'array',
      };

      if (property.description !== undefined) {
        field.helpText = property.description;
      }

      if (
        (type === 'array' &&
          (readSchemaType(itemSchema) === 'object' ||
            itemSchema.properties !== undefined)) ||
        (type === 'object' || property.properties !== undefined)
      ) {
        delete field.type;
        delete field.list;
        field.children = buildFieldsFromObjectSchema(
          type === 'array' ? itemSchema : property,
        );
      }

      if (property.enum !== undefined) {
        field.choices = property.enum
          .filter((choice): choice is string => typeof choice === 'string')
          .map((choice) => choice);
      }

      return field;
    });
};

export const getJsonRequestSchema = (
  schemaContainer:
    | {
        content?: Record<string, { schema?: JsonSchema }>;
      }
    | undefined,
): JsonSchema | undefined =>
  schemaContainer?.content?.['application/json']?.schema ??
  Object.values(schemaContainer?.content ?? {})[0]?.schema;
