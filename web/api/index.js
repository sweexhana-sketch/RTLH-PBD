import { handle } from 'hono/vercel';
import { app } from '../build/server/index.js';

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
