import type { IntegrationCategory } from '@prisma/client';

/**
 * Provider registry. Every integration in the product must be defined here —
 * the frontend's dynamic dialog and the backend's test probes both read from
 * this file. Adding a provider is a matter of adding one row.
 *
 * Field types map to HTML inputs: password uses type="password" so browser
 * chrome doesn't auto-fill and doesn't show the value in plaintext when
 * editing. Every credential value is treated as a secret regardless — the
 * whole `credentials` blob is AES-encrypted at rest.
 */

export type FieldType = 'text' | 'password' | 'url' | 'select';

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[]; // for type=select
}

export interface ProviderSpec {
  id: string;
  label: string;
  category: IntegrationCategory;
  logo?: string; // emoji or icon slug for quick visual scan
  docsUrl?: string;
  fields: FieldSpec[];
  /** True when a real test-connection probe exists. Otherwise UI shows "not implemented". */
  hasTest?: boolean;
}

// ── Payments — Domestic ─────────────────────────────────────────────────────
const paymentDomestic: ProviderSpec[] = [
  {
    id: 'razorpay',
    label: 'Razorpay',
    category: 'PAYMENT_DOMESTIC',
    docsUrl: 'https://razorpay.com/docs/api/authentication/',
    fields: [
      { key: 'keyId', label: 'Key ID', type: 'text', required: true, placeholder: 'rzp_live_...' },
      { key: 'keySecret', label: 'Key Secret', type: 'password', required: true },
    ],
    hasTest: true,
  },
  {
    id: 'payu',
    label: 'PayU',
    category: 'PAYMENT_DOMESTIC',
    docsUrl: 'https://docs.payu.in/',
    fields: [
      { key: 'merchantKey', label: 'Merchant Key', type: 'text', required: true },
      { key: 'salt', label: 'Salt', type: 'password', required: true },
    ],
  },
  {
    id: 'ccavenue',
    label: 'CCAvenue',
    category: 'PAYMENT_DOMESTIC',
    docsUrl: 'https://www.ccavenue.com/developers_documents.jsp',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'accessCode', label: 'Access Code', type: 'text', required: true },
      { key: 'workingKey', label: 'Working Key', type: 'password', required: true },
    ],
  },
  {
    id: 'instamojo',
    label: 'Instamojo',
    category: 'PAYMENT_DOMESTIC',
    docsUrl: 'https://docs.instamojo.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
    ],
  },
  {
    id: 'cashfree',
    label: 'Cashfree',
    category: 'PAYMENT_DOMESTIC',
    docsUrl: 'https://docs.cashfree.com/',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    ],
  },
];

// ── Payments — International ────────────────────────────────────────────────
const paymentInternational: ProviderSpec[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    category: 'PAYMENT_INTERNATIONAL',
    docsUrl: 'https://stripe.com/docs/keys',
    fields: [
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_live_...' },
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
    ],
    hasTest: true,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    category: 'PAYMENT_INTERNATIONAL',
    docsUrl: 'https://developer.paypal.com/api/rest/',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'env', label: 'Environment', type: 'select', required: true, options: ['sandbox', 'live'] },
    ],
    hasTest: true,
  },
];

// ── AI ──────────────────────────────────────────────────────────────────────
const ai: ProviderSpec[] = [
  {
    id: 'openai', label: 'OpenAI', category: 'AI',
    docsUrl: 'https://platform.openai.com/api-keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' }],
    hasTest: true,
  },
  {
    id: 'anthropic', label: 'Anthropic (Claude)', category: 'AI',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-ant-...' }],
    hasTest: true,
  },
  {
    id: 'google_gemini', label: 'Google Gemini', category: 'AI',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
    hasTest: true,
  },
  {
    id: 'groq', label: 'Groq', category: 'AI',
    docsUrl: 'https://console.groq.com/keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'gsk_...' }],
    hasTest: true,
  },
  {
    id: 'deepseek', label: 'DeepSeek', category: 'AI',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
    hasTest: true,
  },
  {
    id: 'mistral', label: 'Mistral', category: 'AI',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
    hasTest: true,
  },
  {
    id: 'cohere', label: 'Cohere', category: 'AI',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
    hasTest: true,
  },
  {
    id: 'together', label: 'Together AI', category: 'AI',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
    hasTest: true,
  },
  {
    id: 'fireworks', label: 'Fireworks AI', category: 'AI',
    docsUrl: 'https://fireworks.ai/api-keys',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
    hasTest: true,
  },
  {
    id: 'perplexity', label: 'Perplexity', category: 'AI',
    docsUrl: 'https://www.perplexity.ai/settings/api',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'pplx-...' }],
    hasTest: true,
  },
  {
    id: 'xai_grok', label: 'xAI Grok', category: 'AI',
    docsUrl: 'https://console.x.ai/',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'xai-...' }],
    hasTest: true,
  },
  {
    id: 'huggingface', label: 'Hugging Face', category: 'AI',
    docsUrl: 'https://huggingface.co/settings/tokens',
    fields: [{ key: 'apiKey', label: 'Access Token', type: 'password', required: true, placeholder: 'hf_...' }],
    hasTest: true,
  },
];

