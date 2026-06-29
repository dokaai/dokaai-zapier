import { readEnvelope, readMessage, readStatus } from '../../../core/zapier';

export const transformAddCustomersResponse = (
  raw: unknown,
  targetAudienceListId: string,
  customerIds: string[],
) => {
  const envelope = readEnvelope(raw);

  return {
    id: targetAudienceListId,
    targetAudienceListId,
    customerIds,
    status: readStatus(envelope),
    message: readMessage(envelope),
    data: envelope.data,
  };
};

export const transformRemoveCustomerResponse = (
  raw: unknown,
  targetAudienceListId: string,
  customerId: string,
) => {
  const envelope = readEnvelope(raw);

  return {
    id: customerId,
    customerId,
    targetAudienceListId,
    status: readStatus(envelope),
    message: readMessage(envelope),
    data: envelope.data,
  };
};
