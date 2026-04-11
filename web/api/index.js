export const config = { runtime: 'nodejs' };

let cachedHandler = null;

export default async (req, res) => {
  const url = req.url || '/';
  const invocationId = Math.random().toString(36).substring(7);
  
  // 1. ULTRA-FAST BYPASS (Raw Node.js Logic)
  // This ensures these routes respond in <10ms even on a cold start
  // because no Hono or App code is loaded yet.
  if (url === '/favicon.ico' || url.includes('favicon')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
    return;
  }
  
  if (url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
    return;
  }

  // 2. LAZY LOAD MACHINERY (Hono + App)
  if (!cachedHandler) {
    const bootStart = Date.now();
    console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] [v10] Lazy loading machinery...`);
    
    try {
      // DYNAMIC DEFERRAL: This is the key to solving 60s cold starts.
      // We load the heavy server bundle ONLY when a real request arrives.
      const [{ handle }, { app }] = await Promise.all([
        import('hono/vercel'),
        import('../build/server/index.js')
      ]);
      
      cachedHandler = handle(app);
      console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] [v10] Machinery loaded in ${Date.now() - bootStart}ms.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] [API-BOOT] [${invocationId}] [v10] CRITICAL LOAD FAILURE:`, err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error: Application failed to boot.');
      return;
    }
  }

  // 3. EXECUTE HONO HANDLER
  try {
    return await cachedHandler(req, res);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [API-ERROR] [${invocationId}] Handler execution failed:`, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};
