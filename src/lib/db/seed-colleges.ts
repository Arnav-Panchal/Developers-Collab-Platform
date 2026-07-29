import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { resolve } from "path";
import { eq } from "drizzle-orm";
import { communities } from "./schema";
import { deriveIdentity } from "../communities";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config();

/**
 * Seed the curated institution registry.
 *
 *   npm run db:seed-colleges
 *
 * Root-level colleges and companies are admin-curated on purpose — there is
 * exactly one VIT Vellore, so letting anyone create it is what produces the
 * duplicate-name mess in the first place. This script is idempotent: rows are
 * matched on their derived path and skipped if already present.
 *
 * `emailDomains` drives the verified badge — a member signing up with an
 * address on one of these domains is auto-verified. Double-check a domain
 * before adding it; a wrong one simply means nobody from that institution gets
 * verified.
 */
type Seed = {
  name: string;
  city: string;
  website: string;
  emailDomains: string[];
  description: string;
};

const COLLEGES: Seed[] = [
  {
    name: "IIT Bombay",
    city: "Mumbai",
    website: "https://www.iitb.ac.in",
    emailDomains: ["iitb.ac.in"],
    description: "Indian Institute of Technology Bombay, Powai.",
  },
  {
    name: "IIT Delhi",
    city: "New Delhi",
    website: "https://home.iitd.ac.in",
    emailDomains: ["iitd.ac.in"],
    description: "Indian Institute of Technology Delhi, Hauz Khas.",
  },
  {
    name: "IIT Madras",
    city: "Chennai",
    website: "https://www.iitm.ac.in",
    emailDomains: ["iitm.ac.in", "smail.iitm.ac.in"],
    description: "Indian Institute of Technology Madras.",
  },
  {
    name: "IIIT Hyderabad",
    city: "Hyderabad",
    website: "https://www.iiit.ac.in",
    emailDomains: ["iiit.ac.in", "students.iiit.ac.in"],
    description:
      "International Institute of Information Technology, Hyderabad.",
  },
  {
    name: "NIT Trichy",
    city: "Tiruchirappalli",
    website: "https://www.nitt.edu",
    emailDomains: ["nitt.edu"],
    description: "National Institute of Technology, Tiruchirappalli.",
  },
  {
    name: "BITS Pilani",
    city: "Pilani",
    website: "https://www.bits-pilani.ac.in",
    // BITS runs multiple campuses on separate subdomains.
    emailDomains: [
      "pilani.bits-pilani.ac.in",
      "goa.bits-pilani.ac.in",
      "hyderabad.bits-pilani.ac.in",
    ],
    description: "Birla Institute of Technology and Science, Pilani.",
  },
  {
    name: "VIT Vellore",
    city: "Vellore",
    website: "https://vit.ac.in",
    emailDomains: ["vit.ac.in", "vitstudent.ac.in"],
    description: "Vellore Institute of Technology.",
  },
  {
    name: "SRM Chennai",
    city: "Chennai",
    website: "https://www.srmist.edu.in",
    emailDomains: ["srmist.edu.in"],
    description: "SRM Institute of Science and Technology, Kattankulathur.",
  },
  {
    name: "Delhi Technological University",
    city: "New Delhi",
    website: "https://dtu.ac.in",
    emailDomains: ["dtu.ac.in"],
    description: "Delhi Technological University, formerly DCE.",
  },
  {
    name: "Manipal Institute of Technology",
    city: "Manipal",
    website: "https://manipal.edu",
    emailDomains: ["learner.manipal.edu", "manipal.edu"],
    description: "Manipal Institute of Technology, MAHE.",
  },
];

const connectionString = (
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  ""
).split("?")[0];

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  let created = 0;
  let skipped = 0;

  try {
    for (const college of COLLEGES) {
      const identity = deriveIdentity(college.name);
      if (!identity) {
        console.warn(`  skip  ${college.name} — name has no slug-able content`);
        continue;
      }

      // Root communities have no parent prefix, so path === slug.
      const existing = await db
        .select({ id: communities.id })
        .from(communities)
        .where(eq(communities.path, identity.slug))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        console.log(`  skip  ${college.name} (/${identity.slug} already exists)`);
        continue;
      }

      await db.insert(communities).values({
        name: college.name,
        slug: identity.slug,
        nameKey: identity.nameKey,
        path: identity.slug,
        type: "college",
        parentId: null,
        description: college.description,
        city: college.city,
        website: college.website,
        emailDomains: college.emailDomains,
        // Seeded by an admin from the real institution's details.
        isVerified: true,
        // Nobody personally owns an institution row; site admins manage it.
        ownerId: null,
        memberCount: 0,
      });

      created++;
      console.log(`  add   ${college.name} -> /communities/${identity.slug}`);
    }

    console.log(`\n${created} created, ${skipped} already present.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
