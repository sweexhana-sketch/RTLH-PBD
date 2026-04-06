import { handle } from '@hono/node-server/vercel';
import { app } from '../build/server/index.js';

export default handle(app);
