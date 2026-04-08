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
  try {
    const result = await neonClient(strings, ...values);
    console.error(`[${new Date().toISOString()}] [DB-QUERY] Success (${Date.now() - start}ms)`);
    return result;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DB-QUERY] FAILED after ${Date.now() - start}ms:`, error);
    throw error;
  }
};

export default sql;