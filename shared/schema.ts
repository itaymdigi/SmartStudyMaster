import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  materials: text("materials").notNull(),
  questions: jsonb("questions").$type<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[]>().notNull(),
  score: integer("score"),
  completed: boolean("completed").default(false),
  timeSpent: integer("time_spent"), // Time spent in seconds
  createdAt: timestamp("created_at").defaultNow(),
  studyMode: boolean("study_mode").default(false) // New field to differentiate study mode from quiz mode
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  subject: true,
  gradeLevel: true,
  materials: true,
  questions: true,
  studyMode: true
});

export const studyFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  materials: z.string().min(10, "Please provide more context about study materials"),
  studyMode: z.boolean().optional()
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type StudyForm = z.infer<typeof studyFormSchema>;