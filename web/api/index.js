export const config = { runtime: 'nodejs' };

let cachedApp = null;
let bootError = null;

const getApp = async (invocationId) => {
  if (bootError) throw new Error(`Previous boot failed: ${bootError}`);
  if (cachedApp) return cachedApp;

  const start = Date.now();
  console.error(`[${new Date().toISOString()}] [BOOT] [${invocationId}] Loading server bundle...`);
  
  const { app } = await import('../build/server/index.js');
  if (!app) throw new Error('Server bundle exported no "app" instance');
  
  cachedApp = app;
  console.error(`[${new Date().toISOString()}] [BOOT] [${invocationId}] Server bundle ready in ${Date.now() - start}ms`);
  return cachedApp;
};

export default async (req, res) => {
  const url = req.url || '/';
  const id = Math.random().toString(36).substring(7);

  // ── STAGE 1: Fast bypasses (no import needed) ──────────────────────────────
  if (url === '/favicon.ico' || url === '/favicon.png' || url.startsWith('/favicon')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end('Not Found');
    return;
  }
  if (url === '/health' || url === '/ping') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', ts: Date.now() }));
    return;
  }

  // ── STAGE 2: Load Hono app (lazy, cached after first load) ─────────────────
  let app;
  try {
    app = await getApp(id);
  } catch (err) {
    const msg = err?.message || String(err);
    bootError = msg;
    console.error(`[${new Date().toISOString()}] [BOOT-FAIL] [${id}]`, err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Service Unavailable</h1><pre>${msg}</pre>`);
    return;
  }

  // ── STAGE 3: Build a Web Fetch API Request from Node.js IncomingMessage ────
  let request;
  try {
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const host = req.headers['host'] || 'localhost';
    const fullUrl = `${proto}://${host}${url}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && key !== 'host') {
        headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      }
    }

    const hasBody = !['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes((req.method || 'GET').toUpperCase());
    let body;
    if (hasBody) {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    request = new Request(fullUrl, {
      method: req.method || 'GET',
      headers,
      body: hasBody && body?.length > 0 ? body : undefined,
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [REQ-BUILD-FAIL] [${id}]`, err);
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  // ── STAGE 4: Invoke Hono via Web Fetch API and write Node.js response ───────
  console.error(`[${new Date().toISOString()}] [REQ] [${id}] ${req.method} ${url}`);
  const reqStart = Date.now();

  try {
    // Call Hono directly — no hono/vercel handle() adapter needed
    const response = await app.fetch(request, {
      // Inject Vercel env vars as bindings (same as what hono/vercel does internally)
      ...process.env,
    });

    console.error(`[${new Date().toISOString()}] [REQ] [${id}] Hono responded: ${response.status} in ${Date.now() - reqStart}ms`);

    // Write status
    res.statusCode = response.status;

    // Write headers (skip headers that conflict with Node.js HTTP)
    const skipHeaders = new Set(['connection', 'keep-alive', 'transfer-encoding', 'upgrade']);
    for (const [key, value] of response.headers.entries()) {
      if (!skipHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Write body — always call res.end() to prevent Vercel 60s timeout
    if (response.body) {
      const bodyText = await response.text();
      res.end(bodyText);
    } else {
      res.end();
    }

    console.error(`[${new Date().toISOString()}] [REQ] [${id}] Response end() called. Total: ${Date.now() - reqStart}ms`);
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(`[${new Date().toISOString()}] [REQ-ERROR] [${id}] ${Date.now() - reqStart}ms: ${msg}`);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html');
      res.end(`<h1>500 Internal Server Error</h1><pre>${msg}</pre>`);
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};
