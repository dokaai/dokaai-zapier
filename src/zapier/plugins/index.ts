import { customerPoolAttributesPlugin } from './customer-pool-attributes';
import type {
  ZapierOperationPlugin,
  ZapierOperationPluginContext,
} from './types';

const operationPlugins: readonly ZapierOperationPlugin[] = [
  customerPoolAttributesPlugin,
];

export const pluginsForOperation = (
  context: ZapierOperationPluginContext,
): ZapierOperationPlugin[] =>
  operationPlugins.filter((plugin) => plugin.appliesTo(context));

export * from './types';
