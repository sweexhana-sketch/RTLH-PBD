import { handle } from 'hono/vercel';

const log = (msg) => {
  console.error(`[${new Date().toISOString()}] [API-ENTRY] ${msg}`);
};

log('Loading application bundle from ../build/server/index.js');
let app;
try {
  const module = await import('../build/server/index.js');
  app = module.app;
  if (!app) {
    throw new Error('Export "app" not found in ../build/server/index.js');
  }
  log('Application bundle loaded successfully.');
} catch (err) {
  log(`CRITICAL ERROR: Failed to load application bundle: ${err}`);
  // We rethrow so Vercel captures the failure, but we've logged it.
  throw err;
}

export const config = { runtime: 'nodejs' };

export default handle(app);
