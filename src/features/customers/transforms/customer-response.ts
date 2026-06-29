import {
  isRecord,
  readDataRecord,
  readEnvelope,
  readMessage,
  readStatus,
} from '../../../core/zapier';

export const transformCustomerMutationResponse = (
  raw: unknown,
  fallbackCustomerId: string | undefined,
  uniqueCustomerId?: unknown,
) => {
  const envelope = readEnvelope(raw);
  const data = readDataRecord(envelope);
  const customerId =
    (typeof data?.customerId === 'string' && data.customerId) ||
    (typeof data?.id === 'string' && data.id) ||
    fallbackCustomerId ||
    (typeof uniqueCustomerId === 'string' ? uniqueCustomerId : undefined);

  return {
    id: customerId,
    customerId,
    uniqueCustomerId,
    status: readStatus(envelope),
    message: readMessage(envelope),
    data: envelope.data,
  };
};

export const transformRemoveCustomerResponse = (
  raw: unknown,
  customerId: string,
) => {
  const envelope = readEnvelope(raw);
  const data = readDataRecord(envelope);
  const responseCustomerId =
    (typeof data?.id === 'string' && data.id) || customerId;

  return {
    id: responseCustomerId,
    customerId: responseCustomerId,
    status: readStatus(envelope),
    message: readMessage(envelope),
  };
};

export const transformGetCustomerResponse = (
  raw: unknown,
  customerId: string,
): Record<string, unknown> => {
  const envelope = readEnvelope(raw);
  const attributes = readDataRecord(envelope) ?? {};
  const customer: Record<string, unknown> = {
    id: customerId,
    customerId,
    status: readStatus(envelope),
    message: readMessage(envelope),
  };

  for (const [key, attribute] of Object.entries(attributes)) {
    if (
      key === 'id' ||
      key === 'customerId' ||
      key === 'status' ||
      key === 'message'
    ) {
      continue;
    }

    if (isRecord(attribute) && Object.hasOwn(attribute, 'value')) {
      customer[key] =
        attribute.value === null || attribute.value === undefined
          ? ''
          : attribute.value;
    } else {
      customer[key] = attribute;
    }
  }

  return customer;
};
