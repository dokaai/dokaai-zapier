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

const docsLink = '[Dokaai docs](https://docs.dokaai.com)';

const helpTextForApiKey = (key: string, description: string | undefined): string =>
  `${description ?? `Enter your Dokaai ${key}.`} See ${docsLink} for credential setup.`;

const helpTextForBearerToken = (
  bearerFormat: string | undefined,
  description: string | undefined,
): string =>
  `${description ?? `Enter your Dokaai ${bearerFormat ?? 'bearer'} token.`} See ${docsLink} for credential setup.`;

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
            helpText: helpTextForApiKey(key, scheme.description),
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
            helpText: helpTextForBearerToken(
              scheme.bearerFormat,
              scheme.description,
            ),
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
