import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth0 } from '@/lib/auth0';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

const defaultTestKey = (userId: string) => `user:${userId}:kv:test-key`;
const scopedKey = (userId: string, key: string) => `user:${userId}:kv:test:${key}`;

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session?.user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = defaultTestKey(session.user.sub);
    const value = `Hello from KV (${new Date().toISOString()})`;

    await kv.set(key, value);
    const result = await kv.get<string>(key);

    return NextResponse.json({ key, result });
  } catch (error) {
    console.error('KV test operation failed:', error);
    return NextResponse.json({ error: 'Failed to perform KV operation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session?.user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = (await request.json()) as { key?: string; value?: unknown };

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'A string "key" is required' }, { status: 400 });
    }

    const namespacedKey = scopedKey(session.user.sub, key);
    await kv.set(namespacedKey, value);

    return NextResponse.json({ message: 'Value set successfully', key: namespacedKey });
  } catch (error) {
    console.error('KV test operation failed:', error);
    return NextResponse.json({ error: 'Failed to perform KV operation' }, { status: 500 });
  }
}
