import { handle } from 'hono/vercel';
console.error(`[${new Date().toISOString()}] [API-BOOT] Starting bundle evaluation...`);
const bootStart = Date.now();
import { app } from '../build/server/index.js';
console.error(`[${new Date().toISOString()}] [API-BOOT] Bundle evaluation completed in ${Date.now() - bootStart}ms.`);

export const config = { runtime: 'nodejs' };

const h = handle(app);

export default async (req, res) => {
  const invocationId = Math.random().toString(36).substring(7);
  console.error(`[${new Date().toISOString()}] [API-ENTRY] [${invocationId}] LAMBDA_INVOKED: ${req.method} ${req.url}`);
  try {
    const result = await h(req, res);
    return result;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [API-ENTRY] [${invocationId}] LAMBDA_ERROR:`, err);
    throw err;
  }
};
