import app from './app';
import { env } from './config/env';
import { getDatabase } from './config/database';

const startServer = async () => {
  try {
    // Initialize Database Connection
    await getDatabase();
    console.log('[Database]: SQLite initialized successfully');

    app.listen(env.PORT, () => {
      console.log(`[Server]: Listening on port ${env.PORT}`);
      console.log(`[Config]: ALLOW_WRITE_QUERIES = ${env.ALLOW_WRITE_QUERIES}`);
    });
  } catch (error) {
    console.error('[Server]: Failed to start', error);
    process.exit(1);
  }
};

startServer();
