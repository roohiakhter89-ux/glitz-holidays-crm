import { JWT, OAuth2Client } from 'google-auth-library';

/**
 * Authentication for the Search Console integration.
 *
 * Two methods, chosen explicitly on the integration rather than inferred from
 * whichever fields happen to be filled in. Credential edits in
 * IntegrationsService MERGE, and a blank field means "keep the old value", so a
 * row that switched from a service account to OAuth still carries the old key.
 * Inferring the method from field presence would silently keep using it.
 *
 *   service_account  A JSON key for a Google Cloud service account whose
 *                    client_email has been added as a user on the property.
 *                    No consent screen, no refresh token to expire. Supported
 *                    by google-auth-library's JWT client. Google's Search
 *                    Console docs only describe OAuth, so the connection probe
 *                    is what confirms a given property accepts it.
 *
 *   oauth            An OAuth client plus a refresh token carrying the
 *                    webmasters.readonly scope. If the OAuth consent screen is
 *                    in Testing, Google expires refresh tokens after 7 days,
 *                    which would break the nightly sync a week after setup with
 *                    no code change. Publish the consent screen to Production
 *                    before generating the token.
 */

export const AUTH_SERVICE_ACCOUNT = 'service_account';
export const AUTH_OAUTH = 'oauth';

/** Read-only is all reporting needs. Never request the write scope. */
export const SEARCH_CONSOLE_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

/** The credential blob as stored on the Integration row. */
export interface RawSearchConsoleCredentials {
  authMethod?: string;
  serviceAccountKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  siteUrl?: string;
}

export type AuthConfig =
  | { mode: 'service_account'; clientEmail: string; privateKey: string }
  | { mode: 'oauth'; clientId: string; clientSecret: string; refreshToken: string };

/** Thrown for anything the operator can fix by editing the integration. */
export class SearchConsoleAuthError extends Error {}

/**
 * Pull client_email and private_key out of a pasted service account key file.
 *
 * Tolerates the two ways a paste gets mangled. A single-line input strips the
 * line breaks between JSON fields, which is harmless because JSON ignores that
 * whitespace. A key copied through a shell or another text field can arrive
 * double-escaped, with literal backslash-n sequences inside private_key instead
 * of real line breaks, and the PEM parser then fails with an opaque decoder
 * error; that case is repaired here.
 *
 * Also catches the most common wrong file: the OAuth client JSON (which has a
 * top-level "web" or "installed" key) pasted where a service account key goes.
 */
export function parseServiceAccountKey(raw: string): { clientEmail: string; privateKey: string } {
  const text = (raw ?? '').trim();
  if (!text) throw new SearchConsoleAuthError('The service account JSON key is empty.');

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new SearchConsoleAuthError(
      'The service account key is not valid JSON. Paste the entire contents of the downloaded .json key file.',
    );
  }

  if (data && typeof data === 'object' && (data.web || data.installed)) {
    throw new SearchConsoleAuthError(
      'That is an OAuth client file, not a service account key. Use auth method "oauth" for it, or download a key under IAM & Admin > Service Accounts > Keys.',
    );
  }

  if (data?.type !== 'service_account') {
    throw new SearchConsoleAuthError(
      `Expected a service account key (type "service_account"), got type ${JSON.stringify(data?.type ?? null)}.`,
    );
  }

  const clientEmail = String(data.client_email ?? '').trim();
  let privateKey = String(data.private_key ?? '');

  if (!clientEmail) throw new SearchConsoleAuthError('The service account key has no client_email.');
  if (!privateKey) throw new SearchConsoleAuthError('The service account key has no private_key.');

  if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new SearchConsoleAuthError('private_key does not look like a PEM private key.');
  }

  return { clientEmail, privateKey };
}

/**
 * Decide how to authenticate from the stored blob.
 *
 * An explicit authMethod always wins over whatever other fields are present.
 * Rows saved before authMethod existed only ever held OAuth fields, so a blob
 * with a refresh token and no method is treated as OAuth.
 */
export function resolveAuthConfig(creds: RawSearchConsoleCredentials): AuthConfig {
  const method = String(creds?.authMethod ?? '').trim();
  const effective = method || (creds?.refreshToken ? AUTH_OAUTH : '');

  if (effective === AUTH_SERVICE_ACCOUNT) {
    if (!creds.serviceAccountKey) {
      throw new SearchConsoleAuthError(
        'Auth method is service_account, but no service account JSON key is stored.',
      );
    }
    const { clientEmail, privateKey } = parseServiceAccountKey(creds.serviceAccountKey);
    return { mode: 'service_account', clientEmail, privateKey };
  }

  if (effective === AUTH_OAUTH) {
    const missing = (['clientId', 'clientSecret', 'refreshToken'] as const).filter((k) => !creds[k]);
    if (missing.length > 0) {
      throw new SearchConsoleAuthError(
        `Auth method is oauth, but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing.`,
      );
    }
    return {
      mode: 'oauth',
      clientId: creds.clientId as string,
      clientSecret: creds.clientSecret as string,
      refreshToken: creds.refreshToken as string,
    };
  }

  throw new SearchConsoleAuthError(
    method
      ? `Unknown auth method ${JSON.stringify(method)}. Use service_account or oauth.`
      : 'Choose an auth method: service_account or oauth.',
  );
}

/**
 * Build the auth client the Search Console library consumes. Both clients
 * refresh their own access tokens, so there is no token cache to manage.
 */
export function buildAuthClient(config: AuthConfig): JWT | OAuth2Client {
  if (config.mode === 'service_account') {
    return new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: SEARCH_CONSOLE_SCOPES,
    });
  }

  const client = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
  client.setCredentials({
    refresh_token: config.refreshToken,
    scope: SEARCH_CONSOLE_SCOPES.join(' '),
  });
  return client;
}

/**
 * Turn a token-acquisition failure into the one instruction that fixes it.
 *
 * invalid_grant under OAuth is overwhelmingly the 7-day expiry that applies
 * while the consent screen is in Testing, and Google's raw error says nothing
 * about that.
 */
export function describeTokenError(e: unknown, config: AuthConfig): string {
  const err = e as any;
  const data = err?.response?.data;
  const code = typeof data?.error === 'string' ? data.error : '';
  const detail = String(data?.error_description ?? err?.message ?? e);

  if (config.mode === 'oauth' && (code === 'invalid_grant' || /invalid_grant/.test(detail))) {
    return (
      'Google rejected the refresh token (invalid_grant). If the OAuth consent screen is in ' +
      'Testing, refresh tokens expire after 7 days: publish it to Production, then generate a new ' +
      'refresh token.'
    );
  }

  if (config.mode === 'service_account' && /DECODER|PEM|asn1|private key|sign/i.test(detail)) {
    return (
      `The service account private key could not sign a token (${detail}). ` +
      'Re-download the JSON key and paste the whole file.'
    );
  }

  return `Could not get an access token: ${detail}`;
}
