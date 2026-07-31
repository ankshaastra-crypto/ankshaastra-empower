/**
 * CLI: same DB init as GET /api/admin/init-db (see api/admin/init-db.js).
 *
 *   npm run db:setup
 */
import 'dotenv/config';
import { initDatabaseSchema, INIT_DB_MESSAGE } from '../server/handlers/admin/init-db.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL. Add it to .env (see .env.example).');
    process.exit(1);
  }

  const result = await initDatabaseSchema({ closePool: true });
  if (!result.ok) {
    console.error('❌', result.message);
    process.exit(1);
  }

  console.log('✅', INIT_DB_MESSAGE);
}

main().catch((err) => {
  console.error('❌ db:setup failed:', err.message);
  process.exit(1);
});
