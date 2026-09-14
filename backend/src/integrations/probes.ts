/**
 * Test-connection probes. One function per provider that has `hasTest: true`
 * in the registry. Each returns { ok, message } — never throws — because the
 * service commits the result to lastTestStatus and a thrown error would just
 * mean "unknown" to the operator instead of "auth failed" or "rate-limited".
 *
 * Probes are deliberately shallow: cheapest read endpoint on the provider,
 * often the account/self lookup. We don't spend real tokens or money.
 */

export interface ProbeResult {
  ok: boolean;
  message: string;
}

async function safeFetch(
  url: string,
  init: RequestInit,
  timeoutMs = 8000,
): Promise<Response | { error: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } catch (e: any) {
    return { error: e?.message ?? String(e) };
  } finally {
    clearTimeout(t);
  }
}

function isResponse(x: Response | { error: string }): x is Response {
  return typeof (x as any).ok === 'boolean';
}

async function readTextSafe(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 300);
  } catch {
    return '';
  }
}

// ── Payments ────────────────────────────────────────────────────────────────

async function probeRazorpay(c: any): Promise<ProbeResult> {
  const auth = Buffer.from(`${c.keyId}:${c.keySecret}`).toString('base64');
  const r = await safeFetch('https://api.razorpay.com/v1/payments?count=1', {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Razorpay credentials verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeStripe(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.stripe.com/v1/balance', {
    headers: { Authorization: `Bearer ${c.secretKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Stripe secret key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probePaypal(c: any): Promise<ProbeResult> {
  const base = c.env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64');
  const r = await safeFetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: `PayPal ${c.env} token issued.` };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

// ── AI ──────────────────────────────────────────────────────────────────────

async function probeOpenAI(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'OpenAI key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeAnthropic(c: any): Promise<ProbeResult> {
  // Anthropic has no /models list endpoint under the API key; smallest valid
  // request is a 1-token completion. Cheap but not free.
  const r = await safeFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': c.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    }),
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Anthropic key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeGemini(c: any): Promise<ProbeResult> {
  const r = await safeFetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(c.apiKey)}`,
    { method: 'GET' },
  );
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Gemini key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeGroq(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Groq key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeDeepseek(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.deepseek.com/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'DeepSeek key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeMistral(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Mistral key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeCohere(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.cohere.com/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Cohere key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeTogether(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.together.xyz/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Together key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeFireworks(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.fireworks.ai/inference/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Fireworks key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probePerplexity(c: any): Promise<ProbeResult> {
  // Perplexity has no /models under the API; smallest probe is a 1-token chat.
  const r = await safeFetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    }),
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Perplexity key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeXai(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://api.x.ai/v1/models', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'xAI key verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeHuggingFace(c: any): Promise<ProbeResult> {
  const r = await safeFetch('https://huggingface.co/api/whoami-v2', {
    headers: { Authorization: `Bearer ${c.apiKey}` },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Hugging Face token verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

// ── Ads / Social ────────────────────────────────────────────────────────────

async function probeMeta(c: any): Promise<ProbeResult> {
  const r = await safeFetch(
    `https://graph.facebook.com/v20.0/me?access_token=${encodeURIComponent(c.accessToken ?? c.pageAccessToken)}`,
    { method: 'GET' },
  );
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) return { ok: true, message: 'Meta token verified.' };
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeWhatsAppCloud(c: any): Promise<ProbeResult> {
  const phoneId = c.phoneNumberId;
  const token = c.accessToken;
  if (!phoneId || !token) {
    return { ok: false, message: 'Phone Number ID and Access Token are required.' };
  }
  const r = await safeFetch(
    `https://graph.facebook.com/v19.0/${phoneId}?access_token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  );
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) {
    try {
      const data = await r.json();
      return {
        ok: true,
        message: `WhatsApp Cloud verified: ${data.display_phone_number || phoneId} (${data.verified_name || 'Verified'})`,
      };
    } catch {
      return { ok: true, message: 'WhatsApp Cloud API credentials verified.' };
    }
  }
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}

async function probeBrevo(c: any): Promise<ProbeResult> {
  if (!c.apiKey) return { ok: false, message: 'API Key is required.' };
  const r = await safeFetch('https://api.brevo.com/v3/account', {
    method: 'GET',
    headers: {
      'api-key': c.apiKey,
      accept: 'application/json',
    },
  });
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (r.ok) {
    try {
      const data = await r.json();
      return {
        ok: true,
        message: `Brevo account verified: ${data.email || 'Active'} (${data.plan?.[0]?.type || 'Standard'} plan)`,
      };
    } catch {
      return { ok: true, message: 'Brevo email credentials verified.' };
    }
  }
  return { ok: false, message: `HTTP ${r.status}: ${await readTextSafe(r)}` };
}


async function probeGoogleAds(c: any): Promise<ProbeResult> {
  for (const k of ['developerToken', 'clientId', 'clientSecret', 'refreshToken']) {
    if (!c[k]) return { ok: false, message: `${k} is required.` };
  }

  // Step 1 — can the refresh token still mint an access token? This is what
  // breaks in practice: tokens are revoked when the OAuth consent screen is
  // edited or the Google account password changes.
  const tokenRes = await safeFetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
    }).toString(),
  });
  if (!isResponse(tokenRes)) return { ok: false, message: `Network: ${tokenRes.error}` };
  if (!tokenRes.ok) {
    return { ok: false, message: `OAuth refused the refresh token: ${await readTextSafe(tokenRes)}` };
  }

  let accessToken = '';
  try {
    accessToken = (await tokenRes.json()).access_token ?? '';
  } catch {
    return { ok: false, message: 'OAuth response was not JSON.' };
  }
  if (!accessToken) return { ok: false, message: 'OAuth response carried no access_token.' };

  // Step 2 — is the developer token approved and does it reach any account?
  // listAccessibleCustomers is the cheapest authenticated Ads call there is.
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': c.developerToken,
  };
  const login = String(c.loginCustomerId ?? '').replace(/\D/g, '');
  if (login) headers['login-customer-id'] = login;

  const r = await safeFetch(
    'https://googleads.googleapis.com/v25/customers:listAccessibleCustomers',
    { headers },
    12000,
  );
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (!r.ok) {
    return { ok: false, message: `Google Ads API HTTP ${r.status}: ${await readTextSafe(r)}` };
  }

  try {
    const data = await r.json();
    const ids: string[] = (data.resourceNames ?? []).map((n: string) => n.split('/').pop());
    return {
      ok: true,
      message: ids.length
        ? `Google Ads verified — ${ids.length} account(s) reachable: ${ids.slice(0, 3).join(', ')}${ids.length > 3 ? '…' : ''}`
        : 'Credentials valid, but no Ads accounts are reachable. Check the account has access.',
    };
  } catch {
    return { ok: true, message: 'Google Ads credentials verified.' };
  }
}


async function probeSearchConsole(c: any): Promise<ProbeResult> {
  for (const k of ['clientId', 'clientSecret', 'refreshToken']) {
    if (!c[k]) return { ok: false, message: `${k} is required.` };
  }

  // Step 1 - can the refresh token still mint an access token?
  const tokenRes = await safeFetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
    }).toString(),
  });
  if (!isResponse(tokenRes)) return { ok: false, message: `Network: ${tokenRes.error}` };
  if (!tokenRes.ok) {
    return { ok: false, message: `OAuth refused the refresh token: ${await readTextSafe(tokenRes)}` };
  }

  let accessToken = '';
  try {
    accessToken = (await tokenRes.json()).access_token ?? '';
  } catch {
    return { ok: false, message: 'OAuth response was not JSON.' };
  }
  if (!accessToken) return { ok: false, message: 'OAuth response carried no access_token.' };

  // Step 2 - does the token actually reach a Search Console property? Listing
  // sites is the cheapest authenticated call and it also catches the most
  // common misconfiguration: correct credentials, wrong property string.
  const r = await safeFetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 12000);
  if (!isResponse(r)) return { ok: false, message: `Network: ${r.error}` };
  if (!r.ok) {
    return { ok: false, message: `Search Console API HTTP ${r.status}: ${await readTextSafe(r)}` };
  }

  try {
    const data = await r.json();
    const entries: any[] = data.siteEntry ?? [];
    const urls: string[] = entries.map((e) => e.siteUrl);
    if (urls.length === 0) {
      return {
        ok: false,
        message: 'Credentials valid, but this Google account has no Search Console properties.',
      };
    }
    const wanted = String(c.siteUrl ?? '').trim();
    if (wanted && !urls.includes(wanted)) {
      return {
        ok: false,
        message: `Authenticated, but "${wanted}" is not in this account. Available: ${urls.slice(0, 4).join(', ')}`,
      };
    }
    return {
      ok: true,
      message: `Search Console verified - ${urls.length} propertie(s): ${urls.slice(0, 3).join(', ')}${urls.length > 3 ? '...' : ''}`,
    };
  } catch {
    return { ok: true, message: 'Search Console credentials verified.' };
  }
}

// ── Registry ────────────────────────────────────────────────────────────────

type Probe = (creds: any) => Promise<ProbeResult>;

const PROBES: Record<string, Probe> = {
  razorpay: probeRazorpay,
  stripe: probeStripe,
  paypal: probePaypal,

  openai: probeOpenAI,
  anthropic: probeAnthropic,
  google_gemini: probeGemini,
  groq: probeGroq,
  deepseek: probeDeepseek,
  mistral: probeMistral,
  cohere: probeCohere,
  together: probeTogether,
  fireworks: probeFireworks,
  perplexity: probePerplexity,
  xai_grok: probeXai,
  huggingface: probeHuggingFace,

  google_ads: probeGoogleAds,
  google_search_console: probeSearchConsole,
  meta_ads: probeMeta,
  meta_page: probeMeta,
  whatsapp_cloud: probeWhatsAppCloud,
  brevo: probeBrevo,
};

export function hasProbe(providerId: string): boolean {
  return providerId in PROBES;
}

export async function runProbe(
  providerId: string,
  creds: Record<string, unknown>,
): Promise<ProbeResult> {
  const probe = PROBES[providerId];
  if (!probe) return { ok: false, message: 'No test probe for this provider yet.' };
  try {
    return await probe(creds);
  } catch (e: any) {
    return { ok: false, message: `Probe threw: ${e?.message ?? String(e)}` };
  }
}
