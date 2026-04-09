import { handle } from 'hono/vercel';
import { app } from '../build/server/index.js';

const log = (msg) => {
  console.error(`[${new Date().toISOString()}] [API-ENTRY] ${msg}`);
};

export const config = { runtime: 'nodejs' };

if (!app) {
    log('CRITICAL ERROR: app is missing from ../build/server/index.js!');
}

export default handle(app);
