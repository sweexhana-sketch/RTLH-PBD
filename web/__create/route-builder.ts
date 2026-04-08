import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

// Get current directory
const __dirname = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Recursively find all route.js files
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
        // Handle root route.js specially
        if (filePath === join(__dirname, 'route.js')) {
          routes.unshift(filePath); // Add to beginning of array
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

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace(__dirname, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || (import.meta as any).env?.PROD;

// Import and register all routes
async function registerRoutes() {
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
      await findRouteFiles(__dirname).catch((error) => {
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

console.log('[DEBUG] route-builder: Initializing top-level registerRoutes await...');
// Initial route registration
await registerRoutes();
console.log('[DEBUG] route-builder: Top-level registerRoutes await complete.');

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

export { api, API_BASENAME };