// ── Ads ─────────────────────────────────────────────────────────────────────
const ads: ProviderSpec[] = [
  {
    id: 'google_ads', label: 'Google Ads', category: 'ADS',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/oauth/overview',
    fields: [
      { key: 'developerToken', label: 'Developer Token', type: 'password', required: true },
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { key: 'loginCustomerId', label: 'Manager Customer ID', type: 'text', placeholder: '123-456-7890' },
    ],
  },
  {
    id: 'meta_ads', label: 'Meta Ads', category: 'ADS',
    docsUrl: 'https://developers.facebook.com/docs/marketing-api/',
    fields: [
      { key: 'accessToken', label: 'Long-Lived Access Token', type: 'password', required: true },
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_...' },
    ],
    hasTest: true,
  },
];

// ── Social ──────────────────────────────────────────────────────────────────
const social: ProviderSpec[] = [
  {
    id: 'whatsapp_cloud', label: 'WhatsApp Cloud API', category: 'SOCIAL',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'wabaId', label: 'WhatsApp Business Account ID', type: 'text', required: true },
      { key: 'accessToken', label: 'System User Access Token', type: 'password', required: true },
    ],
    hasTest: true,
  },
  {
    id: 'brevo', label: 'Brevo (Email Marketing)', category: 'SOCIAL',
    docsUrl: 'https://app.brevo.com/settings/keys/api',
    fields: [
      { key: 'apiKey', label: 'API Key (v3)', type: 'password', required: true, placeholder: 'xkeysib-...' },
      { key: 'senderEmail', label: 'Default Sender Email', type: 'text', placeholder: 'hello@glitzholidays.in' },
      { key: 'senderName', label: 'Sender Name', type: 'text', placeholder: 'Glitz Holidays' },
    ],
    hasTest: true,
  },
  {
    id: 'meta_page', label: 'Facebook / Instagram Page', category: 'SOCIAL',
    docsUrl: 'https://developers.facebook.com/docs/pages-api/',
    fields: [
      { key: 'pageId', label: 'Page ID', type: 'text', required: true },
      { key: 'pageAccessToken', label: 'Page Access Token', type: 'password', required: true, help: 'Use a Long-Lived Page Token.' },
      { key: 'instagramId', label: 'Instagram Business Account ID', type: 'text', help: 'Optional — enables IG posting.' },
    ],
    hasTest: true,
  },
  {
    id: 'twitter', label: 'X / Twitter', category: 'SOCIAL',
    docsUrl: 'https://developer.twitter.com/en/portal/dashboard',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'accessSecret', label: 'Access Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'linkedin', label: 'LinkedIn Company Page', category: 'SOCIAL',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'organizationId', label: 'Organization URN', type: 'text', required: true, placeholder: 'urn:li:organization:...' },
    ],
  },
  {
    id: 'youtube', label: 'YouTube Channel', category: 'SOCIAL',
    docsUrl: 'https://developers.google.com/youtube/v3',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { key: 'channelId', label: 'Channel ID', type: 'text', required: true },
    ],
  },
];

export const PROVIDERS: ProviderSpec[] = [
  ...paymentDomestic,
  ...paymentInternational,
  ...ai,
  ...ads,
  ...social,
];

export function getProvider(id: string): ProviderSpec | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Frontend-safe view (no server code). */
export function publicProviderCatalog() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    category: p.category,
    docsUrl: p.docsUrl,
    fields: p.fields,
    hasTest: p.hasTest ?? false,
  }));
}
