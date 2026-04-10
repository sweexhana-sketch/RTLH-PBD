import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || (import.meta as any).env?.PROD;
const API_ROOT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');

// Delay polyfill until actual execution to keep boot sterile
let _fetchPolyfilled = false;
function polyfillFetch() {
  if (!_fetchPolyfilled && globalThis.fetch) {
    globalThis.fetch = updatedFetch;
    _fetchPolyfilled = true;
  }
}

// Recursively find all route.js files (Development only)
async function findRouteFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  let routes: string[] = [];

  for (const file of files) {
    try {
      const filePath = join(dir, file);
      const statResult = await stat(filePath);

      if (statResult.isDirectory()) {
        routes = routes.concat(await findRouteFiles(filePath));
      } else if (file === 'route.js') {
        if (filePath === join(API_ROOT_DIR, 'route.js')) {
          routes.unshift(filePath);
        } else {
          routes.push(filePath);
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return routes;
}

// Helper function to transform file path into Hono route path (Development only)
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace(API_ROOT_DIR, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1);
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  return routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
}


// Import and register all routes
async function registerRoutes() {
  polyfillFetch();
  console.log('[DEBUG] registerRoutes: Starting...');
  api.routes = [];

  if (isVercel) {
    console.log('[DEBUG] registerRoutes: Detected Production/Vercel. Scanning API routes via glob...');
    // In production/Vercel, we MUST use static analysis (glob)
    const routeModules = (import.meta as any).glob('../src/app/api/**/route.js');
    console.log(`[DEBUG] registerRoutes: Found ${Object.keys(routeModules).length} API route modules.`);
    for (const [routeFile, importRoute] of Object.entries(routeModules)) {
      const relativePath = routeFile.replace('../src/app/api', '');
      const parts = relativePath.split('/').filter(Boolean);
      const routeParts = parts.slice(0, -1);
      
      const transformedParts = routeParts.length === 0 
        ? [{ name: 'root', pattern: '' }] 
        : routeParts.map((segment) => {
            const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
            if (match) {
              const [_, dots, param] = match;
              return dots === '...'
                ? { name: param, pattern: `:${param}{.+}` }
                : { name: param, pattern: `:${param}` };
            }
            return { name: segment, pattern: segment };
          });
          
      const honoPath = `/${transformedParts.map(({ pattern }) => pattern).join('/')}`;
      
      for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
        const handler: Handler = async (c) => {
          const route: any = await (importRoute as any)();
          if (route[method]) {
            const params = c.req.param();
            return await route[method](c.req.raw, { params });
          }
          return c.text('Method Not Allowed', 405);
        };
        const methodLowercase = method.toLowerCase();
        (api as any)[methodLowercase](honoPath, handler);
      }
    }
    console.log('[DEBUG] registerRoutes: Production API route registration complete.');
  } else {
    console.log('[DEBUG] registerRoutes: Detected Development. Scanning API routes via readdir...');
    // Development logic - only run if NOT on Vercel
    const routeFiles = (
      await findRouteFiles(API_ROOT_DIR).catch((error) => {
        console.error('Error finding route files:', error);
        return [];
      })
    ).slice().sort((a, b) => b.length - a.length);

    console.log(`[DEBUG] registerRoutes: Found ${routeFiles.length} API route files.`);
    for (const routeFile of routeFiles) {
      try {
        const route = await import(/* @vite-ignore */ `${routeFile}?update=${Date.now()}`);
        for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
          if (route[method]) {
            const parts = getHonoPath(routeFile);
            const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
            const handler: Handler = async (c) => {
              const params = c.req.param();
              const updatedRoute = await import(/* @vite-ignore */ `${routeFile}?update=${Date.now()}`);
              return await updatedRoute[method](c.req.raw, { params });
            };
            (api as any)[method.toLowerCase()](honoPath, handler);
          }
        }
      } catch (error) {
        console.error(`Error importing route file ${routeFile}:`, error);
      }
    }
    console.log('[DEBUG] registerRoutes: Development API route registration complete.');
  }
}

let registrationPromise: Promise<void> | null = null;

async function ensureRoutesRegistered() {
  if (registrationPromise) {
    return registrationPromise;
  }
  registrationPromise = registerRoutes().catch((err) => {
    console.error('[DEBUG] registerRoutes critical failure:', err);
    registrationPromise = null; // Allow retry on next request if it failed
    throw err;
  });
  return registrationPromise;
}

// Hot reload routes in development
if (!isVercel && (import.meta as any).env?.DEV) {
  (import.meta as any).glob('../src/app/api/**/route.js', {
    eager: true,
  });
  if ((import.meta as any).hot) {
    (import.meta as any).hot.accept((newSelf: any) => {
      registerRoutes().catch((err) => {
        console.error('Error reloading routes:', err);
      });
    });
  }
}

export { api, API_BASENAME, ensureRoutesRegistered };
