import { neon } from '@neondatabase/serverless';

const NullishQueryFunction = () => {
  throw new Error(
    'No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set'
  );
};
NullishQueryFunction.transaction = () => {
  throw new Error(
    'No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set'
  );
};
const neonClient = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : NullishQueryFunction;

const sql = async (strings, ...values) => {
  const start = Date.now();
  const queryTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('DATABASE_TIMEOUT: Query took longer than 10s')), 10000);
  });

  try {
    const result = await Promise.race([
      neonClient(strings, ...values),
      queryTimeout
    ]);
    console.error(`[${new Date().toISOString()}] [DB-QUERY] Success (${Date.now() - start}ms)`);
    return result;
  } catch (error) {
    const isTimeout = error.message?.includes('DATABASE_TIMEOUT');
    console.error(`[${new Date().toISOString()}] [DB-QUERY] ${isTimeout ? 'TIMED OUT' : 'FAILED'} after ${Date.now() - start}ms:`, error);
    throw error;
  }
};

export default sql;