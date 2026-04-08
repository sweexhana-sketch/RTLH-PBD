import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { hash, verify } from 'argon2';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import ws from 'ws';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';

// @ts-expect-error - virtual module
import * as serverBuild from 'virtual:react-router/server-build';
import { createRequestHandler } from 'react-router';

const log = (msg: string) => {
  console.error(`[${new Date().toISOString()}] [DEBUG] ${msg}`);
};

/**
 * Bulletproof environment variable access utility.
 * Checks hono/adapter env(c), process.env, and globalThis with extensive guarding.
 */
const getSafeEnv = (c: any, key: string): string | undefined => {
  try {
    // 1. Try Hono runtime context
    const runtime = env(c);
    if (runtime && typeof runtime === 'object' && key in runtime && runtime[key]) {
      return runtime[key] as string;
    }
  } catch (e) {}

  try {
    // 2. Try process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  return undefined;
};

// Top-level / static env access (guarded)
const getStaticEnv = (key: string): string | undefined => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

log('Starting server initialization...');

// Startup Validation
const criticalEnvVars = ['DATABASE_URL', 'AUTH_SECRET'];
criticalEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    log(`WARNING: ${varName} is missing from process.env`);
  } else {
    log(`${varName} is present.`);
  }
});

neonConfig.webSocketConstructor = ws;

log('Initializing Database Pool...');
const dbUrl = getStaticEnv('DATABASE_URL');
const pool = new Pool({
  connectionString: dbUrl,
});
const adapter = NeonAdapter(pool);
log('Database Pool initialized.');

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => c.text('OK', 200));

// Diagnostics endpoint (keys only)
app.get('/api/diag', (c) => {
  const runtimeKeys = Object.keys(env(c) || {});
  const processKeys = (typeof process !== 'undefined' && process.env) ? Object.keys(process.env) : [];
  return c.json({
    timestamp: new Date().toISOString(),
    runtimeAvailable: runtimeKeys.length > 0,
    runtimeKeys,
    processAvailable: processKeys.length > 0,
    processKeys: processKeys.filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('URL')),
    nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
    vercelEnv: getStaticEnv('VERCEL') || 'unknown'
  });
});

// Polyfill for Vercel Headers issue
app.use('*', async (c, next) => {
  if (c.req.raw && c.req.raw.headers && typeof c.req.raw.headers.get !== 'function') {
    log('Polyfilling missing headers.get()');
    const headers = c.req.raw.headers as any;
    c.req.raw.headers.get = (name: string) => headers[name.toLowerCase()] || null;
  }
  await next();
});

app.onError((err, c) => {
  console.error('[DEBUG] Hono Error Encountered:', err);
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (getStaticEnv('CORS_ORIGINS')) {
  app.use(
    '/*',
    cors({
      origin: (getStaticEnv('CORS_ORIGINS') || '').split(',').map((origin) => origin.trim()),
    })
  );
}
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024, // 4.5mb to match vercel limit
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

if (getStaticEnv('AUTH_SECRET')) {
  log('Initializing Auth.js middleware (Deferred)...');
  app.use(
    '*',
    initAuthConfig(async (c) => {
      const secret = getSafeEnv(c, 'AUTH_SECRET');
      if (!secret) {
        log('WARNING: AUTH_SECRET resolve failed in callback. Using static fallback if available.');
      }
      return {
        secret: secret || getStaticEnv('AUTH_SECRET') || 'dummy-secret-to-prevent-crash',
      pages: {
        signIn: '/account/signin',
        signOut: '/account/logout',
      },
      skipCSRFCheck,
      session: {
        strategy: 'jwt',
      },
      callbacks: {
        session({ session, token }) {
          if (token.sub) {
            session.user.id = token.sub;
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        sessionToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        callbackUrl: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
      },
      providers: [
        // Dev-only provider for simulated social sign-in (Google, Facebook, etc.)
        // Creates or finds a user by email without requiring a password.
        ...(process.env.NEXT_PUBLIC_CREATE_ENV === 'DEVELOPMENT'
          ? [
              Credentials({
                id: 'dev-social',
                name: 'Development Social Sign-in',
                credentials: {
                  email: { label: 'Email', type: 'email' },
                  name: { label: 'Name', type: 'text' },
                  provider: { label: 'Provider', type: 'text' },
                },
                authorize: async (credentials) => {
                  const { email, name, provider } = credentials;
                  if (!email || typeof email !== 'string') return null;

                  const existing = await adapter.getUserByEmail(email);
                  if (existing) return existing;

                  const allowedProviders = new Set(['google', 'facebook', 'twitter', 'apple']);
                  const providerName =
                    typeof provider === 'string' && allowedProviders.has(provider.toLowerCase())
                      ? provider.toLowerCase()
                      : 'google';
                  const newUser = await adapter.createUser({
                    emailVerified: null,
                    email,
                    name:
                      typeof name === 'string' && name.length > 0
                        ? name
                        : undefined,
                  });
                  await adapter.linkAccount({
                    type: 'oauth',
                    userId: newUser.id,
                    provider: providerName,
                    providerAccountId: `dev-${newUser.id}`,
                  });
                  return newUser;
                },
              }),
            ]
          : []),
        Credentials({
          id: 'credentials-signin',
          name: 'Credentials Sign in',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            const { email, password } = credentials;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              return null;
            }
            const matchingAccount = user.accounts.find(
              (account) => account.provider === 'credentials'
            );
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              return null;
            }

            const isValid = await verify(accountPassword, password);
            if (!isValid) {
              return null;
            }

            // return user object with the their profile data
            return user;
          },
        }),
        Credentials({
          id: 'credentials-signup',
          name: 'Credentials Sign up',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
            name: { label: 'Name', type: 'text' },
            image: { label: 'Image', type: 'text', required: false },
          },
          authorize: async (credentials) => {
            const { email, password, name, image } = credentials;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              const newUser = await adapter.createUser({
                emailVerified: null,
                email,
                name: typeof name === 'string' && name.length > 0 ? name : undefined,
                image: typeof image === 'string' && image.length > 0 ? image : undefined,
              });
              await adapter.linkAccount({
                extraData: {
                  password: await hash(password),
                },
                type: 'credentials',
                userId: newUser.id,
                providerAccountId: newUser.id,
                provider: 'credentials',
              });
              return newUser;
            }
            return null;
          },
        }),
      ],
    };
  })
);
  log('Auth.js middleware initialized.');
}
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-expect-error -- duplex is accepted by the runtime even though the
    // type declarations don't include it; required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

app.use('/api/auth/*', async (c, next) => {
  if (isAuthAction(c.req.path)) {
    return authHandler()(c, next);
  }
  return next();
});

log('Registering API routes...');
app.route(API_BASENAME, api);
log('API routes registered.');

let cachedRequestHandler: any = null;

if (!isProd) {
  log('Starting in Development mode...');
  server = await createHonoServer({
    app,
    defaultLogger: false,
  });
} else {
  log('Starting in Production mode (READY for requests)');
  
  app.all('*', async (c) => {
    try {
      if (!cachedRequestHandler) {
        log('Lazy initializing React Router request handler...');
        const start = Date.now();
        cachedRequestHandler = createRequestHandler(serverBuild, 'production');
        log(`React Router request handler created in ${Date.now() - start}ms.`);
      }
      return await cachedRequestHandler(c.req.raw);
    } catch (handlerErr) {
      log(`Request handler error: ${handlerErr}`);
      return c.html(getHTMLForErrorPage(handlerErr as any), 500);
    }
  });
}

log('Server initialization phase complete.');

export { app };
export default server;
