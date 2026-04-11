export const config = { runtime: 'nodejs' };

let cachedHandler = null;
let bootError = null;

export default async (req, res) => {
  const url = req.url || '/';
  const invocationId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  // STAGE 1: Ultra-fast static asset bypass (raw Node.js, zero imports)
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

  // Report a previous critical boot error so we can see it in logs
  if (bootError) {
    console.error(`[${new Date().toISOString()}] [API-ENTRY] [${invocationId}] Reusing cached BOOT ERROR: ${bootError}`);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html');
    res.end(`<h1>Application Boot Failed</h1><pre>${bootError}</pre>`);
    return;
  }

  // STAGE 2: Lazy-load the Hono machinery on first real request
  if (!cachedHandler) {
    const bootStart = Date.now();
    console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] Starting lazy machinery load...`);
    
    try {
      // Load hono adapter first (lightweight)
      const { handle } = await import('hono/vercel');
      console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] hono/vercel loaded in ${Date.now() - bootStart}ms`);

      // Load the app bundle (this is the heavy one - will take 1-3s on cold start)
      const appModule = await import('../build/server/index.js');
      const { app } = appModule;
      console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] server bundle loaded in ${Date.now() - bootStart}ms`);
      
      if (!app) {
        throw new Error('server bundle exported no "app" instance');
      }
      
      cachedHandler = handle(app);
      console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] Handler ready. Total boot: ${Date.now() - bootStart}ms`);
    } catch (err) {
      bootError = err?.message || String(err);
      console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] CRITICAL BOOT FAILURE (${Date.now() - bootStart}ms):`, err);
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/html');
      res.end(`<h1>Application Boot Failed</h1><pre>${bootError}</pre>`);
      return;
    }
  }

  // STAGE 3: Execute Hono handler
  try {
    console.error(`[${new Date().toISOString()}] [API-ENTRY] [${invocationId}] Delegating ${req.method} ${url}`);
    return await cachedHandler(req, res);
  } catch (err) {
    const errMsg = err?.message || String(err);
    console.error(`[${new Date().toISOString()}] [API-ERROR] [${invocationId}] Handler failed (${Date.now() - startTime}ms): ${errMsg}`);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html');
      res.end(`<h1>500 Internal Server Error</h1><pre>${errMsg}</pre>`);
    }
  }
};
