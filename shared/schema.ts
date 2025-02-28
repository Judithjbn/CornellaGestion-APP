import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(),
  createdAt: text("created_at").notNull(),
});

export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: serial("form_id").references(() => forms.id),
  data: jsonb("data").notNull(),
  driveFileId: text("drive_file_id"),
  submittedAt: text("submitted_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertFormSchema = createInsertSchema(forms);
export const insertSubmissionSchema = createInsertSchema(formSubmissions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'number', 'textarea', 'select', 'checkbox']),
  label: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;
