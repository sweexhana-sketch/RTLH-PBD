import { handle } from 'hono/vercel';
import serverBundle from '../build/server/index.js';

const log = (msg) => {
  console.error(`[${new Date().toISOString()}] [API-ENTRY] ${msg}`);
};

export const config = { runtime: 'nodejs' };

if (!serverBundle || !serverBundle.app) {
    log('CRITICAL ERROR: serverBundle.app is missing!');
}

export default handle(serverBundle.app);
