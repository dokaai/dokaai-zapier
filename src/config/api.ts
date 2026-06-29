export { DOKAAI_API_BASE_URL } from './env';

export const CUSTOMER_ATTRIBUTE_QUERY = {
  attributeTypes: 'all',
  page: '1',
  size: '100',
} as const;

export const CUSTOMER_FETCH_DEFAULT_ATTRIBUTE_TYPES = 'all';

export const NON_EDITABLE_CUSTOMER_FIELDS = ['uniqueCustomerId'] as const;

const encodePathSegment = (value: string): string => encodeURIComponent(value);

export const customerPaths = {
  collection: (projectId: string, customerPoolId: string): string =>
    `/customer/projects/${encodePathSegment(
      projectId,
    )}/customer-pools/${encodePathSegment(customerPoolId)}/customers`,

  byId: (
    projectId: string,
    customerPoolId: string,
    customerId: string,
  ): string =>
    `/customer/projects/${encodePathSegment(
      projectId,
    )}/customer-pools/${encodePathSegment(
      customerPoolId,
    )}/customers/${encodePathSegment(customerId)}`,

  attributes: (projectId: string, customerPoolId: string): string =>
    `/customer/projects/${encodePathSegment(
      projectId,
    )}/customer-pools/${encodePathSegment(customerPoolId)}/attributes`,

  status: (
    projectId: string,
    customerPoolId: string,
    customerId: string,
  ): string =>
    `/customer/projects/${encodePathSegment(
      projectId,
    )}/customer-pools/${encodePathSegment(
      customerPoolId,
    )}/customer/${encodePathSegment(customerId)}/status`,

  pools: (projectId: string): string =>
    `/customer/projects/${encodePathSegment(projectId)}/customer-pools/`,
} as const;

export const targetAudiencePaths = {
  customers: (projectId: string, targetAudienceListId: string): string =>
    `/nudge/projects/${encodePathSegment(
      projectId,
    )}/target-audience-lists/${encodePathSegment(
      targetAudienceListId,
    )}/customers`,

  customer: (
    projectId: string,
    targetAudienceListId: string,
    customerId: string,
  ): string =>
    `/nudge/projects/${encodePathSegment(
      projectId,
    )}/target-audience-lists/${encodePathSegment(
      targetAudienceListId,
    )}/customer/${encodePathSegment(customerId)}`,
} as const;

export const notificationHandlerPaths = {
  collection: (projectId: string): string =>
    `/nudge/projects/${encodePathSegment(projectId)}/notification-handlers`,
} as const;
