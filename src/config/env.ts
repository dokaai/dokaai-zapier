const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`${key} environment variable is required.`);
  }

  return value.replace(/\/+$/, '');
};

export const DOKAAI_API_BASE_URL = requireEnv('DOKAAI_API_BASE_URL');
