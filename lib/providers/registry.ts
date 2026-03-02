/**
 * Provider Registry
 *
 * Central registry for all connection providers.
 * To add a new provider:
 *   1. Create a class implementing ConnectionProvider
 *   2. Register it here
 *   3. That's it — all /api/connections/[id]/... routes will automatically support it.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { IICSProvider } from './IICSProvider';
import { SalesforceProvider } from './SalesforceProvider';
import { SnowflakeProvider } from './SnowflakeProvider';
import type { ConnectionProvider } from './types';

const STATIC_PROVIDERS: ConnectionProvider[] = [new SnowflakeProvider(), new IICSProvider()];

/**
 * Returns the correct provider for the given connection type.
 * Salesforce needs req/res for cookie-based auth, so it's instantiated on demand.
 */
export function getProvider(
  connectionType: string,
  req: NextApiRequest,
  res: NextApiResponse
): ConnectionProvider {
  if (connectionType === 'salesforce') {
    return new SalesforceProvider(req, res);
  }

  const provider = STATIC_PROVIDERS.find((p) => p.type === connectionType);
  if (!provider) {
    throw new Error(`Unsupported connection type: ${connectionType}`);
  }
  return provider;
}

/**
 * Returns the list of all supported provider type strings.
 */
export function getSupportedTypes(): string[] {
  return ['salesforce', ...STATIC_PROVIDERS.map((p) => p.type)];
}
