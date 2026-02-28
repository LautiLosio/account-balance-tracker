import { Auth0Client } from '@auth0/nextjs-auth0/server';

const domainFromIssuer = process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN ?? domainFromIssuer,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  routes: {
    login: '/api/auth/login',
    callback: '/api/auth/callback',
    logout: '/api/auth/logout',
  },
});
