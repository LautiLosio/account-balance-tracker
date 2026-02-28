// app/api/auth/[auth0]/route.js
import { auth0 } from '@/lib/auth0';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

export async function GET(request) {
  return auth0.middleware(request);
}
