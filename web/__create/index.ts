import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
// import ws from 'ws'; // Disabled for HTTP driver
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api, ensureRoutesRegistered } from './route-builder';

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

const isProd = (import.meta as any).env?.PROD || getStaticEnv('NODE_ENV') === 'production' || getStaticEnv('VERCEL') === '1' || process.env.NODE_ENV === 'production';

const criticalEnvVars = ['DATABASE_URL', 'AUTH_SECRET'];

let _db: any = null;
let _adapter: any = null;

const getDb = () => {
  if (!_db) {
    log('Initializing Database HTTP Client (Neon) with 10s guard...');
    const dbUrl = getStaticEnv('DATABASE_URL');
    if (!dbUrl) log('WARNING: DATABASE_URL is missing.');
    
    const strictFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(new Error('DATABASE_FETCH_TIMEOUT')), 10000);
        try {
            return await fetch(url, { ...init, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    };
    
    // Explicitly pass strictFetch to override neon's internal fetch so that TCP sockets
    // are forcefully destroyed at 10s, ensuring the Node Event Loop empties properly.
    const rawClient = neon(dbUrl || '', { fetchFunction: strictFetch });

    // Universal DB Proxy with 10s timeout to protect Auth and App
    _db = async (strings: any, ...values: any[]) => {
      let timer: any;
      const queryTimeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('DATABASE_TIMEOUT: Query took longer than 10s')), 10000);
      });
      try {
        return await Promise.race([
          rawClient(strings, ...values),
          queryTimeout
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
  }
  return _db;
};

const getAdapter = () => {
  if (!_adapter) {
    _adapter = NeonAdapter(getDb());
  }
  return _adapter;
};

// Log environment state ONLY once
log(`Starting server initialization in ${isProd ? 'Production' : 'Development'} mode...`);
criticalEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    log(`WARNING: ${varName} is missing from process.env`);
  }
});

// neonConfig.webSocketConstructor = ws; // Disabled for HTTP driver

const app = new Hono();

// Asset Guard: Immediately handle common static requests
app.all('/favicon.ico', (c) => c.text('Not Found', 404));
app.all('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /', 200));

// --- GLOBAL CIRCUIT BREAKER (15s) ---
app.use('*', async (c, next) => {
  const requestId = Math.random().toString(36).substring(7);
  (c as any).requestId = requestId;

  if (c.req.path === '/health' || c.req.path === '/favicon.ico') {
      return next();
  }

  log(`[${requestId}] [HONO_REQUEST_START] ${c.req.method} ${c.req.path}`);

  let timer: any;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('GLOBAL_TIMEOUT: Process took longer than 20s')), 20000);
  });

  try {
    const start = Date.now();
    await Promise.race([next(), timeoutPromise]);
    log(`[${requestId}] [HONO_REQUEST_COMPLETE] Finished in ${Date.now() - start}ms`);
  } catch (err: any) {
    log(`[${requestId}] [GLOBAL TIMEOUT/ERROR] caught: ${err.message || err}`);
    return c.html(getHTMLForErrorPage(err), 500);
  } finally {
    if (timer) clearTimeout(timer);
  }
});

// Health check endpoint
app.get('/health', (c) => c.text('OK', 200));

// Diagnostics endpoint (keys only)
app.get('/api/diag', async (c) => {
  const runtimeKeys = Object.keys(env(c) || {});
  const processKeys = (typeof process !== 'undefined' && process.env) ? Object.keys(process.env) : [];
  
  let dbStatus = 'untested';
  try {
    const db = getDb();
    const start = Date.now();
    // HTTP driver uses the client as a function (now guarded by getDb proxy)
    await db('SELECT 1');
    dbStatus = `connected (HTTP, ${Date.now() - start}ms)`;
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  return c.json({
    timestamp: new Date().toISOString(),
    dbStatus,
    runtimeAvailable: runtimeKeys.length > 0,
    processAvailable: processKeys.length > 0,
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
      log('Auth.js: Resolving config callback...');
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

                  const adapter = getAdapter();
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

            const adapter = getAdapter();
            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              return null;
            }
            const matchingAccount = user.accounts.find(
              (account: any) => account.provider === 'credentials'
            );
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              return null;
            }

            const isValid = await bcrypt.compare(password, accountPassword);
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

            const adapter = getAdapter();
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
                  password: await bcrypt.hash(password, 10),
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

log('Registering API routes (Lazy Entry)...');

app.use(API_BASENAME + '/*', async (c, next) => {
  await ensureRoutesRegistered();
  return next();
});

app.route(API_BASENAME, api);
log('API router attached.');

let server;
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
    const requestId = Math.random().toString(36).substring(7);

    if (!cachedRequestHandler) {
      log(`[${requestId}] Lazy initializing React Router request handler...`);
      const start = Date.now();
      cachedRequestHandler = createRequestHandler(serverBuild, 'production');
      log(`[${requestId}] React Router request handler created in ${Date.now() - start}ms.`);
    }

    // Fix for "Invalid URL" error: Ensure incoming request has an absolute URL
    let request = c.req.raw;
    try {
      new URL(request.url);
    } catch (e) {
      const url = new URL(c.req.path, getStaticEnv('VERCEL_URL') ? `https://${getStaticEnv('VERCEL_URL')}` : 'http://localhost');
      request = new Request(url.toString(), request);
    }

    const requestStart = Date.now();
    log(`[${requestId}] Entering React Router handler for ${c.req.path}`);
    const response = await cachedRequestHandler(request);
    log(`[${requestId}] Leaving React Router handler after ${Date.now() - requestStart}ms.`);

    // --- VERCEL 504 HANG WORKAROUND ---
    // Vercel's Node.js runtime has a known issue where piping Web Streams from React Router 
    // can result in lost 'end' events, causing the Lambda to hang for 60s and throw a 504.
    // By buffering the HTML stream into a synchronous string, we completely bypass the streaming proxy bug.
    if (response.body && response.headers.get('Content-Type')?.includes('text/html')) {
        log(`[${requestId}] Buffering HTML response stream...`);
        try {
            // Buffer with an 8-second timeout to strictly prevent 60s Vercel 504s
            const bodyText = await Promise.race([
                response.text(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('HTML Stream Buffering timed out after 8s')), 8000))
            ]) as string;
            
            // Create new headers, stripping chunked encoding if present
            const newHeaders = new Headers(response.headers);
            newHeaders.delete('transfer-encoding');
            
            log(`[${requestId}] Stream buffered successfully. Sending response.`);
            return new Response(bodyText, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        } catch (streamErr) {
            log(`[${requestId}] ERROR buffering stream: ${streamErr}`);
            return new Response('<h1>500 Internal Server Error</h1><p>Rendering timed out. Stream did not close.</p>', { 
                status: 500, 
                headers: { 'Content-Type': 'text/html' } 
            });
        }
    }

    return response as Response;
  });
}

log('Server initialization phase complete.');

export { app };
export default server;
