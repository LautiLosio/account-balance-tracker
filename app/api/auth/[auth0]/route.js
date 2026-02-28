// app/api/auth/[auth0]/route.js
import { handleAuth } from '@auth0/nextjs-auth0';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

export const GET = handleAuth();
