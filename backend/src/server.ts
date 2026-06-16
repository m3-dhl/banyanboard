import app from './app';
import { runMigrations } from './db/migrate';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Migration failed:', err);
    process.exit(1);
  });
