import type { OpenApiDocument } from './types';

export const usedSecuritySchemeKeys = (
  document: OpenApiDocument,
  _operationIds?: readonly string[],
): string[] => {
  const requirement = document.security?.[0] ?? {};
  return Object.keys(requirement);
};
