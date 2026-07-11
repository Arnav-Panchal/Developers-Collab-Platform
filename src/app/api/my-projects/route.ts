import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/my-projects
 * Get all projects owned by the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        requiredSkills: projects.requiredSkills,
        teamSize: projects.teamSize,
        status: projects.status,
      })
      .from(projects)
      .where(eq(projects.ownerId, session.user.id))
      .orderBy(projects.createdAt);

    return NextResponse.json({
      projects: userProjects,
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
