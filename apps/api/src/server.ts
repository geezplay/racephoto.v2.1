import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

connectDB();

const PORT = process.env.PORT || 5000;
const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

function startServer(retryCount = 0): void {
  const server = app.listen(PORT, () => {
    console.log(`RacePhoto API Server Started on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && retryCount < MAX_RETRIES) {
      console.log(`Port ${PORT} is busy, retrying in ${RETRY_DELAY / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => startServer(retryCount + 1), RETRY_DELAY);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer();

export default app;
