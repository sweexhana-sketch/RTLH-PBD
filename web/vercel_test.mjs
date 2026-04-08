import { handle } from 'hono/vercel';
import { app } from './build/server/index.js';

const handler = handle(app);

const reqMock = {
  method: 'GET',
  url: '/',
  headers: {
    host: 'localhost',
  },
};
const resMock = {
  statusCode: 200,
  setHeader: (k, v) => console.log('setHeader', k, v),
  end: (str) => console.log('Response ended', str?.length),
  write: (chunk) => console.log('write chunk', chunk?.length),
  on: () => {},
};

handler(reqMock, resMock).then(() => console.log('Handler returned!')).catch(e => console.error('Handler error', e));
