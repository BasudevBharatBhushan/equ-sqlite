import app from './app';
import { env } from './config/env';
import { getDatabase } from './config/database';

const startServer = async () => {
  try {
    // Initialize Database Connection
    await getDatabase();
    console.log('[Database]: SQLite initialized successfully');

    const server = app.listen(env.PORT, () => {
      console.log(`[Server]: Listening on port ${env.PORT}`);
      console.log(`[Config]: ALLOW_WRITE_QUERIES = ${env.ALLOW_WRITE_QUERIES}`);
    });

    // Increase timeouts to handle large file uploads (5 minutes)
    server.timeout = 300000;
    server.keepAliveTimeout = 300000;
    server.headersTimeout = 300000;
    server.requestTimeout = 300000;
  } catch (error) {
    console.error('[Server]: Failed to start', error);
    process.exit(1);
  }
};

startServer();
