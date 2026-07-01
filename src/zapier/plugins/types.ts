import type { Bundle, ZObject } from 'zapier-platform-core';

import type {
  DiscoveredZapierOperation,
  GeneratedInputField,
  OpenApiDocument,
} from '../../openapi/types';

export type DynamicInputFields = (
  z: ZObject,
  bundle: Bundle,
) => Promise<GeneratedInputField[]>;

export interface ZapierOperationPluginContext {
  document: OpenApiDocument;
  discovered: DiscoveredZapierOperation;
}

export interface ZapierOperationPlugin {
  appliesTo(context: ZapierOperationPluginContext): boolean;
  excludedBodyFields?: (context: ZapierOperationPluginContext) => string[];
  inputFields?: (
    context: ZapierOperationPluginContext,
  ) => Array<GeneratedInputField | DynamicInputFields>;
  bodyFields?: (
    context: ZapierOperationPluginContext,
    inputData: Record<string, unknown>,
  ) => Record<string, unknown>;
}
