import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { resolve } from "path";
import { eq, or } from "drizzle-orm";
import { users } from "./schema";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config();

/**
 * Grant site-admin rights to a user.
 *
 *   npm run db:make-admin -- you@example.com
 *   npm run db:make-admin -- your-username
 *
 * Site admins are the only accounts that can create root-level colleges and
 * companies, which is what keeps duplicate institutions out of the platform.
 */
const connectionString = (
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  ""
).split("?")[0];

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error("Usage: npm run db:make-admin -- <email|username>");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  try {
    const updated = await db
      .update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .returning({
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
      });

    if (updated.length === 0) {
      console.error(`No user matched "${identifier}".`);
      console.error("Sign in via GitHub once to create the account first.");
      process.exitCode = 1;
      return;
    }

    for (const user of updated) {
      console.log(`✓ @${user.username} (${user.email}) is now a site admin.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed to grant admin:", err);
  process.exit(1);
});
