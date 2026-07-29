import { z } from "zod";

// -------- User Schemas --------

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^\S+$/, "Username cannot contain spaces")
    .optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string()).max(30, "Maximum 30 skills").optional(),
  profilePicture: z.string().url("Must be a valid URL").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// -------- Project Schemas --------

const projectBaseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be at most 150 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be at most 5000 characters"),
  technologies: z
    .array(z.string().min(1))
    .min(1, "At least one technology is required")
    .max(20, "Maximum 20 technologies"),
  requiredSkills: z
    .array(z.string().min(1))
    .min(1, "At least one skill is required")
    .max(20, "Maximum 20 skills"),
  teamSize: z
    .number()
    .int()
    .min(1, "Team size must be at least 1")
    .max(50, "Team size must be at most 50"),
  responsibilities: z
    .string()
    .min(10, "Responsibilities must be at least 10 characters")
    .max(3000),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid end date",
  }),
  githubRepoUrl: z.string().url().optional().or(z.literal("")),
  autoCreateRepo: z.boolean().optional(),
});

export const createProjectSchema = projectBaseSchema.refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = projectBaseSchema.partial().extend({
  status: z.enum(["open", "in-progress", "completed"]).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// -------- Join Request Schemas --------

export const createJoinRequestSchema = z.object({
  message: z
    .string()
    .max(1000, "Message must be at most 1000 characters")
    .optional()
    .default(""),
});

export type CreateJoinRequestInput = z.infer<typeof createJoinRequestSchema>;

// -------- Chat Schemas --------

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be at most 5000 characters"),
  messageType: z.enum(["text", "file", "image"]).default("text"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// -------- Community Schemas --------

const communityBaseSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .default(""),
  type: z.enum(["college", "company", "club", "interest"]),
  visibility: z.enum(["public", "private"]).default("public"),
  city: z.string().max(100).default(""),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  emailDomains: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        // Accept a bare domain only — "vit.ac.in", never "@vit.ac.in" or a URL.
        .regex(
          /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
          "Enter a bare domain like vit.ac.in"
        )
    )
    .max(10, "Maximum 10 email domains")
    .default([]),
});

export const createCommunitySchema = communityBaseSchema.extend({
  parentId: z.string().uuid("Invalid parent community").nullish(),
  instructions: z
    .string()
    .max(20000, "Instructions must be at most 20000 characters")
    .default(""),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

// `parentId` is intentionally absent — reparenting would invalidate every
// descendant path and member's scope, so it is not an edit.
export const updateCommunitySchema = communityBaseSchema.partial();

export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;

export const updateInstructionsSchema = z.object({
  instructions: z
    .string()
    .max(20000, "Instructions must be at most 20000 characters"),
});

export type UpdateInstructionsInput = z.infer<typeof updateInstructionsSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  title: z.string().max(60, "Title must be at most 60 characters").optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const communityFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["college", "company", "club", "interest"]).optional(),
  parentId: z.string().uuid().optional(),
  // "root" restricts results to colleges/companies, useful for parent pickers.
  scope: z.enum(["all", "root"]).default("all"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
  sort: z.enum(["members", "newest", "name"]).default("members"),
});

export type CommunityFilterInput = z.infer<typeof communityFilterSchema>;

// -------- Search & Filter Schemas --------

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  technology: z.string().optional(),
  skill: z.string().optional(),
  status: z.enum(["open", "in-progress", "completed"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
