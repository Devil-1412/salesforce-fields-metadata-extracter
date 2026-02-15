import jsforce from 'jsforce';
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthToken, getSalesforceToken, setSalesforceTokenCookie } from './cookieAuth';
import { decrypt } from './encryption';
import { getServiceRoleClient } from './supabaseClient';

/**
 * AuthStore
 * Manages Salesforce session lifecycle: Cookie Check -> Verification -> Auto-Login
 */
export class AuthStore {
  private static validTokens = new Map<string, number>(); // Token -> Timestamp
  private static readonly TOKEN_VALIDITY = 1000 * 60 * 15; // 15 minutes

  private conn: jsforce.Connection | null = null;

  constructor(
    private req: NextApiRequest,
    private res: NextApiResponse,
    private instanceUrl: string
  ) {}

  /**
   * Returns a valid Salesforce Connection.
   * Auto-refreshes (logs in again) if the cached token is invalid/expired.
   */
  async getConnection(): Promise<jsforce.Connection> {
    if (this.conn) return this.conn;

    // 1. Try to get a valid cached connection
    const cachedToken = getSalesforceToken(this.req, this.instanceUrl);
    if (cachedToken) {
      // OPTIMIZATION: Check in-memory validation cache first
      const lastValidated = AuthStore.validTokens.get(cachedToken);
      const isFresh = lastValidated && Date.now() - lastValidated < AuthStore.TOKEN_VALIDITY;

      try {
        const testConn = new jsforce.Connection({
          accessToken: cachedToken,
          instanceUrl: this.instanceUrl,
        });

        if (!isFresh) {
          // Verify it's alive (Identity call) - expense network call
          await testConn.identity();
          // Cache the success
          AuthStore.validTokens.set(cachedToken, Date.now());
        } else {
          console.log(`AuthStore: Token trusted (cached validation) for ${this.instanceUrl}`);
        }

        this.conn = testConn;
        return this.conn;
      } catch (e) {
        console.warn(`AuthStore: Cached token for ${this.instanceUrl} invalid, refreshing...`);
        AuthStore.validTokens.delete(cachedToken);
      }
    }

    // 2. Fallback: Perform fresh login (Refresh)
    return this.refreshSession();
  }

  /**
   * Forces a fresh login using stored credentials and updates the cookie.
   */
  async refreshSession(): Promise<jsforce.Connection> {
    const supabase = getServiceRoleClient();

    // Get Current User
    const authToken = getAuthToken(this.req);
    if (!authToken) throw new Error('AuthStore: No authentication token found');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);
    if (authError || !user) throw new Error('AuthStore: Invalid user session');

    // Lookup Org by Instance + User via connections + salesforce_connection_details
    const { data: connData, error } = await supabase
      .from('connections')
      .select(
        'id, salesforce_connection_details(org_email, org_name, encrypted_org_password, encrypted_security_token, is_sandbox, instance_url, refresh_token)'
      )
      .eq('user_id', user.id)
      .eq('connection_type', 'salesforce')
      .single();

    const details = (connData as any)?.salesforce_connection_details;
    const orgData =
      connData && details
        ? {
            id: connData.id,
            org_email: details.org_email,
            org_name: details.org_name,
            encrypted_org_password: details.encrypted_org_password,
            encrypted_security_token: details.encrypted_security_token,
            is_sandbox: details.is_sandbox,
            instance_url: details.instance_url,
            refresh_token: details.refresh_token,
          }
        : null;

    if (error || !orgData) {
      console.error(`AuthStore: Org not found for ${this.instanceUrl}`, error);
      throw new Error(`AuthStore: Organization not found for ${this.instanceUrl}`);
    }

    // Login
    const loginUrl = orgData.is_sandbox
      ? 'https://test.salesforce.com'
      : 'https://login.salesforce.com';
    const conn = new jsforce.Connection({ loginUrl });

    const password = orgData.encrypted_org_password ? decrypt(orgData.encrypted_org_password) : '';
    const securityToken = orgData.encrypted_security_token
      ? decrypt(orgData.encrypted_security_token)
      : '';

    await conn.login(orgData.org_email, password + securityToken);

    // Update Cache
    if (conn.accessToken) {
      setSalesforceTokenCookie(this.res, conn.accessToken, this.instanceUrl);
    }

    this.conn = conn;
    return this.conn;
  }
}
