const AUTH0_REQUIRED_VARS = [
  'AUTH0_SECRET',
  'AUTH0_BASE_URL',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET'
] as const;

const KV_REST_REQUIRED_VARS = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'] as const;

let hasValidated = false;

function hasEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function getMissingVariables(): string[] {
  const missing: string[] = [];

  for (const key of AUTH0_REQUIRED_VARS) {
    if (!hasEnv(key)) {
      missing.push(key);
    }
  }

  const hasKvUrl = hasEnv('KV_URL');

  if (!hasKvUrl) {
    for (const key of KV_REST_REQUIRED_VARS) {
      if (!hasEnv(key)) {
        missing.push(key);
      }
    }
  }

  return missing;
}

export function validateServerEnv(): void {
  if (hasValidated) {
    return;
  }

  const missing = getMissingVariables();

  if (missing.length === 0) {
    hasValidated = true;
    return;
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const message = isDevelopment
    ? [
        'Missing required environment variables for Auth0 and KV integration.',
        `Missing: ${missing.join(', ')}`,
        'Add these values to your local `.env.local` (see `.env.example`) and restart the dev server.'
      ].join('\n')
    : 'Server environment is missing required Auth0/KV variables. Check deployment configuration.';

  throw new Error(message);
}
