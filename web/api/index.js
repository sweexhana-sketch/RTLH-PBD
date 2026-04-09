

const log = (msg) => {
  console.error(`[${new Date().toISOString()}] [API-ENTRY] ${msg}`);
};

log('Loading application bundle from ../build/server/index.js');
let app;

export const config = { runtime: 'nodejs' };

export default async function (request, context) {
  if (!app) {
    try {
      const module = await import('../build/server/index.js');
      app = module.app;
      if (!app) throw new Error('Export "app" not found');
      log('Application bundle loaded successfully.');
    } catch (err) {
      log(`CRITICAL ERROR: Failed to load application bundle: ${err}`);
      throw err;
    }
  }
  
  return app.fetch(request, /* env */ process.env, context);
}
