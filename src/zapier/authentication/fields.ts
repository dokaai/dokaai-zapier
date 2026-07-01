import { usedSecuritySchemeKeys } from '../../openapi/security';
import type { OpenApiDocument } from '../../openapi/types';

type AuthenticationField = {
  key: string;
  label: string;
  helpText: string;
  type: 'string' | 'password';
  required: boolean;
  computed: false;
};

const labelFromSchemeName = (name: string): string =>
  name
    .replace(/^x-/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const buildAuthenticationFields = (
  document: OpenApiDocument,
  operationIds?: readonly string[],
) => {
  const requiredSchemes = usedSecuritySchemeKeys(document, operationIds);
  const schemes = document.components?.securitySchemes ?? {};
  const fields: AuthenticationField[] = [];

  fields.push(
    ...requiredSchemes.flatMap((schemeKey) => {
      const scheme = schemes[schemeKey];

      if (scheme?.type === 'apiKey' && scheme.in === 'header') {
        const key = scheme.name ?? schemeKey;

        return [
          {
            key,
            label: labelFromSchemeName(key),
            helpText: scheme.description ?? `Enter your Dokaai ${key}.`,
            type: 'password' as const,
            required: true,
            computed: false as const,
          },
        ];
      }

      if (scheme?.type === 'http' && scheme.scheme === 'bearer') {
        return [
          {
            key: schemeKey,
            label: labelFromSchemeName(schemeKey),
            helpText:
              scheme.description ??
              `Enter your Dokaai ${scheme.bearerFormat ?? 'bearer'} token.`,
            type: 'password' as const,
            required: true,
            computed: false as const,
          },
        ];
      }

      return [];
    }),
  );

  return fields;
};
