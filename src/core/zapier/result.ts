import { isRecord } from './values';

export interface DokaaiEnvelope {
  status?: unknown;
  message?: unknown;
  data?: unknown;
  metaData?: unknown;
  error?: unknown;
}

export const readEnvelope = (value: unknown): DokaaiEnvelope =>
  isRecord(value) ? value : {};

export const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

export const readStatus = (envelope: DokaaiEnvelope): string | undefined =>
  readString(envelope.status);

export const readMessage = (envelope: DokaaiEnvelope): string | undefined =>
  readString(envelope.message);

export const readDataRecord = (
  envelope: DokaaiEnvelope,
): Record<string, unknown> | undefined =>
  isRecord(envelope.data) ? envelope.data : undefined;
